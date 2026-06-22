// src/app/api/payments/stripe-subscriptions/route.ts
// GET /api/payments/stripe-subscriptions
// Lists Stripe subscriptions with optional status filter and pagination

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withApiHandler, errorResponse } from "@/lib/api/helpers";
import { requireAdmin } from "@/lib/api/permissions";

export const runtime = "nodejs";

export const GET = withApiHandler(async (req: NextRequest) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return errorResponse("Stripe not configured", 500);

  const stripe = new Stripe(secret, { apiVersion: "2026-02-25.clover" });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
  const startingAfter = url.searchParams.get("starting_after") ?? undefined;
  const status = (url.searchParams.get("status") ?? undefined) as
    | Stripe.SubscriptionListParams.Status
    | undefined;
  const customer = url.searchParams.get("customer") ?? undefined;

  try {
    const params: Stripe.SubscriptionListParams = { limit, expand: ["data.customer"] };
    if (startingAfter) params.starting_after = startingAfter;
    if (status) params.status = status;
    if (customer) params.customer = customer;

    const subscriptions = await stripe.subscriptions.list(params);

    return NextResponse.json({
      success: true,
      data: subscriptions.data,
      has_more: subscriptions.has_more,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch subscriptions";
    return errorResponse(msg, 500);
  }
});
