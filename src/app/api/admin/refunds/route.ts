import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import { refundService } from "@/server/services/refund";
import { z } from "zod";

const createRefundSchema = z.object({
  paymentOrderId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  reason: z.string().min(1),
  revokeSubscription: z.boolean().default(true),
});

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const gateway = url.searchParams.get("gateway") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  try {
    const result = await refundService.getRefundRequests({ status, gateway, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[REFUNDS_API_ERROR]", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
};

export const POST = withPolicy(async (req: NextRequest) => {
  try {
    // We need to parse user from the session, but withPolicy checks it already.
    // To get the user ID, we can use the auth() function as done inside withPolicy.
    const { auth } = await import("@/config/auth");
    const session = await auth();
    const userId = session!.user!.id!;

    const body = await req.json();
    const data = createRefundSchema.parse(body);
    const result = await refundService.createRefundRequest(userId, data);
    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}, API_POLICIES.BILLING_REFUND);
