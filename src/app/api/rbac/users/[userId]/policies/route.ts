/**
 * API: Get user's policies
 * GET /api/rbac/users/[userId]/policies
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { RBACService } from "@/lib/rbac";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (
  req: NextRequest,
  ...args: unknown[]
): Promise<Response> => {
  const context = args[0] as { params: Promise<{ userId: string }> };
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response || NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { userId } = await context.params;

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all policies for this user
    const policies = await RBACService.getUserPolicies(userId);

    // Get roles for context
    const userRoleNames = await RBACService.getUserRoles(userId);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        roles: userRoleNames,
        policies
      }
    });
  } catch (error) {
    console.error("Error fetching user policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch user policies" },
      { status: 500 }
    );
  }
});
