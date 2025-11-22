// app/api/payments/razorpay-create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import { paymentOrders, paymentTransactions, users, subscriptionPlans } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments/gateway";
import type { CreateOrderResult } from "@/lib/payments/gateway";
import "@/lib/payments/providers/razorpay";
import { rateLimiters } from '@/lib/middleware/rate-limit';

export const runtime = "nodejs";

interface CreateOrderBody {
  amount: number;          // major units
  currency?: string;       // default INR
  planId?: string | null;  // UUID of plan
}

/**
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(async (req: NextRequest) =>req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateOrderBody>;
    const rawAmount = Number(body?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    const currency = (body?.currency || "INR").toUpperCase();
    const planId = body?.planId ?? null;

    // (optional) validate plan exists if planId was provided
    if (planId) {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
        columns: { id: true },
      });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Invalid planId" }, { status: 400 });
      }
    }

    // --- Resolve userId from session (fallback via email) ---
    let userId: string | null = null;
    try {
      interface SessionUser {
        id?: string;
        email?: string;
      }
      interface Session {
        user?: SessionUser;
      }
      const session = await auth() as Session | null;
      const sid = session?.user?.id as string | undefined;
      if (sid) {
        userId = sid;
      } else if (session?.user?.email) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, session.user.email),
          columns: { id: true },
        });
        userId = user?.id ?? null;
      }
    } catch {
      // unauthenticated creates an order without userId
    }

    // internal order ref (our receipt)
    const internalOrderId = nanoid(16);

    // --- Insert payment_orders with userId + planId (schema-safe) ---
    const insertValues: typeof paymentOrders.$inferInsert = {
      userId: userId ?? undefined,
      planId: planId ?? undefined,
      orderId: internalOrderId,
      provider: "razorpay",
      providerOrderId: null,
      providerTransactionId: null,
      amountMinor: Math.round(rawAmount * 100),
      currency,
      status: "created",
      // (add other fields ONLY if they exist in your schema type)
    };

    const [orderRecord] = await db
      .insert(paymentOrders)
      .values(insertValues)
      .returning({ id: paymentOrders.id });

    const paymentOrderId = orderRecord.id;

    // create external order
    const provider = getPaymentProvider("razorpay");
    const providerOrder = await provider.createOrder({
      receipt: internalOrderId,
      amount: rawAmount,
      currency,
      notes: { planId, userId },
    });

    // update our payment_orders with provider order id
    await db
      .update(paymentOrders)
      .set({ providerOrderId: providerOrder.id as string })
      .where(eq(paymentOrders.id, paymentOrderId));

    // log "created" transaction
    await db.insert(paymentTransactions).values({
      paymentOrderId,
      provider: "razorpay",
      event: "created",
      status: "initiated",
      providerOrderId: providerOrder.id as string,
      providerTransactionId: null,
      message: "Order created",
      rawRequest: { amount: rawAmount, currency, planId, internalOrderId },
      rawResponse: providerOrder as CreateOrderResult,
      receivedAt: new Date(),
    });

    return NextResponse.json({ success: true, order: providerOrder });
  } catch (error: unknown) {
    let message = "Failed to create order";
    if (typeof error === "object" && error) {
      const m = error as { message?: string; description?: string };
      message = m?.message || m?.description || message;
    }
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
