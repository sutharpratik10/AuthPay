import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';

/**
 * GET /api/admin/roles - List all roles with permissions (Admin only)
 */
async function getRoles(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const result = await RBACService.getAllRolesWithPermissions(page, limit, search);

    return NextResponse.json({
      success: true,
      data: {
        roles: result.roles,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        }
      }
    });

  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

/**
 * POST /api/admin/roles - Create a new role (Admin only)
 */
async function createRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isDefault, priority, permissionIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const result = await RBACService.createRole(session.user.id, {
      name: name.trim(),
      description: description?.trim() || undefined,
      isDefault: isDefault || false,
      priority: priority !== undefined ? parseInt(priority) : 0,
      permissionIds: Array.isArray(permissionIds) ? permissionIds : [],
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create role' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Role created successfully',
      data: { role: result.data }
    });

  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

// Export route handlers with policy checking
export const GET = withPolicy(getRoles, API_POLICIES.ROLE_MANAGE);
export const POST = withPolicy(createRole, API_POLICIES.ROLE_MANAGE);
