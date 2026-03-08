// src/app/api/payments/stripe-products/route.ts
// GET /api/payments/stripe-products  — lists Stripe Products + their Prices
// POST /api/payments/stripe-products — creates a new Product + attached Price

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
  const active = url.searchParams.get("active");

  try {
    const params: Stripe.ProductListParams = {
      limit,
      expand: ["data.default_price"],
    };
    if (startingAfter) params.starting_after = startingAfter;
    if (active !== null && active !== "") params.active = active === "true";

    const products = await stripe.products.list(params);

    return NextResponse.json({
      success: true,
      data: products.data,
      has_more: products.has_more,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch products";
    return errorResponse(msg, 500);
  }
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) return errorResponse("Forbidden", 403);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return errorResponse("Stripe not configured", 500);

  const stripe = new Stripe(secret, { apiVersion: "2026-02-25.clover" });

  const body = (await req.json()) as {
    name: string;
    description?: string;
    amount: number; // major units (e.g. 9.99)
    currency: string;
    interval: "month" | "year" | "week" | "day";
    intervalCount?: number;
    metadata?: Record<string, string>;
  };

  const { name, description, amount, currency, interval, intervalCount = 1, metadata } = body;

  if (!name || !amount || !currency || !interval) {
    return errorResponse("Missing required fields: name, amount, currency, interval", 400);
  }

  try {
    // 1. Create the Product
    const product = await stripe.products.create({
      name,
      description: description || undefined,
      metadata: metadata || {},
    });

    // 2. Create a recurring Price attached to the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // convert to cents
      currency: currency.toLowerCase(),
      recurring: { interval, interval_count: intervalCount },
    });

    // 3. Set it as the default price
    await stripe.products.update(product.id, { default_price: price.id });

    return NextResponse.json({ success: true, product, price }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create product";
    return errorResponse(msg, 500);
  }
});
