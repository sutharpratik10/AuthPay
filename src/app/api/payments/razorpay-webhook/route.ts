import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { refundService } from "@/server/services/refund";

export const runtime = "nodejs";

// Next.js App Router: disable body parsing so we get the raw buffer
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("x-razorpay-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBodyBuffer = await req.arrayBuffer();
  const rawBody = Buffer.from(rawBodyBuffer);

  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody);
  const expectedSig = hmac.digest("hex");

  if (expectedSig !== sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody.toString('utf8'));

    switch (event.event) {
      case "refund.created":
      case "refund.processed":
      case "refund.failed":
      case "refund.speed_changed": {
        const refund = event.payload.refund.entity;
        await refundService.handleWebhookUpdate(refund.id, refund.status, refund);
        break;
      }
      default:
        console.log(`[razorpay-webhook] Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[razorpay-webhook] Error:`, err);
    return NextResponse.json({ received: true, warning: "Handler error logged" });
  }
}
