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
export const POST = rateLimiters.api(async (req: NextRequest): Promise<Response> => {
  try {
    const body = (await req.json()) as Partial<CreateOrderBody>;
    const planId = body?.planId ?? null;
    const currency = (body?.currency || "INR").toUpperCase();

    // Require user authentication
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Validate plan and get secure price from DB
    let secureAmountMinor = 0;
    if (planId) {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
        columns: { id: true, price: true },
      });
      
      if (!plan) {
        return NextResponse.json(
          { success: false, error: "Invalid planId" },
          { status: 400 }
        );
      }
      
      // Calculate amount strictly from the database price
      const priceNumber = parseFloat(String(plan.price).replace(/[^0-9.]/g, '')) || 0;
      secureAmountMinor = Math.round(priceNumber * 100);
    } else {
      return NextResponse.json(
        { success: false, error: "planId is required for subscription checkout" },
        { status: 400 }
      );
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
      amountMinor: secureAmountMinor,
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
      amount: secureAmountMinor / 100, // CreateOrderInput takes major units
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
      rawRequest: { amountMinor: secureAmountMinor, currency, planId, internalOrderId },
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
