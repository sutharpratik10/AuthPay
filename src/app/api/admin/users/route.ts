import { NextRequest } from 'next/server';
import { withPolicy, API_POLICIES, requireAdmin } from '@/lib/api/permissions';
import { 
  withApiHandler, 
  successResponse, 
  errorResponse,
  parseRequestBody,
  getPaginationParams,
  getSearchParam
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { users, subscriptionPlans, roles, userSubscriptions, userRoles } from '@/server/db/schema';
import { eq, or, ilike, count } from 'drizzle-orm';

/**
 * GET /api/admin/users - List all users (Admin only)
 * Uses centralized API helpers for auth, pagination, and response handling
 */
const getUsers = withApiHandler(
  async (req: NextRequest) => {
    const { page, limit, offset } = getPaginationParams(req);
    const search = getSearchParam(req);

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

    return successResponse({
      users: usersWithData,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    });
  },
  { requireAdmin: true }
);

/**
 * PATCH /api/admin/users - Update user roles (Admin only)
 * Supports both single role (roleName) and multiple roles (roleNames)
 * Uses centralized API helpers for auth and response handling
 */
const updateUserRole = withApiHandler(
  async (req: NextRequest) => {
    const { data: body, error: parseError } = await parseRequestBody<{
      userId: string;
      roleName?: string;
      roleNames?: string[];
      roleIds?: string[];
    }>(req);
    if (parseError) return parseError;

    const { userId, roleName, roleNames, roleIds } = body!;

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    // Get admin user ID for the service call
    const adminCheck = await requireAdmin();
    if (!adminCheck.isAdmin || !adminCheck.userId) {
      return errorResponse('Admin access required', 403);
    }

    // Determine the list of role IDs to set
    let finalRoleIds: string[] = [];

    if (roleIds && roleIds.length > 0) {
      finalRoleIds = roleIds;
    } else {
      // Support backward compatibility with roleName(s)
      const rolesToAssign = roleNames || (roleName ? [roleName] : []);
      if (rolesToAssign.length > 0) {
        const roleRecords = await db.query.roles.findMany({ 
          where: or(...rolesToAssign.map((name: string) => eq(roles.name, name))),
          columns: { id: true, name: true }
        });
        
        if (roleRecords.length !== rolesToAssign.length) {
          const foundRoles = roleRecords.map(r => r.name);
          const missingRoles = rolesToAssign.filter((r: string) => !foundRoles.includes(r));
          return errorResponse(`Role(s) not found: ${missingRoles.join(', ')}`, 400);
        }
        
        finalRoleIds = roleRecords.map(r => r.id);
      } else {
        return errorResponse('At least one role must be provided', 400);
      }
    }

    // Use RBACService to set roles (handles priority, super admin protection, and audit logging)
    const { RBACService } = await import('@/lib/rbac/rbac-service');
    const result = await RBACService.setUserRoles(adminCheck.userId, userId, finalRoleIds);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to update user roles', 400);
    }

    return successResponse(
      { userId, roleIds: finalRoleIds },
      result.message || 'User roles updated successfully'
    );
  },
  { requireAdmin: true }
);

// Export route handlers with policy checking
export const GET = withPolicy(getUsers, API_POLICIES.USER_MANAGE);
export const PATCH = withPolicy(updateUserRole, API_POLICIES.USER_MANAGE);
