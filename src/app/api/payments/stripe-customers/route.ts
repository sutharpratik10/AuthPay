// src/app/api/payments/stripe-customers/route.ts
// GET /api/payments/stripe-customers
// Lists Stripe customers with optional search/pagination

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
  const email = url.searchParams.get("email") ?? undefined;

  try {
    const params: Stripe.CustomerListParams = { limit };
    if (startingAfter) params.starting_after = startingAfter;
    if (email) params.email = email;

    const customers = await stripe.customers.list(params);

    return NextResponse.json({
      success: true,
      data: customers.data,
      has_more: customers.has_more,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch customers";
    return errorResponse(msg, 500);
  }
});
