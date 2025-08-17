import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { roles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/admin/users/[userId] - Update user (Admin only)
 */
async function updateUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1]; // Get userId from path
    const body = await req.json();
    const { name, role, isActive, isEmailVerified } = body;

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }    // Prepare update data
    const updateData: Record<string, string | boolean | null> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isEmailVerified !== undefined) {
      updateData.isEmailVerified = isEmailVerified;
      updateData.emailVerified = isEmailVerified ? new Date().toISOString() : null;
    }

    // Update user
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: roles.name,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId] - Delete user (Admin only)
 */
async function deleteUser(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1]; // Get userId from path

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      data: { deletedUserId: userId }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Export with admin-only permissions
export const PUT = withPermission(updateUser, API_PERMISSIONS.USER_EDIT);

export const DELETE = withPermission(deleteUser, API_PERMISSIONS.USER_DELETE);
