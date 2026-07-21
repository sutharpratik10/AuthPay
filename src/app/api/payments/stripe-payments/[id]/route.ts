// src/app/api/payments/stripe-payments/[id]/route.ts
//
// GET /api/payments/stripe-payments/[id]
// Retrieves a specific Stripe PaymentIntent by ID.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { withDynamicApiHandler, errorResponse } from "@/lib/api/helpers";
import { isAdmin } from "@/lib/api/payment-authorization";

export const runtime = "nodejs";

export const GET = withDynamicApiHandler<{ id?: string }>(
  async (request: NextRequest, { params, user }) => {
    const id = params?.id;
    if (!id) return errorResponse("Missing payment ID", 400);

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return errorResponse("Stripe not configured", 500);

    const isAdminUser = await isAdmin(user!.id);
    if (!isAdminUser) return errorResponse("Unauthorized", 403);

    const stripe = new Stripe(secret, { apiVersion: "2026-02-25.clover" });

    try {
      // By default checkout sessions create subscriptions or payment intents.
      // If it's a checkout session id ('cs_test_...'), we should fetch the session.
      // Usually, it's a payment intent ('pi_...').
      let pi: any = null;

      if (id.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(id, {
          expand: ['payment_intent', 'payment_intent.latest_charge', 'payment_intent.latest_charge.balance_transaction']
        });
        pi = (session as any).payment_intent;
      } else if (id.startsWith('ch_')) {
        const charge = await stripe.charges.retrieve(id, {
          expand: ['payment_intent', 'balance_transaction']
        });
        pi = typeof charge.payment_intent === 'object' ? charge.payment_intent : charge;
        // If it's just a charge, we mock a PI structure for normalization
        if (!pi.latest_charge) {
          pi = { ...pi, latest_charge: charge };
        }
      } else if (id.startsWith('in_')) {
        const invoice = await stripe.invoices.retrieve(id, {
          expand: ['payment_intent', 'payment_intent.latest_charge', 'payment_intent.latest_charge.balance_transaction']
        });
        pi = (invoice as any).payment_intent;
      } else if (id.startsWith('sub_')) {
        const subscription = await stripe.subscriptions.retrieve(id, {
          expand: ['latest_invoice', 'latest_invoice.payment_intent', 'latest_invoice.payment_intent.latest_charge']
        });
        pi = (subscription.latest_invoice as any)?.payment_intent;
      } else {
        pi = await stripe.paymentIntents.retrieve(id, {
          expand: ['latest_charge', 'latest_charge.balance_transaction']
        });
      }

      if (!pi) {
        return errorResponse("Underlying PaymentIntent not found", 404);
      }

      // Now normalize it like a Razorpay payment object
      const charge = pi.latest_charge as any;
      const balance = charge?.balance_transaction as any;

      const normalized = {
        id: pi.id,
        amount: pi.amount || 0,
        currency: (pi.currency || "usd").toUpperCase(),
        status: pi.status === "succeeded" ? "captured" : pi.status,
        method: charge?.payment_method_details?.type || pi.payment_method_types?.[0] || 'card',
        email: charge?.billing_details?.email || charge?.receipt_email || pi.receipt_email || '--',
        contact: charge?.billing_details?.phone || '--',
        order_id: pi.metadata?.order_id || pi.client_secret || '--',
        captured: charge?.captured ?? (pi.status === "succeeded"),
        amount_refunded: charge?.amount_refunded ?? 0,
        fee: balance?.fee ?? 0,
        tax: 0,
        refund_status: charge?.refunds?.data?.length ? (charge.refunded ? 'refunded' : 'partial') : '--',
        _gateway: 'stripe',
        card: charge?.payment_method_details?.card ? {
          id: charge.payment_method,
          last4: charge.payment_method_details.card.last4,
          network: charge.payment_method_details.card.network || charge.payment_method_details.card.brand,
          name: charge.billing_details?.name,
          issuer: charge.payment_method_details.card.issuer,
        } : undefined,
        raw_data: pi // keeping raw_data just in case
      };

      return NextResponse.json(normalized);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch Stripe payment details";
      console.error("[stripe-payments/[id]] Error:", msg);
      return errorResponse(msg, 500);
    }
  },
  { requireAuth: true }
);
