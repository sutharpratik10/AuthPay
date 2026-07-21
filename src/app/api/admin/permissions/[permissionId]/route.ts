import { NextRequest, NextResponse } from 'next/server';
import { withPolicy } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';

/**
 * PUT /api/admin/permissions/[permissionId]
 * Update a specific permission
 */
async function updatePermission(req: NextRequest, context?: unknown) {
  try {
    const { params: paramsPromise } = context as { params: Promise<{ permissionId: string }> };
    const params = await paramsPromise;
    const { permissionId } = params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    const result = await RBACService.updatePermission(session.user.id, permissionId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update permission' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Update permission error:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/permissions/[permissionId]
 * Delete a specific permission
 */
async function deletePermission(req: NextRequest, context?: unknown) {
  try {
    const { params: paramsPromise } = context as { params: Promise<{ permissionId: string }> };
    const params = await paramsPromise;
    const { permissionId } = params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await RBACService.deletePermission(session.user.id, permissionId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete permission' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}

// We will use policy:manage as it typically implies view/create/update/delete based on action inheritance.
// Alternatively we can use policy:update and policy:delete.
export const PUT = withPolicy(updatePermission, { policy: 'policy:update' });
export const DELETE = withPolicy(deletePermission, { policy: 'policy:delete' });
