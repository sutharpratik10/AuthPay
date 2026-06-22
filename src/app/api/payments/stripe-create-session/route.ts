// src/app/api/payments/stripe-create-session/route.ts
//
// Creates a Stripe Checkout Session for a given plan.
// The frontend receives a `checkoutUrl` and redirects the user there.
//
// POST /api/payments/stripe-create-session
// Body: { amount, currency?, planId?, planName?, billingInterval?, stripePriceId? }
// Response: { success: true, checkoutUrl: string, sessionId: string }

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import {
  paymentOrders,
  paymentTransactions,
  users,
  subscriptionPlans,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments/gateway";
import type { CreateOrderResult } from "@/lib/payments/gateway";
import "@/lib/payments/providers/stripe";
import type { StripeCreateOrderInput } from "@/lib/payments/providers/stripe";
import { rateLimiters } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

interface CreateSessionBody {
  amount: number;
  currency?: string;
  planId?: string | null;
  planName?: string;
  billingInterval?: "month" | "year";
  stripePriceId?: string;
  mode?: "payment" | "subscription";
}

/**
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(
  async (req: NextRequest): Promise<Response> => {
    try {
      const body = (await req.json()) as Partial<CreateSessionBody>;
      const rawAmount = Number(body?.amount);
      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount" },
          { status: 400 }
        );
      }

      const currency = (body?.currency || "USD").toUpperCase();
      const planId = body?.planId ?? null;
      const planName = body?.planName ?? "Subscription";
      const billingInterval = body?.billingInterval ?? "month";
      const mode = body?.mode ?? "subscription";
      const stripePriceId = body?.stripePriceId;

      // Validate plan if planId provided
      if (planId) {
        const plan = await db.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.id, planId),
          columns: { id: true },
        });
        if (!plan) {
          return NextResponse.json(
            { success: false, error: "Invalid planId" },
            { status: 400 }
          );
        }
      }

      // Resolve userId from session
      let userId: string | null = null;
      let customerEmail: string | undefined;
      try {
        interface SessionUser {
          id?: string;
          email?: string;
        }
        interface Session {
          user?: SessionUser;
        }
        const session = (await auth()) as Session | null;
        const sid = session?.user?.id as string | undefined;
        if (sid) {
          userId = sid;
          customerEmail = session?.user?.email;
        } else if (session?.user?.email) {
          const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
            columns: { id: true, email: true },
          });
          userId = user?.id ?? null;
          customerEmail = user?.email;
        }
      } catch {
        // Unauthenticated — allowed for guest checkouts
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const internalOrderId = nanoid(16);

      // Persist the order BEFORE hitting Stripe (so we have a record even on failure)
      const [orderRecord] = await db
        .insert(paymentOrders)
        .values({
          userId: userId ?? undefined,
          planId: planId ?? undefined,
          orderId: internalOrderId,
          provider: "stripe",
          providerOrderId: null,
          providerTransactionId: null,
          amountMinor: Math.round(rawAmount * 100),
          currency: currency.slice(0, 3), // schema: varchar(3)
          status: "created",
        })
        .returning({ id: paymentOrders.id });

      const paymentOrderId = orderRecord.id;

      // Create Stripe Checkout Session
      const stripeInput: StripeCreateOrderInput = {
        receipt: internalOrderId,
        amount: rawAmount,
        currency,
        planName,
        billingInterval,
        mode,
        stripePriceId,
        customerEmail,
        successUrl: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe&order_id=${internalOrderId}`,
        cancelUrl: `${appUrl}/pricing`,
        notes: { planId, userId },
      };

      const provider = getPaymentProvider("stripe");
      const providerOrder = (await provider.createOrder(
        stripeInput
      )) as CreateOrderResult & { checkoutUrl: string };

      // Update order with Stripe session ID
      await db
        .update(paymentOrders)
        .set({ providerOrderId: providerOrder.id })
        .where(eq(paymentOrders.id, paymentOrderId));

      // Log transaction
      await db.insert(paymentTransactions).values({
        paymentOrderId,
        provider: "stripe",
        event: "created",
        status: "initiated",
        providerOrderId: providerOrder.id,
        providerTransactionId: null,
        message: "Stripe checkout session created",
        rawRequest: {
          amount: rawAmount,
          currency,
          planId,
          internalOrderId,
        } as Record<string, unknown>,
        rawResponse: providerOrder as unknown as Record<string, unknown>,
        receivedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: providerOrder.checkoutUrl,
        sessionId: providerOrder.id,
        orderId: internalOrderId,
      });
    } catch (error: unknown) {
      let message = "Failed to create Stripe session";
      if (typeof error === "object" && error) {
        const e = error as { message?: string };
        message = e?.message || message;
      }
      console.error("[stripe-create-session] Error:", error);
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  }
);
