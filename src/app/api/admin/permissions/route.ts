import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';

/**
 * GET /api/admin/permissions
 * List all available permissions grouped by category
 */
async function getPermissions(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flat = searchParams.get('flat') === 'true';

    if (flat) {
      const permissions = await RBACService.getAllPermissionsFlat();
      return NextResponse.json({ success: true, data: { permissions } });
    }

    const groups = await RBACService.getAllPermissions();
    return NextResponse.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

/**
 * POST /api/admin/permissions
 * Create a new custom permission
 */
async function createPermission(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, displayName, resource, action } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Permission name is required' }, { status: 400 });
    }

    const result = await RBACService.createPermission(session.user.id, {
      name: name.trim(),
      description: description?.trim() || undefined,
      category: category?.trim() || undefined,
      displayName: displayName?.trim() || undefined,
      resource: resource?.trim() || undefined,
      action: action?.trim() || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create permission' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: { permission: result.data }
    });
  } catch (error) {
    console.error('Create permission error:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}

export const GET = withPolicy(getPermissions, { policy: 'policy:view' });
export const POST = withPolicy(createPermission, { policy: 'policy:create' });
