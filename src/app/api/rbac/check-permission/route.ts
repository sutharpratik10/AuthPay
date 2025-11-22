/**
 * API: Check if current user has a specific policy
 * POST /api/rbac/check-permission
 * Rate Limited: 60 requests per minute
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/rbac";
import { RBACService } from "@/lib/rbac";
import { rateLimiters } from '@/lib/middleware/rate-limit';

export const POST = rateLimiters.api(async (req: NextRequest) => {
  const authCheck = await getAuthenticatedUser(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const { policy, policies } = body;

    if (!policy && !policies) {
      return NextResponse.json(
        { error: "Policy or policies array is required" },
        { status: 400 }
      );
    }

    const userId = authCheck.userId!;

    // Check single policy
    if (policy) {
      const hasAccess = await RBACService.hasPolicy(userId, policy);
      return NextResponse.json({
        success: true,
        hasAccess,
        policy
      });
    }

    // Check multiple policies
    if (policies && Array.isArray(policies)) {
      const results: Record<string, boolean> = {};
      
      for (const p of policies) {
        results[p] = await RBACService.hasPolicy(userId, p);
      }

      return NextResponse.json({
        success: true,
        results
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json(
      { error: "Failed to check permission" },
      { status: 500 }
    );
  }
});
