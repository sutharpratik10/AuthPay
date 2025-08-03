import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS, requireAdmin } from '@/lib/api-permissions';
import { db } from '@/db';
import { users, tenants, tenantUsers, subscriptionPlans } from '@/db/schema';
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
      : undefined;    // Get users with pagination and search
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isEmailVerified: users.isEmailVerified,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      // Subscription info
      subscriptionName: subscriptionPlans.name,
      subscriptionBillingCycle: subscriptionPlans.billingCycle,
      subscriptionStartDate: tenants.planEffectiveDate,
      subscriptionExpiryDate: tenants.planExpiryDate,
    })
    .from(users)
    .leftJoin(tenantUsers, eq(users.id, tenantUsers.userId))
    .leftJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
    .leftJoin(subscriptionPlans, eq(tenants.planId, subscriptionPlans.id))
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
    const { userId, role } = body;

    // Validate input
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, role: true }
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

    // Update user role using the permission service
    const success = await import('@/services/permissions').then(({ PermissionService }) => 
      PermissionService.setUserRole(adminCheck.userId!, userId, role)
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        userId,
        oldRole: existingUser.role,
        newRole: role
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
