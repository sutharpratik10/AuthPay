// src/lib/payments/providers/stripe.ts
//
// Stripe payment provider — uses Stripe Checkout (hosted page) for simplicity.
// No PCI compliance burden; Stripe handles everything on their hosted page.
//
// Flow:
//   1. Backend creates a Checkout Session → returns { id, checkoutUrl }
//   2. Frontend redirects to checkoutUrl
//   3. Stripe redirects back to successUrl/cancelUrl
//   4. Webhook (stripe-webhook route) confirms payment & activates subscription

import Stripe from "stripe";
import {
  registerPaymentProvider,
  PaymentProvider,
  CreateOrderInput,
  CreateOrderResult,
  RefundInput,
  RefundResult,
} from "../gateway";

export interface StripeCreateOrderInput extends CreateOrderInput {
  /** Stripe Price ID — if provided, creates a subscription checkout session */
  stripePriceId?: string;
  /** 'payment' (one-time) | 'subscription' (recurring). Defaults to 'subscription' */
  mode?: "payment" | "subscription";
  /** Billing interval for dynamic subscriptions (no pre-created Price) */
  billingInterval?: "month" | "year";
  /** Full URL Stripe should redirect to on success (includes {CHECKOUT_SESSION_ID} placeholder) */
  successUrl?: string;
  /** Full URL Stripe should redirect to on cancel */
  cancelUrl?: string;
  /** Name shown on Stripe checkout line item */
  planName?: string;
  /** Customer email for pre-fill */
  customerEmail?: string;
}

class StripeProvider implements PaymentProvider {
  private readonly client: Stripe | null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn(
        "[Stripe] STRIPE_SECRET_KEY not set — provider registered but non-functional. " +
          "Set STRIPE_SECRET_KEY to enable Stripe payments."
      );
      this.client = null;
      return;
    }
    this.client = new Stripe(secretKey, {
      // Pin to the latest API version supported by this SDK version
      apiVersion: "2026-02-25.clover",
    });
  }

  private ensureClient(): Stripe {
    if (!this.client) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
      );
    }
    return this.client;
  }

  async createOrder(input: StripeCreateOrderInput): Promise<CreateOrderResult> {
    const stripe = this.ensureClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const currency = (input.currency || "USD").toLowerCase();
    const mode = input.mode ?? "subscription";
    const planName = input.planName ?? "Subscription";

    const successUrl =
      input.successUrl ??
      `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`;
    const cancelUrl = input.cancelUrl ?? `${appUrl}/pricing`;

    // Build line items — prefer a pre-created Stripe Price ID when available
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (input.stripePriceId) {
      // Use a pre-created Price from the Stripe dashboard
      lineItems = [{ price: input.stripePriceId, quantity: 1 }];
    } else {
      // Build dynamic pricing (no pre-created Price required)
      const amountMinor = Math.round(input.amount * 100); // major → minor units (cents)
      const interval: "month" | "year" = input.billingInterval ?? "month";

      if (mode === "subscription") {
        lineItems = [
          {
            price_data: {
              currency,
              unit_amount: amountMinor,
              recurring: { interval },
              product_data: { name: planName },
            },
            quantity: 1,
          },
        ];
      } else {
        // One-time payment
        lineItems = [
          {
            price_data: {
              currency,
              unit_amount: amountMinor,
              product_data: { name: planName },
            },
            quantity: 1,
          },
        ];
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Tie Stripe session back to our internal receipt/order ID
      client_reference_id: input.receipt,
      metadata: {
        receipt: input.receipt,
        planId: String(input.notes?.planId ?? ""),
        userId: String(input.notes?.userId ?? ""),
      },
    };

    // Pre-fill customer email if provided
    if (input.customerEmail) {
      sessionParams.customer_email = input.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      id: session.id,
      amount: input.amount,
      currency,
      // Extra Stripe-specific fields (allowed by [key: string]: unknown)
      checkoutUrl: session.url,
      stripeMode: mode,
    };
  }

  /**
   * Verify a Stripe payment by checking the Checkout Session status.
   * For webhook-based verification use verifyWebhookSignature() instead.
   */
  async verifyPayment(options: Record<string, unknown>): Promise<boolean> {
    const stripe = this.ensureClient();
    const sessionId = options.sessionId as string | undefined;
    if (!sessionId) return false;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      session.payment_status === "paid" ||
      session.status === "complete"
    );
  }

  /**
   * Verify a Stripe webhook signature.
   * Returns the verified Stripe Event or throws on invalid signature.
   */
  verifyWebhookSignature(payload: string | Buffer, sig: string): Stripe.Event {
    const stripe = this.ensureClient();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is not set. Set it to the webhook signing secret from your Stripe dashboard."
      );
    }
    return stripe.webhooks.constructEvent(payload, sig, secret);
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    const stripe = this.ensureClient();

    let paymentId = input.providerPaymentId;

    // If we received a Checkout Session ID, resolve it to the actual Payment Intent
    if (paymentId.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(paymentId);
      if (session.payment_intent) {
        paymentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id;
      } else if (session.subscription) {
        // For subscription checkouts, get the latest invoice's payment intent
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        const invoices = await stripe.invoices.list({ subscription: subId, limit: 1 });
        if (invoices.data.length > 0 && invoices.data[0].payment_intent) {
          const pi = invoices.data[0].payment_intent;
          paymentId = typeof pi === 'string' ? pi : pi.id;
        } else {
          throw new Error('Could not resolve Stripe checkout session to a refundable payment');
        }
      } else {
        throw new Error('Stripe checkout session has no associated payment');
      }
    }
    
    const params: Stripe.RefundCreateParams = {};
    if (paymentId.startsWith('pi_')) {
      params.payment_intent = paymentId;
    } else {
      params.charge = paymentId; // 'ch_' or something else
    }
    
    if (input.amountMinor > 0) {
      params.amount = input.amountMinor;
    }

    if (input.reason && ['duplicate', 'fraudulent', 'requested_by_customer'].includes(input.reason)) {
      params.reason = input.reason as Stripe.RefundCreateParams.Reason;
    }

    const response = await stripe.refunds.create(params);

    return {
      success: true, // throws on failure
      providerRefundId: response.id,
      status: response.status || 'unknown',
      amountMinor: response.amount,
      currency: response.currency,
      gatewayResponse: response as unknown as Record<string, unknown>,
    };
  }
}

registerPaymentProvider("stripe", () => new StripeProvider());
export { StripeProvider };
