// src/app/api/payments/stripe-products/[id]/route.ts
// GET    /api/payments/stripe-products/:id — retrieve a product + its prices
// PATCH  /api/payments/stripe-products/:id — update name/description/active
// DELETE /api/payments/stripe-products/:id — archive (deactivate) a product

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

export const GET = withDynamicApiHandler<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    try {
      const stripe = getStripe();
      const product = await stripe.products.retrieve(params.id, {
        expand: ["default_price"],
      });
      const prices = await stripe.prices.list({ product: params.id, limit: 20 });
      return NextResponse.json({ success: true, product, prices: prices.data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch product";
      return errorResponse(msg, 500);
    }
  }
);

export const PATCH = withDynamicApiHandler<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    try {
      const stripe = getStripe();
      const body = (await req.json()) as {
        name?: string;
        description?: string;
        active?: boolean;
        metadata?: Record<string, string>;
      };
      const updated = await stripe.products.update(params.id, body);
      return NextResponse.json({ success: true, product: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update product";
      return errorResponse(msg, 500);
    }
  }
);

export const DELETE = withDynamicApiHandler<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

    try {
      const stripe = getStripe();
      // Stripe recommends archiving (active=false) rather than deleting
      const archived = await stripe.products.update(params.id, { active: false });
      return NextResponse.json({ success: true, product: archived });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to archive product";
      return errorResponse(msg, 500);
    }
  }
);
