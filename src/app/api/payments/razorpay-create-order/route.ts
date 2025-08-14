// app/api/payments/razorpay-create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs"; // Razorpay SDK needs Node APIs

// Validate env upfront (fail-fast during boot)
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    "Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
  );
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

type CreateOrderBody = {
  amount: number; // amount in INR (not paise)
  currency?: string; // default 'INR'
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateOrderBody>;

    // Basic input validation
    const rawAmount = Number(body?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const currency = (body?.currency || "INR").toUpperCase();

    // Convert INR to paise & round to integer
    const amountPaise = Math.round(rawAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      // optional: notes: { planId: '...' }
    });

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    // Use the error so ESLint is happy and you get debuggable logs
    let message = "Failed to create order";
    if (typeof error === "object" && error !== null) {
      // Razorpay error shape often has error.description / error.message
      const maybeAny = error as Record<string, unknown>;
      message =
        (maybeAny?.message as string) ||
        (maybeAny?.description as string) ||
        message;
    }
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
