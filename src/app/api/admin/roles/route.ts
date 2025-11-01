import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { roles } from '@/server/db/schema';
import { eq, or, ilike, count, and } from 'drizzle-orm';
import { auth } from '@/config/auth';

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

    // Build where condition for search
    const whereConditions = [];
    
    if (search.trim()) {
      whereConditions.push(
        or(
          ilike(roles.name, `%${search}%`),
          ilike(roles.description, `%${search}%`)
        )!
      );
    }


    // Get roles with user count
    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isDefault: roles.isDefault,
        isSystemManaged: roles.isSystemManaged,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(whereConditions.length ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(roles.createdAt);

    // For each role, count users via user_roles table
    const { userRoles } = await import('@/server/db/schema');
    const userCounts = Object.fromEntries(
      (await db
        .select({ roleId: roles.id, count: count() })
        .from(roles)
        .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
        .groupBy(roles.id)
      ).map(r => [r.roleId, Number(r.count)])
    );

    const rolesWithCount = rolesList.map(role => ({ ...role, userCount: userCounts[role.id] || 0 }));

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(roles)
      .where(whereConditions.length ? and(...whereConditions) : undefined);
    
    const totalCount = totalCountResult[0]?.count || 0;

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

    // Check if role with same name exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, name.trim())
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
        .where(eq(roles.isDefault, true));
    }

    // Create the role
    const newRole = await db
      .insert(roles)
      .values({
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

// Export route handlers with policy checking
export const GET = withPolicy(getRoles, API_POLICIES.ROLE_MANAGE);
export const POST = withPolicy(createRole, API_POLICIES.ROLE_MANAGE);
