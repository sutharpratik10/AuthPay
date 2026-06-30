import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import { refundService } from "@/server/services/refund";
import { z } from "zod";

const createRefundSchema = z.object({
  paymentOrderId: z.string().uuid().optional(),
  providerSubscriptionId: z.string().optional(),
  reason: z.string().min(1),
  expectedRefundAmountMinor: z.number().int().positive().optional(),
});

export const POST = withPolicy(async (req: NextRequest) => {
  try {
    const { auth } = await import("@/config/auth");
    const session = await auth();
    const userId = session!.user!.id!;

    const body = await req.json();
    const data = createRefundSchema.parse(body);

    let paymentOrderId = data.paymentOrderId;

    if (!paymentOrderId && data.providerSubscriptionId) {
      // Find the payment order for this subscription
      const { db } = await import("@/server/db");
      const { paymentOrders } = await import("@/server/db/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const latestOrder = await db.query.paymentOrders.findFirst({
        where: and(
          eq(paymentOrders.userId, userId),
          eq(paymentOrders.razorpaySubscriptionId, data.providerSubscriptionId)
        ),
        orderBy: [desc(paymentOrders.createdAt)],
      });

      if (!latestOrder) {
        // also check providerOrderId or providerTransactionId just in case
        const latestFallback = await db.query.paymentOrders.findFirst({
          where: and(
            eq(paymentOrders.userId, userId),
            eq(paymentOrders.providerOrderId, data.providerSubscriptionId)
          ),
          orderBy: [desc(paymentOrders.createdAt)],
        });
        if (latestFallback) {
          paymentOrderId = latestFallback.id;
        } else {
          return NextResponse.json({ error: "No payment order found for this subscription" }, { status: 400 });
        }
      } else {
        paymentOrderId = latestOrder.id;
      }
    }

    if (!paymentOrderId) {
      return NextResponse.json({ error: "paymentOrderId is required" }, { status: 400 });
    }

    const result = await refundService.createUserRefundRequest(userId, { ...data, paymentOrderId });
    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}, API_POLICIES.USER_ACCESS);

export const GET = withPolicy(async (req: NextRequest) => {
  try {
    const { auth } = await import("@/config/auth");
    const session = await auth();
    const userId = session!.user!.id!;

    const { db } = await import("@/server/db");
    const { refundRequests } = await import("@/server/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const requests = await db.query.refundRequests.findMany({
      where: eq(refundRequests.userId, userId),
      orderBy: [desc(refundRequests.createdAt)],
      with: { plan: true }
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, API_POLICIES.USER_ACCESS);
