// src/lib/payments/providers/razorpay.ts
import Razorpay from "razorpay";
import { createHmac } from "crypto";
import { registerPaymentProvider, PaymentProvider, CreateOrderInput, CreateOrderResult } from "../gateway";

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
      throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    this.keyId = RAZORPAY_KEY_ID;
    this.keySecret = RAZORPAY_KEY_SECRET;
  }

  async createOrder(input: CreateOrderInput): Promise<RazorpayCreateOrderResponse> {
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
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = options;
    const hmac = createHmac("sha256", this.keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expected = hmac.digest("hex");
    return expected === razorpay_signature;
  }
}

registerPaymentProvider("razorpay", () => new RazorpayProvider());
export { RazorpayProvider };
