// src/app/api/payments/stripe-subscriptions/[id]/cancel/route.ts
// POST /api/payments/stripe-subscriptions/:id/cancel — cancel a Stripe subscription

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withDynamicApiHandler, errorResponse } from "@/lib/api/helpers";
import { requireAdmin } from "@/lib/api/permissions";

export const runtime = "nodejs";

function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe not configured");
  return new Stripe(secret, { apiVersion: "2026-02-25.clover" });
}

export const POST = withDynamicApiHandler<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    try {
      const stripe = getStripe();
      const body = (await req.json().catch(() => ({}))) as {
        at_period_end?: boolean;
      };
      const subscription = await stripe.subscriptions.cancel(params.id, {
        // when at_period_end=true the sub stays active until period ends
        ...(body.at_period_end ? { prorate: false } : {}),
      });
      return NextResponse.json({ success: true, subscription });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to cancel subscription";
      return errorResponse(msg, 500);
    }
  }
);
