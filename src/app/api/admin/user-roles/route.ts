import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { users, userRoles, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/config/auth';

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

    // List all users and their roles via user_roles table
    const userRoleAssignments = await db
      .select({
        id: userRoles.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        roleId: roles.id,
        roleName: roles.name,
        assignedAt: userRoles.assignedAt,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(userRoles.roleId, roles.id));

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

    // Check if assignment already exists
    const existing = await db.query.userRoles.findFirst({
      where: (userRoles, { and, eq }) => 
        and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      );
    }

    // Assign role via user_roles table
    const [assignment] = await db.insert(userRoles)
      .values({
        userId,
        roleId,
        assignedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      data: { assignment }
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

    // Remove role assignment from user_roles table
    await db.delete(userRoles)
      .where(
        eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId)
      );

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
