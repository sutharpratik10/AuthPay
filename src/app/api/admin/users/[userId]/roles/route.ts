import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { userRoles, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/users/[userId]/roles
 * Get all roles for a user
 */
async function getUserRolesInfo(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    const userRolesData = await db
      .select({
        id: userRoles.id,
        roleId: userRoles.roleId,
        assignedAt: userRoles.assignedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
          priority: roles.priority,
          isSuperAdmin: roles.isSuperAdmin,
        }
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const effectivePermissions = await RBACService.getEffectivePermissions(userId);

    return NextResponse.json({
      success: true,
      data: { 
        roles: userRolesData,
        effectivePermissions 
      }
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users/[userId]/roles
 * Add a role to a user
 */
async function addUserRole(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await context.params;
    const body = await req.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'roleId is required' }, { status: 400 });
    }

    const result = await RBACService.assignRole(session.user.id, userId, roleId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to assign role' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Assign role error:', error);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[userId]/roles
 * Set all roles for a user (replaces existing)
 */
async function setUserRoles(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await context.params;
    const body = await req.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: 'roleIds must be an array' }, { status: 400 });
    }

    const result = await RBACService.setUserRoles(session.user.id, userId, roleIds);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to set roles' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Set roles error:', error);
    return NextResponse.json({ error: 'Failed to set roles' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[userId]/roles?roleId=xxx
 * Remove a role from a user
 */
async function removeUserRole(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await context.params;
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'roleId query parameter is required' }, { status: 400 });
    }

    const result = await RBACService.removeRole(session.user.id, userId, roleId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to remove role' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Remove role error:', error);
    return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
  }
}

export const GET = withPolicy(getUserRolesInfo as any, API_POLICIES.USER_MANAGE);
export const POST = withPolicy(addUserRole as any, API_POLICIES.USER_MANAGE);
export const PUT = withPolicy(setUserRoles as any, API_POLICIES.USER_MANAGE);
export const DELETE = withPolicy(removeUserRole as any, API_POLICIES.USER_MANAGE);
