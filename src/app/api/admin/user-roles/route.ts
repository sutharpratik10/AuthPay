import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    // List all users and their roles
    const userRoleAssignments = await db
      .select({
        id: users.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        roleId: users.roleId
      })
      .from(users);

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

    // Update user's roleId
    await db.update(users)
      .set({ roleId, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      data: { userId, roleId }
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Remove user's roleId
    await db.update(users)
      .set({ roleId: null, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));

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
