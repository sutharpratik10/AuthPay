import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { roles, userRoles, tenantUsers } from '@/db/schema';
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

    // Check if role exists and belongs to user's tenant
    const existingRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, roleId),
        eq(roles.tenantId, userTenant.tenantId)
      ),
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

    // Check if another role with same name exists (excluding current role)
    const duplicateRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.tenantId, userTenant.tenantId),
        eq(roles.name, name.trim()),
        eq(roles.id, roleId) // Exclude current role
      ),
    });

    if (duplicateRole && duplicateRole.id !== roleId) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from other roles
    if (isDefault && !existingRole.isDefault) {
      await db
        .update(roles)
        .set({ isDefault: false })
        .where(and(
          eq(roles.tenantId, userTenant.tenantId),
          eq(roles.isDefault, true)
        ));
    }    // Update the role
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

    // Check if role exists and belongs to user's tenant
    const existingRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, roleId),
        eq(roles.tenantId, userTenant.tenantId)
      ),
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

    // Check if role is assigned to any users
    const assignedUsers = await db.query.userRoles.findFirst({
      where: eq(userRoles.roleId, roleId),
    });

    if (assignedUsers) {
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
