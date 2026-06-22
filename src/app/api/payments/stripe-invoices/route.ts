// src/app/api/payments/stripe-invoices/route.ts
//
// GET /api/payments/stripe-invoices
// Lists Stripe invoices with pagination and filtering.
// Returns data normalized to the same shape the admin Transactions UI expects
// so Razorpay and Stripe invoices can be merged and displayed together.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withApiHandler, errorResponse } from "@/lib/api/helpers";
import { isAdmin } from "@/lib/api/payment-authorization";

export const runtime = "nodejs";

/**
 * Normalize a Stripe Invoice to the same shape as a Razorpay invoice
 * so the Transactions component can display both uniformly.
 */
function normalizeInvoice(inv: Stripe.Invoice): Record<string, unknown> {
  return {
    id: inv.id,
    invoice_number: inv.number ?? null,
    customer_id:
      typeof inv.customer === "string"
        ? inv.customer
        : (inv.customer as Stripe.Customer | null)?.id ?? null,
    amount: inv.amount_due, // minor units
    currency: (inv.currency ?? "usd").toUpperCase(),
    status: inv.status, // draft, open, paid, uncollectible, void
    date: inv.created, // unix timestamp
    // Additional Stripe-specific fields
    hosted_invoice_url: inv.hosted_invoice_url ?? null,
    invoice_pdf: inv.invoice_pdf ?? null,
    customer_email: inv.customer_email ?? null,
    subscription:
      typeof (inv as unknown as Record<string, unknown>).subscription === "string"
        ? (inv as unknown as Record<string, unknown>).subscription
        : null,
    amount_paid: inv.amount_paid,
    amount_remaining: inv.amount_remaining,
    _gateway: "stripe",
  };
}

export const GET = withApiHandler(
  async (request: NextRequest, { user }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return errorResponse("Stripe not configured", 500);

    const isAdminUser = await isAdmin(user!.id);
    console.log(
      `[stripe-invoices] Fetching invoices for user: ${user?.id} (admin: ${isAdminUser})`
    );

    const stripe = new Stripe(secret, { apiVersion: "2026-02-25.clover" });

    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? "20"),
      100
    );
    const startingAfter =
      url.searchParams.get("starting_after") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const customer = url.searchParams.get("customer") ?? undefined;
    const subscription = url.searchParams.get("subscription_id") ?? url.searchParams.get("subscription") ?? undefined;

    try {
      const params: Stripe.InvoiceListParams = { limit };
      if (startingAfter) params.starting_after = startingAfter;
      if (
        status &&
        ["draft", "open", "paid", "uncollectible", "void"].includes(status)
      ) {
        params.status = status as Stripe.InvoiceListParams.Status;
      }
      if (customer) params.customer = customer;
      if (subscription) params.subscription = subscription;

      const invoices = await stripe.invoices.list(params);
      const items = invoices.data.map(normalizeInvoice);

      return NextResponse.json({
        entity: "collection",
        count: items.length,
        items,
        has_more: invoices.has_more,
        isAdmin: isAdminUser,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch Stripe invoices";
      console.error("[stripe-invoices] Error:", msg);
      return errorResponse(msg, 500);
    }
  },
  { requireAuth: true }
);
