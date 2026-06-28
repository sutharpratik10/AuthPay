import { NextRequest, NextResponse } from "next/server";
import { withPolicy } from "@/lib/api/permissions";
import { API_POLICIES } from "@/lib/api/permissions";
import { refundService } from "@/server/services/refund";

export const GET = withPolicy(async (req: NextRequest) => {
  try {
    const stats = await refundService.getRefundStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, API_POLICIES.REFUND_VIEW);
