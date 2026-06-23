import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';

/**
 * GET /api/admin/roles/[roleId]/permissions
 * Get all permissions assigned to a specific role
 */
async function getRolePermissions(
  req: NextRequest,
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await context.params;
    const permissions = await RBACService.getRolePermissions(roleId);
    
    return NextResponse.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/roles/[roleId]/permissions
 * Set permissions for a role (replaces existing)
 */
async function setRolePermissions(
  req: NextRequest,
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roleId } = await context.params;
    const body = await req.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'permissionIds must be an array' }, { status: 400 });
    }

    const result = await RBACService.setRolePermissions(session.user.id, roleId, permissionIds);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update role permissions' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Set role permissions error:', error);
    return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 });
  }
}

export const GET = withPolicy(getRolePermissions as any, API_POLICIES.ROLE_MANAGE);
export const PUT = withPolicy(setRolePermissions as any, API_POLICIES.ROLE_MANAGE);
