/**
 * API: Assign/Remove policies to/from a role
 * POST /api/rbac/roles/[roleId]/policies
 * DELETE /api/rbac/roles/[roleId]/policies
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { roles, permissions, rolePermissions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Assign a policy to a role
 */
/**
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(async (
  req: NextRequest,
  ...args: unknown[]
): Promise<Response> => {
  const context = args[0] as { params: Promise<{ roleId: string }> };
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response || NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { roleId } = await context.params;
    const body = await req.json();
    const { policyId } = body;

    if (!policyId) {
      return NextResponse.json(
        { error: "Policy ID is required" },
        { status: 400 }
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

    // Check if policy exists
    const policy = await db.query.permissions.findFirst({
      where: eq(permissions.id, policyId)
    });

    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existing = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, policyId)
      )
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Policy already assigned to role"
      });
    }

    // Assign policy to role
    await db.insert(rolePermissions).values({
      roleId,
      permissionId: policyId
    });

    return NextResponse.json({
      success: true,
      message: "Policy assigned to role successfully"
    });
  } catch (error) {
    console.error("Error assigning policy to role:", error);
    return NextResponse.json(
      { error: "Failed to assign policy to role" },
      { status: 500 }
    );
  }
});

/**
 * Remove a policy from a role
 */
export const DELETE = rateLimiters.api(async (
  req: NextRequest,
  ...args: unknown[]
): Promise<Response> => {
  const context = args[0] as { params: Promise<{ roleId: string }> };
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response || NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { roleId } = await context.params;
    const body = await req.json();
    const { policyId } = body;

    if (!policyId) {
      return NextResponse.json(
        { error: "Policy ID is required" },
        { status: 400 }
      );
    }

    // Remove policy from role
    await db.delete(rolePermissions).where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, policyId)
      )
    );

    return NextResponse.json({
      success: true,
      message: "Policy removed from role successfully"
    });
  } catch (error) {
    console.error("Error removing policy from role:", error);
    return NextResponse.json(
      { error: "Failed to remove policy from role" },
      { status: 500 }
    );
  }
});

/**
 * Get all policies for a role
 */
export const GET = rateLimiters.api(async (
  req: NextRequest,
  ...args: unknown[]
): Promise<Response> => {
  const context = args[0] as { params: Promise<{ roleId: string }> };
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response || NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { roleId } = await context.params;

    // Get all policies for this role
    const rolePolicies = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        category: permissions.category,
        displayName: permissions.displayName,
        resource: permissions.resource,
        action: permissions.action
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId));

    return NextResponse.json({
      success: true,
      data: rolePolicies
    });
  } catch (error) {
    console.error("Error fetching role policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch role policies" },
      { status: 500 }
    );
  }
});
