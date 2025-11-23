/**
 * API: Get user's dashboard URL based on policies
 * GET /api/rbac/user/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/rbac";
import { getDashboardUrl } from "@/lib/rbac/routing-utils";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (req: NextRequest) => {
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
});
