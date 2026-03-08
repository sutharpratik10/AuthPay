// src/app/api/payments/stripe-verify/route.ts
//
// Optional endpoint called from the success page to provide immediate feedback.
// The actual subscription activation is handled by the webhook.
//
// GET /api/payments/stripe-verify?session_id=cs_xxx

import { NextRequest, NextResponse } from "next/server";
import "@/lib/payments/providers/stripe";
import { StripeProvider } from "@/lib/payments/providers/stripe";
import { getPaymentProvider } from "@/lib/payments/gateway";
import { db } from "@/server/db";
import { paymentOrders } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing session_id" }, { status: 400 });
  }

  try {
    const provider = getPaymentProvider("stripe") as StripeProvider;
    const isPaid = await provider.verifyPayment({ sessionId });

    if (isPaid) {
      // Ensure our order is marked as success (webhook may still be in flight)
      await db
        .update(paymentOrders)
        .set({ status: "success", updatedAt: new Date() })
        .where(eq(paymentOrders.providerOrderId, sessionId));
    }

    return NextResponse.json({ success: true, paid: isPaid });
  } catch (err) {
    console.error("[stripe-verify] Error:", err);
    return NextResponse.json({ success: false, error: "Verification error" }, { status: 500 });
  }
}
