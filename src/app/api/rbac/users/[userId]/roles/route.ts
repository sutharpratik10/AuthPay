/**
 * API: Assign/Remove roles to/from a user
 * POST /api/rbac/users/[userId]/roles
 * DELETE /api/rbac/users/[userId]/roles
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { RBACService } from "@/lib/rbac";
import { db } from "@/server/db";
import { users, userRoles, roles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Assign a role to a user
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(async (
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
    const body = await req.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

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

    // Check if role exists
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Use RBACService to assign role
    const success = await RBACService.assignRole(
      authCheck.userId!,
      userId,
      roleId
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role assigned to user successfully"
    });
  } catch (error) {
    console.error("Error assigning role to user:", error);
    return NextResponse.json(
      { error: "Failed to assign role to user" },
      { status: 500 }
    );
  }
});

/**
 * Remove a role from a user
 * Rate Limited: 60 requests per minute
 */
export const DELETE = rateLimiters.api(async (
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
    const body = await req.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Use RBACService to remove role
    const success = await RBACService.removeRole(
      authCheck.userId!,
      userId,
      roleId
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role removed from user successfully"
    });
  } catch (error) {
    console.error("Error removing role from user:", error);
    return NextResponse.json(
      { error: "Failed to remove role from user" },
      { status: 500 }
    );
  }
});

/**
 * Get all roles for a user
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

    // Get all roles for this user
    const userRolesRecords = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isDefault: roles.isDefault,
        assignedAt: userRoles.assignedAt
      })
      .from(roles)
      .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    return NextResponse.json({
      success: true,
      data: userRolesRecords
    });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
});
