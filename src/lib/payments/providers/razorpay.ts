// src/lib/payments/providers/razorpay.ts
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";
import { registerPaymentProvider, PaymentProvider, CreateOrderInput, CreateOrderResult, RefundInput, RefundResult } from "../gateway";

export interface RazorpayCreateOrderResponse extends CreateOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  attempts?: number;
}

class RazorpayProvider implements PaymentProvider {
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.warn("Missing Razorpay credentials - using placeholder for build. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for runtime.");
      this.keyId = 'placeholder_key_id';
      this.keySecret = 'placeholder_key_secret';
      return;
    }
    this.keyId = RAZORPAY_KEY_ID;
    this.keySecret = RAZORPAY_KEY_SECRET;
  }

  async createOrder(input: CreateOrderInput): Promise<RazorpayCreateOrderResponse> {
    if (this.keyId === 'placeholder_key_id') {
      throw new Error("Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.");
    }
    const client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    const amountPaise = Math.round(input.amount * 100);
    const currency = (input.currency || "INR").toUpperCase();

    const order = await client.orders.create({
      amount: amountPaise,
      currency,
      receipt: input.receipt,
      notes: input.notes
        ? Object.fromEntries(
          Object.entries(input.notes).map(([k, v]) => [k, v == null ? null : String(v)])
        )
        : undefined,
    });

    return order as unknown as RazorpayCreateOrderResponse;
  }

  async verifyPayment(options: {
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    if (this.keySecret === 'placeholder_key_secret') {
      throw new Error("Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.");
    }
    const { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = options;

    let signedString: string;
    if (razorpay_order_id) {
      // standard order payment signature: order_id|payment_id
      signedString = `${razorpay_order_id}|${razorpay_payment_id}`;
    } else if (razorpay_subscription_id) {
      // subscription checkout signature: payment_id|subscription_id
      signedString = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    } else {
      throw new Error('Either razorpay_order_id or razorpay_subscription_id must be provided for verification');
    }

    const hmac = createHmac("sha256", this.keySecret);
    hmac.update(signedString);
    const expected = hmac.digest("hex");
    
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(razorpay_signature);
    
    let isValid = false;
    try {
      isValid = timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      isValid = false; // Length mismatch
    }
    
    return isValid;
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    if (this.keyId === 'placeholder_key_id') {
      throw new Error("Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.");
    }
    const client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });

    // Pre-flight: fetch payment details for diagnostics
    try {
      const payment = await client.payments.fetch(input.providerPaymentId);
      console.log(`[Razorpay] Payment state for ${input.providerPaymentId}: status=${payment.status}, amount=${payment.amount}, amount_refunded=${(payment as any).amount_refunded}, currency=${payment.currency}`);
    } catch (fetchErr: any) {
      console.warn(`[Razorpay] Could not fetch payment ${input.providerPaymentId} for diagnostics:`, fetchErr?.message || fetchErr);
    }

    const params: any = {};
    if (input.notes) params.notes = input.notes;
    if (input.receipt) params.receipt = input.receipt;
    
    if (input.amountMinor && input.amountMinor > 0) {
      params.amount = input.amountMinor;
    }

    console.log(`[Razorpay] Refund request: paymentId=${input.providerPaymentId}, params=${JSON.stringify(params)}`);

    try {
      const response = await client.payments.refund(input.providerPaymentId, params);
      return {
        success: true,
        providerRefundId: response.id,
        status: response.status,
        amountMinor: Number(response.amount),
        currency: response.currency,
        gatewayResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error: any) {
      const errInfo = error?.error || {};
      console.error(`[Razorpay] Refund failed for ${input.providerPaymentId}:`, JSON.stringify(errInfo));

      // If partial refund failed and we sent an amount, retry as full refund
      if (params.amount && errInfo.code === 'BAD_REQUEST_ERROR') {
        console.log(`[Razorpay] Retrying as full refund (without amount) for ${input.providerPaymentId}...`);
        try {
          const retryParams: any = {};
          if (input.notes) retryParams.notes = input.notes;
          if (input.receipt) retryParams.receipt = input.receipt;
          const response = await client.payments.refund(input.providerPaymentId, retryParams);
          return {
            success: true,
            providerRefundId: response.id,
            status: response.status,
            amountMinor: Number(response.amount),
            currency: response.currency,
            gatewayResponse: response as unknown as Record<string, unknown>,
          };
        } catch (retryError: any) {
          console.error(`[Razorpay] Full refund retry also failed for ${input.providerPaymentId}:`, JSON.stringify(retryError?.error || retryError?.message || retryError));
          throw retryError;
        }
      }

      throw error;
    }
  }
}

registerPaymentProvider("razorpay", () => new RazorpayProvider());
export { RazorpayProvider };
