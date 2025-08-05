import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { db } from '@/db';
import { roles, tenantUsers } from '@/db/schema';
import { eq, or, ilike, count, and, sql } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * GET /api/admin/roles - List all roles (Admin only)
 */
async function getRoles(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // For now, get the user's tenant to scope roles
    // In a proper implementation, this would be based on the admin's current tenant context
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

    // Build where condition for search
    const whereConditions = [eq(roles.tenantId, userTenant.tenantId)];
    
    if (search.trim()) {
      whereConditions.push(
        or(
          ilike(roles.name, `%${search}%`),
          ilike(roles.description, `%${search}%`)
        )!
      );
    }

    // Get roles with pagination and search
    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isDefault: roles.isDefault,
        isSystemManaged: roles.isSystemManaged,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        userCount: sql<number>`COALESCE((
          SELECT COUNT(*)::int 
          FROM user_roles ur 
          INNER JOIN tenant_users tu ON ur.tenant_user_id = tu.id 
          WHERE ur.role_id = ${roles.id} AND tu.tenant_id = ${userTenant.tenantId}
        ), 0)`,
      })
      .from(roles)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(roles.createdAt);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(roles)
      .where(and(...whereConditions));
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Transform the data to match the expected format
    const rolesWithCount = rolesList.map(role => ({
      ...role,
      _count: {
        userRoles: role.userCount,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesWithCount,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        }
      }
    });

  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles - Create a new role (Admin only)
 */
async function createRole(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Check if role with same name exists in this tenant
    const existingRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.tenantId, userTenant.tenantId),
        eq(roles.name, name.trim())
      ),
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from other roles
    if (isDefault) {
      await db
        .update(roles)
        .set({ isDefault: false })
        .where(and(
          eq(roles.tenantId, userTenant.tenantId),
          eq(roles.isDefault, true)
        ));
    }

    // Create the role
    const newRole = await db
      .insert(roles)
      .values({
        tenantId: userTenant.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: isDefault || false,
        isSystemManaged: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      data: { role: newRole[0] }
    });

  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// Export route handlers with permission checking
export const GET = withPermission(getRoles, API_PERMISSIONS.USER_VIEW);
export const POST = withPermission(createRole, API_PERMISSIONS.USER_CREATE);
