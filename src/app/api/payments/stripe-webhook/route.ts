// src/app/api/payments/stripe-webhook/route.ts
//
// Handles Stripe webhook events.
// IMPORTANT: This endpoint must NOT parse the body with NextRequest.json() because
// Stripe requires the raw body bytes for signature verification.
//
// Events handled:
//   - checkout.session.completed  → mark order paid + activate subscription
//   - invoice.payment_succeeded   → recurring subscription renewal
//   - invoice.payment_failed      → mark subscription as past_due
//
// Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://yourdomain.com/api/payments/stripe-webhook
//   Events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/server/db";
import {
  paymentOrders,
  paymentTransactions,
  subscriptionPlans,
  userSubscriptions,
  subscriptionStatuses,
  subscriptionRenewalTypes,
} from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import "@/lib/payments/providers/stripe";
import { StripeProvider } from "@/lib/payments/providers/stripe";
import { getPaymentProvider } from "@/lib/payments/gateway";
import { NotificationService } from "@/server/services/notification";

export const runtime = "nodejs";

// Next.js App Router: disable body parsing so we get the raw buffer
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // Read raw body as Buffer
  const rawBody = await req.arrayBuffer();
  const rawBuffer = Buffer.from(rawBody);

  let event: Stripe.Event;
  try {
    const provider = getPaymentProvider("stripe") as StripeProvider;
    event = provider.verifyWebhookSignature(rawBuffer, sig);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      case "charge.refund.updated":
      case "refund.created":
      case "refund.updated":
      case "refund.failed":
        await handleRefundEvent(event);
        break;

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] Handler error for ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — log the error for manual inspection
    return NextResponse.json({ received: true, warning: "Handler error logged" });
  }
}

