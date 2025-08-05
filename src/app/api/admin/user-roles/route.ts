import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, userRoles, tenantUsers, roles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * GET /api/admin/user-roles - List all user role assignments (Admin only)
 */
async function getUserRoles() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, session.user.id),
      with: {
        tenant: true,
      },
    });

    if (!userTenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 400 }
      );
    }

    // Get all user role assignments for this tenant
    const userRoleAssignments = await db
      .select({
        id: userRoles.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        roleId: roles.id,
        roleName: roles.name,
        assignedAt: userRoles.createdAt,
      })
      .from(userRoles)
      .innerJoin(tenantUsers, eq(userRoles.tenantUserId, tenantUsers.id))
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(tenantUsers.tenantId, userTenant.tenantId))
      .orderBy(userRoles.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        userRoles: userRoleAssignments,
      }
    });

  } catch (error) {
    console.error('Get user roles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user role assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/user-roles - Assign role to user (Admin only)
 */
async function assignUserRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      );
    }

    // Get user's tenant
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, session.user.id),
      with: {
        tenant: true,
      },
    });

    if (!userTenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 400 }
      );
    }

    // Check if target user exists in the same tenant
    const targetTenantUser = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.userId, userId),
        eq(tenantUsers.tenantId, userTenant.tenantId)
      ),
    });

    if (!targetTenantUser) {
      return NextResponse.json(
        { error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Check if role exists in the same tenant
    const targetRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, roleId),
        eq(roles.tenantId, userTenant.tenantId)
      ),
    });

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Role not found in this tenant' },
        { status: 404 }
      );
    }

    // Check if user already has this role
    const existingAssignment = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.tenantUserId, targetTenantUser.id),
        eq(userRoles.roleId, roleId)
      ),
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User already has this role assigned' },
        { status: 400 }
      );
    }

    // Create the role assignment
    const newAssignment = await db
      .insert(userRoles)
      .values({
        tenantUserId: targetTenantUser.id,
        roleId: roleId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      data: { assignment: newAssignment[0] }
    });

  } catch (error) {
    console.error('Assign user role error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role to user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/user-roles - Remove role from user (Admin only)
 */
async function removeUserRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      );
    }

    // Get user's tenant
    const userTenant = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, session.user.id),
      with: {
        tenant: true,
      },
    });

    if (!userTenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 400 }
      );
    }

    // Check if target user exists in the same tenant
    const targetTenantUser = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.userId, userId),
        eq(tenantUsers.tenantId, userTenant.tenantId)
      ),
    });

    if (!targetTenantUser) {
      return NextResponse.json(
        { error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Find and remove the role assignment
    const existingAssignment = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.tenantUserId, targetTenantUser.id),
        eq(userRoles.roleId, roleId)
      ),
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Role assignment not found' },
        { status: 404 }
      );
    }

    await db.delete(userRoles).where(eq(userRoles.id, existingAssignment.id));

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    });

  } catch (error) {
    console.error('Remove user role error:', error);
    return NextResponse.json(
      { error: 'Failed to remove role from user' },
      { status: 500 }
    );
  }
}

// Export route handlers with permission checking
export const GET = withPermission(getUserRoles, API_PERMISSIONS.USER_VIEW);
export const POST = withPermission(assignUserRole, API_PERMISSIONS.USER_EDIT);
export const DELETE = withPermission(removeUserRole, API_PERMISSIONS.USER_EDIT);
