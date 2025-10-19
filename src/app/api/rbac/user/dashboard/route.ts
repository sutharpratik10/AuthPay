/**
 * API: Get user's dashboard URL based on policies
 * GET /api/rbac/user/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/rbac";
import { getDashboardUrl } from "@/lib/rbac/routing-utils";

export async function GET(req: NextRequest) {
  const authCheck = await getAuthenticatedUser(req);
  
  if (!authCheck.authorized || !authCheck.userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const dashboardUrl = await getDashboardUrl(authCheck.userId);

    return NextResponse.json({
      success: true,
      dashboardUrl
    });
  } catch (error) {
    console.error("Error getting dashboard URL:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard URL" },
      { status: 500 }
    );
  }
}
