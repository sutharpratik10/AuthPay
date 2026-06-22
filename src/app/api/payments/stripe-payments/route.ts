// src/app/api/payments/stripe-payments/route.ts
//
// GET /api/payments/stripe-payments
// Lists Stripe payment intents (charges) with pagination and filtering.
// Returns data in the same normalized shape as the Razorpay payments API
// so the Transactions UI can merge and display both providers uniformly.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withApiHandler, errorResponse } from "@/lib/api/helpers";
import { isAdmin } from "@/lib/api/payment-authorization";

export const runtime = "nodejs";

/**
 * Normalize a Stripe PaymentIntent into the same shape as a Razorpay payment
 * so the admin Transactions table can render both uniformly.
 */
function normalizePaymentIntent(pi: Stripe.PaymentIntent): Record<string, unknown> {
  // Dig out the first successful charge (if any) for method / receipt details
  const charge =
    pi.latest_charge && typeof pi.latest_charge === "object"
      ? (pi.latest_charge as Stripe.Charge)
      : null;

  const method =
    charge?.payment_method_details?.type ??
    pi.payment_method_types?.[0] ??
    "card";

  return {
    id: pi.id,
    amount: pi.amount, // in minor units (cents / paise)
    currency: (pi.currency ?? "usd").toUpperCase(),
    status: pi.status, // succeeded, requires_payment_method, etc.
    method,
    email:
      charge?.billing_details?.email ??
      charge?.receipt_email ??
      (pi.metadata?.email || null),
    contact: charge?.billing_details?.phone ?? null,
    created_at: pi.created, // unix timestamp
    description: pi.description,
    receipt_url: charge?.receipt_url ?? null,
    customer: typeof pi.customer === "string" ? pi.customer : null,
    _gateway: "stripe",
  };
}

export const GET = withApiHandler(
  async (request: NextRequest, { user }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return errorResponse("Stripe not configured", 500);

    const isAdminUser = await isAdmin(user!.id);
    console.log(
      `[stripe-payments] Fetching payments for user: ${user?.id} (admin: ${isAdminUser})`
    );

    const stripe = new Stripe(secret, { apiVersion: "2026-02-25.clover" });

    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? "100"),
      100
    );
    const startingAfter =
      url.searchParams.get("starting_after") ?? undefined;
    const from = url.searchParams.get("from")
      ? Number(url.searchParams.get("from"))
      : undefined;
    const to = url.searchParams.get("to")
      ? Number(url.searchParams.get("to"))
      : undefined;
    const fetchAll = url.searchParams.get("fetchAll") === "true";
    const q = url.searchParams.get("q") ?? undefined;

    try {
      const params: Stripe.PaymentIntentListParams = {
        limit,
        expand: ["data.latest_charge"],
      };
      if (startingAfter) params.starting_after = startingAfter;
      if (from || to) {
        params.created = {};
        if (from) params.created.gte = from;
        if (to) params.created.lte = to;
      }

      if (fetchAll) {
        // Auto-paginate to collect all payment intents
        console.log("[stripe-payments] Fetching ALL payments with auto-pagination...");
        const allItems: Record<string, unknown>[] = [];
        let hasMore = true;
        let lastId: string | undefined;
        let pageCount = 0;
        const maxPages = 50;

        while (hasMore && pageCount < maxPages) {
          const pageParams: Stripe.PaymentIntentListParams = {
            ...params,
            limit: 100,
          };
          if (lastId) pageParams.starting_after = lastId;

          const page = await stripe.paymentIntents.list(pageParams);
          const normalized = page.data.map(normalizePaymentIntent);
          allItems.push(...normalized);
          pageCount++;

          hasMore = page.has_more;
          if (page.data.length > 0) {
            lastId = page.data[page.data.length - 1].id;
          } else {
            hasMore = false;
          }
        }

        console.log(
          `[stripe-payments] Fetched total of ${allItems.length} payments across ${pageCount} pages`
        );

        // Apply search filter
        let finalItems = allItems;
        if (q) {
          const ql = q.toLowerCase();
          finalItems = allItems.filter((p) => {
            const id = String(p.id ?? "").toLowerCase();
            const email = String(p.email ?? "").toLowerCase();
            const desc = String(p.description ?? "").toLowerCase();
            return id.includes(ql) || email.includes(ql) || desc.includes(ql);
          });
        }

        return NextResponse.json({
          entity: "collection",
          count: finalItems.length,
          items: finalItems,
          isAdmin: isAdminUser,
          _fetchAll: true,
          _pages: pageCount,
        });
      }

      // Single page fetch
      const paymentIntents = await stripe.paymentIntents.list(params);
      let items = paymentIntents.data.map(normalizePaymentIntent);

      // Apply search filter
      if (q) {
        const ql = q.toLowerCase();
        items = items.filter((p) => {
          const id = String(p.id ?? "").toLowerCase();
          const email = String(p.email ?? "").toLowerCase();
          const desc = String(p.description ?? "").toLowerCase();
          return id.includes(ql) || email.includes(ql) || desc.includes(ql);
        });
      }

      return NextResponse.json({
        entity: "collection",
        count: items.length,
        items,
        has_more: paymentIntents.has_more,
        isAdmin: isAdminUser,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch Stripe payments";
      console.error("[stripe-payments] Error:", msg);
      return errorResponse(msg, 500);
    }
  },
  { requireAuth: true }
);