async function handleRefundEvent(event: Stripe.Event) {
  const refund = event.data.object as Stripe.Refund;
  const { refundService } = await import("@/server/services/refund");
  
  if (event.type === 'refund.failed') {
    await refundService.handleWebhookUpdate(refund.id, 'failed', refund);
  } else {
    // For created/updated events, check status
    if (refund.status === 'succeeded') {
      await refundService.handleWebhookUpdate(refund.id, 'succeeded', refund);
    } else if (refund.status === 'failed' || refund.status === 'canceled') {
      await refundService.handleWebhookUpdate(refund.id, 'failed', refund);
    }
  }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const internalOrderId = session.client_reference_id;
  const stripeSessionId = session.id;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (!internalOrderId) {
    console.warn("[stripe-webhook] checkout.session.completed missing client_reference_id");
    return;
  }

  // Find our payment order
  const order = await db.query.paymentOrders.findFirst({
    where: eq(paymentOrders.orderId, internalOrderId),
  });
  if (!order) {
    console.warn(`[stripe-webhook] No payment order found for orderId: ${internalOrderId}`);
    return;
  }

  await db.transaction(async (tx) => {
    // Check if the order was already successfully processed (Idempotency)
    const alreadyProcessed = await tx.query.paymentTransactions.findFirst({
      where: and(
        eq(paymentTransactions.providerOrderId, stripeSessionId),
        eq(paymentTransactions.event, "checkout.session.completed")
      )
    });
    
    if (alreadyProcessed) {
      console.log(`[stripe-webhook] Session ${stripeSessionId} already processed.`);
      return;
    }

    // Update order status
    await tx
      .update(paymentOrders)
      .set({
        status: "success",
        providerTransactionId: stripeSubscriptionId ?? stripeSessionId,
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, order.id));

    // Log transaction
    await tx.insert(paymentTransactions).values({
      paymentOrderId: order.id,
      provider: "stripe",
      event: "checkout.session.completed",
      status: "success",
      providerOrderId: stripeSessionId,
      providerTransactionId: stripeSubscriptionId ?? stripeSessionId,
      message: "Stripe checkout completed",
      rawResponse: session as unknown as Record<string, unknown>,
      receivedAt: new Date(),
    });

    // Activate subscription if planId is available
    if (order.planId && order.userId) {
      await activateStripeSubscriptionInTx(tx, {
        userId: order.userId,
        planId: order.planId,
        stripeSubscriptionId,
        stripeCustomerId,
        paymentOrderId: order.id,
      });
    }
  });

  if (order.planId && order.userId) {
    const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, order.planId) });
    await NotificationService.createUserNotification(
      order.userId,
      "Subscription Activated",
      `Your subscription to ${plan?.name || "Plan"} has been successfully activated.`,
      "success"
    ).catch(err => console.error(err));
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Renew subscription end date on successful recurring payment
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const stripeSubId =
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : null;
  const paymentIntentId = typeof invoiceAny.payment_intent === 'string' ? invoiceAny.payment_intent : (invoiceAny.payment_intent as any)?.id;
  if (!stripeSubId) return;

  // Find user subscription by providerSubscriptionId field
  const sub = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.providerSubscriptionId, stripeSubId),
  });
  if (!sub) return;

  // Extend expiry by the billing period (Stripe sends next period end)
  const lines = invoiceAny.lines as { data?: Array<{ period?: { end?: number } }> } | undefined;
  const periodEnd = lines?.data?.[0]?.period?.end;
  
  if (periodEnd) {
    await db.transaction(async (tx) => {
      // Create a payment order for the recurring invoice
      const [newOrder] = await tx.insert(paymentOrders).values({
        userId: sub.userId,
        planId: sub.planId,
        orderId: `inv-${invoice.id}`,
        provider: 'stripe',
        providerOrderId: invoice.id,
        providerTransactionId: paymentIntentId || invoice.id,
        amountMinor: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        status: 'success',
      }).returning({ id: paymentOrders.id });

      if (newOrder) {
        await tx.insert(paymentTransactions).values({
          paymentOrderId: newOrder.id,
          provider: "stripe",
          event: "invoice.payment_succeeded",
          status: "success",
          providerOrderId: invoice.id,
          providerTransactionId: paymentIntentId || invoice.id,
          message: "Stripe recurring invoice paid",
          rawResponse: invoice as unknown as Record<string, unknown>,
          receivedAt: new Date(),
        });
      }

      await tx
        .update(userSubscriptions)
        .set({
          paymentOrderId: newOrder?.id,
          nextBillingDate: new Date(periodEnd * 1000).toISOString(),
          lastPaymentDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userSubscriptions.id, sub.id));
    });

    await NotificationService.createUserNotification(
      sub.userId,
      "Payment Successful",
      `Your recurring subscription payment of ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)} was successful.`,
      "success"
    ).catch(err => console.error(err));
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const stripeSubId =
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : null;
  if (!stripeSubId) return;

  // Find subscription and mark as past_due
  const pastDueStatus = await db.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, "past_due"),
  });
  if (!pastDueStatus) return;

  const sub = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.providerSubscriptionId, stripeSubId),
  });
  if (!sub) return;

  await db
    .update(userSubscriptions)
    .set({
      statusId: pastDueStatus.id,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.id, sub.id));

  await NotificationService.createUserNotification(
    sub.userId,
    "Payment Failed",
    "Your recent subscription payment failed. Please update your payment method to avoid service interruption.",
    "warning"
  ).catch(err => console.error(err));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function activateStripeSubscriptionInTx(
  tx: any,
  {
    userId,
    planId,
    stripeSubscriptionId,
    stripeCustomerId,
    paymentOrderId,
  }: {
    userId: string;
    planId: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    paymentOrderId: string;
  }
) {
  // Lock the user row to serialize concurrent webhook/verify requests (check-then-act race condition fix)
  await tx.execute(sql`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`);

  const plan = await tx.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, planId),
    columns: { id: true, billingCycle: true },
  });
  if (!plan) return;

  const activeStatus = await tx.query.subscriptionStatuses.findFirst({
    where: eq(subscriptionStatuses.name, "active"),
  });
  if (!activeStatus) return;

  const renewalType = await tx.query.subscriptionRenewalTypes.findFirst({
    where: eq(subscriptionRenewalTypes.name, "auto"),
  });

  // Idempotency: Check if already activated
  const existingSub = await tx.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.planId, planId),
      eq(userSubscriptions.statusId, activeStatus.id)
    ),
  });

  if (existingSub) {
    console.log(`[stripe-webhook] Subscription for user ${userId} and plan ${planId} is already active.`);
    return;
  }

  const now = new Date();
  const interval = plan.billingCycle === "yearly" ? "year" : "month";
  const expiry = new Date(now);
  if (interval === "year") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  await tx.insert(userSubscriptions).values({
    userId,
    planId,
    paymentOrderId,
    statusId: activeStatus.id,
    renewalTypeId: renewalType?.id,
    // Use generic provider columns for the Stripe subscription ID
    providerSubscriptionId: stripeSubscriptionId,
    providerCustomerId: stripeCustomerId,
    startDate: now.toISOString(),
    expiryDate: expiry.toISOString(),
    paymentGatewayProvider: "stripe",
    lastPaymentDate: now.toISOString(),
    nextBillingDate: expiry.toISOString(),
  });
}
