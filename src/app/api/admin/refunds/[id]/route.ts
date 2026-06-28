import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import { refundService } from "@/server/services/refund";
import { db } from "@/server/db";
import { refundRequests } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateRefundSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  revokeSubscription: z.boolean().optional(),
});

export const GET = withPolicy(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const request = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.id, params.id),
      with: {
        user: true,
        plan: true,
        paymentOrder: true,
      }
    });

    if (!request) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, API_POLICIES.REFUND_VIEW);

export const PATCH = withPolicy(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { auth } = await import("@/config/auth");
    const session = await auth();
    const adminId = session!.user!.id!;

    const body = await req.json();
    const { action, reason, revokeSubscription } = updateRefundSchema.parse(body);

    if (action === 'approve') {
      const result = await refundService.approveRefund(adminId, params.id, revokeSubscription ?? true);
      return NextResponse.json(result);
    } else {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for rejection" }, { status: 400 });
      }
      const result = await refundService.rejectRefund(adminId, params.id, reason);
      return NextResponse.json({ success: true, refundRequest: result });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}, API_POLICIES.BILLING_REFUND);
