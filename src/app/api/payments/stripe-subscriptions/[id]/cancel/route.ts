// src/app/api/payments/stripe-subscriptions/[id]/cancel/route.ts
// POST /api/payments/stripe-subscriptions/:id/cancel — cancel a Stripe subscription
//
// Accessible by:
//   - Admins: can cancel any Stripe subscription
//   - Users: can cancel their own Stripe subscription (matched via providerSubscriptionId column)

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withDynamicApiHandler, errorResponse } from "@/lib/api/helpers";
import { db } from "@/server/db";
import { userSubscriptions, subscriptionStatuses } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessSubscription } from "@/lib/api/payment-authorization";

export const runtime = "nodejs";

function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe not configured");
  return new Stripe(secret);
}

export const POST = withDynamicApiHandler<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    const stripeSubId = params.id;
    if (!stripeSubId) {
      return errorResponse("Missing subscription id", 400);
    }

    // Authorization: user must own the subscription or be an admin
    // The providerSubscriptionId column is used for Stripe subscription IDs
    const { canAccess, isAdmin: isAdminUser } = await canAccessSubscription(user!.id, stripeSubId);

    if (!canAccess) {
      console.log(`[stripe-subscriptions/cancel] User ${user?.id} denied access to subscription ${stripeSubId}`);
      return errorResponse("You do not have permission to cancel this subscription", 403);
    }

    try {
      const stripe = getStripe();
      const body = (await req.json().catch(() => ({}))) as {
        at_period_end?: boolean;
        cancel_at_cycle_end?: boolean;
      };

      // Support both naming conventions for cancel at period end
      const cancelAtPeriodEnd = body.at_period_end ?? body.cancel_at_cycle_end ?? false;

      console.log(`[stripe-subscriptions/cancel] Cancelling subscription ${stripeSubId} for user: ${user?.id} (admin: ${isAdminUser}, at_period_end: ${cancelAtPeriodEnd})`);

      let subscription: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        // Cancel at end of current billing period (subscription stays active until period ends)
        subscription = await stripe.subscriptions.update(stripeSubId, {
          cancel_at_period_end: true,
        });
      } else {
        // Cancel immediately
        subscription = await stripe.subscriptions.cancel(stripeSubId);
      }

      // Update local database
      try {
        const cancelledStatus = await db.query.subscriptionStatuses.findFirst({
          where: eq(subscriptionStatuses.name, "cancelled"),
          columns: { id: true },
        });

        if (cancelledStatus?.id) {
          await db
            .update(userSubscriptions)
            .set({
              statusId: cancelledStatus.id,
              updatedAt: new Date().toISOString(),
            })
            .where(
              eq(userSubscriptions.providerSubscriptionId, stripeSubId)
            );

          console.log(`[stripe-subscriptions/cancel] Updated local DB for subscription ${stripeSubId}`);
        }
      } catch (dbErr) {
        console.error("[stripe-subscriptions/cancel] Failed to update local database:", dbErr);
        // Don't fail the request if DB update fails — Stripe cancellation was successful
      }

      return NextResponse.json({ success: true, subscription });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to cancel subscription";
      console.error("[stripe-subscriptions/cancel] Error:", err);
      return errorResponse(msg, 500);
    }
  },
  { requireAuth: true }
);
