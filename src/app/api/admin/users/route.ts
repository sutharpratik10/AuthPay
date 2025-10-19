import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS, requireAdmin } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { users, subscriptionPlans, roles, userSubscriptions, userRoles } from '@/server/db/schema';
import { eq, or, ilike, count } from 'drizzle-orm';

/**
 * GET /api/admin/users - List all users (Admin only)
 */
async function getUsers(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build where condition for search
    const whereCondition = search.trim() 
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      : undefined;
    // Get users with pagination and search
    // Note: Users can have multiple roles, we'll get the first role for display
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      isEmailVerified: users.isEmailVerified,
      isActive: users.isActive,
      isSuspended: users.isSuspended,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      // Role info from user_roles join
      roleId: roles.id,
      role: roles.name,
      // Subscription info (joined)
      subscriptionName: subscriptionPlans.name,
      subscriptionBillingCycle: subscriptionPlans.billingCycle,
      subscriptionStartDate: userSubscriptions.startDate,
      subscriptionExpiryDate: userSubscriptions.expiryDate,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.userId))
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(whereCondition)
    .limit(limit)
    .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db.select({ count: count() })
      .from(users)
      .where(whereCondition);
    
    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        users: userList,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[userId] - Update user role (Admin only)
 */
async function updateUserRole(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, roleName } = body;

    // Validate input
    if (!userId || !roleName) {
      return NextResponse.json(
        { error: 'User ID and role name are required' },
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
    }

    // Get admin user ID for the service call
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin || !adminCheck.userId) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find the role by name
    const roleRecord = await db.query.roles.findFirst({ 
      where: eq(roles.name, roleName) 
    });
    
    if (!roleRecord) {
      return NextResponse.json(
        { error: 'Role not found in roles table' },
        { status: 400 }
      );
    }

    // Get user's current roles
    const currentRoles = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: { role: { columns: { name: true } } }
    });

    // Remove all existing roles
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Assign new role via user_roles table
    await db.insert(userRoles).values({
      userId,
      roleId: roleRecord.id,
      assignedBy: adminCheck.userId,
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${roleName}`,
      data: {
        userId,
        oldRoles: currentRoles.map(r => r.role.name),
        newRole: roleName
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

// Export route handlers with permission checking
export const GET = withPermission(getUsers, API_PERMISSIONS.USER_VIEW);
export const PATCH = withPermission(updateUserRole, API_PERMISSIONS.USER_EDIT);
