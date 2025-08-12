import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { roles, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * PUT /api/admin/roles/[roleId] - Update role (Admin only)
 */
async function updateRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract roleId from URL
    const url = new URL(req.url);
    const roleId = url.pathname.split('/').pop();
    
    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }
    const body = await req.json();
    const { name, description, isDefault } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role exists (global, not tenant-based)
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent editing system-managed roles
    if (existingRole.isSystemManaged) {
      return NextResponse.json(
        { error: 'Cannot edit system-managed roles' },
        { status: 403 }
      );
    }

    // Check if another role with same name exists (excluding current role, global)
    const duplicateRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.name, name.trim()),
        eq(roles.id, roleId)
      ),
    });

    if (duplicateRole && duplicateRole.id !== roleId) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from other roles (global)
    if (isDefault && !existingRole.isDefault) {
      await db
        .update(roles)
        .set({ isDefault: false })
        .where(eq(roles.isDefault, true));
    }
    // Update the role
    const updatedRole = await db
      .update(roles)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedRole[0] }
    });

  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[roleId] - Delete role (Admin only)
 */
async function deleteRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract roleId from URL
    const url = new URL(req.url);
    const roleId = url.pathname.split('/').pop();
    
    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists (global)
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent deleting system-managed roles
    if (existingRole.isSystemManaged) {
      return NextResponse.json(
        { error: 'Cannot delete system-managed roles' },
        { status: 403 }
      );
    }

    // Prevent deleting default roles
    if (existingRole.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default roles. Please set another role as default first.' },
        { status: 403 }
      );
    }

    // Check if role is assigned to any users (global)
    const assignedUsers = await db.select().from(users).where(eq(users.roleId, roleId));

    if (assignedUsers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users. Please reassign users first.' },
        { status: 400 }
      );
    }

    // Delete the role
    await db.delete(roles).where(eq(roles.id, roleId));

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}

// Export with admin-only permissions
export const PUT = withPermission(updateRole, API_PERMISSIONS.USER_EDIT);
export const DELETE = withPermission(deleteRole, API_PERMISSIONS.USER_DELETE);
