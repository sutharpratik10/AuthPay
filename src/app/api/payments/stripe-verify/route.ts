// src/app/api/payments/stripe-verify/route.ts
//
// Called from the success page after Stripe redirect.
// Verifies the Checkout Session with Stripe and, if paid,
// ensures both the payment order AND the user subscription are activated.
//
// This acts as a reliable fallback for the webhook — in local development
// (or when webhooks are delayed/unavailable), the subscription is still created.
//
// GET /api/payments/stripe-verify?session_id=cs_xxx

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import "@/lib/payments/providers/stripe";
import { StripeProvider } from "@/lib/payments/providers/stripe";
import { getPaymentProvider } from "@/lib/payments/gateway";
import { db } from "@/server/db";
import {
  paymentOrders,
  paymentTransactions,
  userSubscriptions,
  subscriptionPlans,
  subscriptionStatuses,
  subscriptionRenewalTypes,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing session_id" }, { status: 400 });
  }

  try {
    const provider = getPaymentProvider("stripe") as StripeProvider;
    const isPaid = await provider.verifyPayment({ sessionId });

    if (isPaid) {
      // Mark order as success
      const [updatedOrder] = await db
        .update(paymentOrders)
        .set({ status: "success", updatedAt: new Date() })
        .where(eq(paymentOrders.providerOrderId, sessionId))
        .returning({
          id: paymentOrders.id,
          userId: paymentOrders.userId,
          planId: paymentOrders.planId,
        });

      // Activate subscription if not already activated (webhook may not have fired yet)
      if (updatedOrder?.userId && updatedOrder?.planId) {
        await ensureSubscriptionActivated({
          userId: updatedOrder.userId,
          planId: updatedOrder.planId,
          sessionId,
        });
      }
    }

    return NextResponse.json({ success: true, paid: isPaid });
  } catch (err) {
    console.error("[stripe-verify] Error:", err);
    return NextResponse.json({ success: false, error: "Verification error" }, { status: 500 });
  }
}

/**
 * Activates the subscription in our database if not already activated.
 * This is a fallback for the webhook — idempotent so it's safe to call
 * even if the webhook already created the subscription record.
 */
async function ensureSubscriptionActivated({
  userId,
  planId,
  sessionId,
}: {
  userId: string;
  planId: string;
  sessionId: string;
}) {
  // Check if the webhook already created a subscription for this user + plan
  // with an active status (avoid duplicates)
  const activeStatus = await db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, "active"),
  });
  if (!activeStatus) {
    console.warn("[stripe-verify] 'active' subscription status not found in DB");
    return;
  }

  const existingSub = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.planId, planId),
      eq(userSubscriptions.statusId, activeStatus.id)
    ),
  });

  if (existingSub) {
    // Already activated (likely by webhook) — nothing to do
    return;
  }

  // Fetch plan details for billing cycle
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, planId),
    columns: { id: true, billingCycle: true },
  });
  if (!plan) return;

  const renewalType = await db.query.subscriptionRenewalTypes.findFirst({
    where: eq(subscriptionRenewalTypes.name, "auto"),
  });

  // Retrieve the Stripe session to get subscription and customer IDs
  let stripeSubscriptionId: string | null = null;
  let stripeCustomerId: string | null = null;
  try {
    const stripeProvider = getPaymentProvider("stripe") as StripeProvider;
    // Access the underlying Stripe client to retrieve session details
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      const stripe = new Stripe(secretKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;
      stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;
    }
  } catch (err) {
    console.warn("[stripe-verify] Could not retrieve Stripe session details:", err);
  }

  const now = new Date();
  const interval = plan.billingCycle === "yearly" ? "year" : "month";
  const expiry = new Date(now);
  if (interval === "year") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  await db.insert(userSubscriptions).values({
    userId,
    planId,
    statusId: activeStatus.id,
    renewalTypeId: renewalType?.id,
    providerSubscriptionId: stripeSubscriptionId,
    providerCustomerId: stripeCustomerId,
    startDate: now.toISOString(),
    expiryDate: expiry.toISOString(),
    paymentGatewayProvider: "stripe",
    lastPaymentDate: now.toISOString(),
    nextBillingDate: expiry.toISOString(),
  });

  console.log(
    `[stripe-verify] Subscription activated for user ${userId}, plan ${planId}`
  );
}
