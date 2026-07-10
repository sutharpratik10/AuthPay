import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import { refundService } from "@/server/services/refund";
import { z } from "zod";
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import { userSubscriptions, refundRequests, platformSettings } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

const createRefundSchema = z.object({
  paymentOrderId: z.string().uuid().optional(),
  providerSubscriptionId: z.string().optional(),
  reason: z.string().min(1),
  expectedRefundAmountMinor: z.number().int().positive().optional(),
});

export const POST = withPolicy(async (req: NextRequest) => {
  try {
    const session = await auth();
    const userId = session!.user!.id!;

    const body = await req.json();
    const data = createRefundSchema.parse(body);

    // Check if refunds are globally enabled
    const settings = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.id, "singleton"),
    });

    if (settings && !settings.refundsEnabled) {
      return NextResponse.json({ error: "Refunds are currently disabled by the administrator" }, { status: 403 });
    }

    let paymentOrderId = data.paymentOrderId;

    if (!paymentOrderId && data.providerSubscriptionId) {
      // Find the subscription to get its linked payment order
      const sub = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.providerSubscriptionId, data.providerSubscriptionId)
        )
      });

      if (!sub || !sub.paymentOrderId) {
        return NextResponse.json({ error: "No successful payment order linked to this subscription" }, { status: 400 });
      }
      
      paymentOrderId = sub.paymentOrderId;
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
    const session = await auth();
    const userId = session!.user!.id!;

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
