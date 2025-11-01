import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES, requireAdmin } from '@/lib/api/permissions';
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
    const userList = await db.query.users.findMany({
      where: whereCondition,
      limit,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        isActive: true,
        isSuspended: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    // Get roles for each user separately to avoid relation ambiguity
    const usersWithData = await Promise.all(userList.map(async (user) => {
      // Get user roles
      const userRolesList = await db.query.userRoles.findMany({
        where: eq(userRoles.userId, user.id),
        with: {
          role: {
            columns: {
              id: true,
              name: true
            }
          }
        }
      });

      // Get subscription using raw query to avoid relation issues
      const subscriptionResult = await db
        .select({
          planName: subscriptionPlans.name,
          billingCycle: subscriptionPlans.billingCycle,
          startDate: userSubscriptions.startDate,
          expiryDate: userSubscriptions.expiryDate
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, user.id))
        .limit(1);

      const subscription = subscriptionResult[0];

      return {
        ...user,
        roles: userRolesList.map(ur => ur.role.name),
        role: userRolesList[0]?.role.name || 'user', // For backward compatibility
        subscriptionName: subscription?.planName || null,
        subscriptionBillingCycle: subscription?.billingCycle || null,
        subscriptionStartDate: subscription?.startDate || null,
        subscriptionExpiryDate: subscription?.expiryDate || null
      };
    }));

    // Get total count for pagination
    const totalCountResult = await db.select({ count: count() })
      .from(users)
      .where(whereCondition);
    
    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithData,
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
 * PATCH /api/admin/users - Update user roles (Admin only)
 * Supports both single role (roleName) and multiple roles (roleNames)
 */
async function updateUserRole(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, roleName, roleNames } = body;

    // Support both single role and multiple roles
    const rolesToAssign = roleNames || (roleName ? [roleName] : []);

    // Validate input
    if (!userId || !rolesToAssign || rolesToAssign.length === 0) {
      return NextResponse.json(
        { error: 'User ID and at least one role are required' },
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

    // Find all roles by name
    const roleRecords = await db.query.roles.findMany({ 
      where: or(...rolesToAssign.map((name: string) => eq(roles.name, name)))
    });
    
    if (roleRecords.length !== rolesToAssign.length) {
      const foundRoles = roleRecords.map(r => r.name);
      const missingRoles = rolesToAssign.filter((r: string) => !foundRoles.includes(r));
      return NextResponse.json(
        { error: `Role(s) not found: ${missingRoles.join(', ')}` },
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

    // Assign new roles via user_roles table
    await db.insert(userRoles).values(
      roleRecords.map(roleRecord => ({
        userId,
        roleId: roleRecord.id,
        assignedBy: adminCheck.userId,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `User roles updated to: ${rolesToAssign.join(', ')}`,
      data: {
        userId,
        oldRoles: currentRoles.map(r => r.role.name),
        newRoles: rolesToAssign
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    );
  }
}

// Export route handlers with policy checking
export const GET = withPolicy(getUsers, API_POLICIES.USER_MANAGE);
export const PATCH = withPolicy(updateUserRole, API_POLICIES.USER_MANAGE);
