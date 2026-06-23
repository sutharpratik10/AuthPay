import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { auditLogs, users } from '@/server/db/schema';
import { eq, desc, inArray, count, and } from 'drizzle-orm';
import { auth } from '@/config/auth';

const RBAC_ACTIONS = [
  'role_created',
  'role_updated',
  'role_deleted',
  'permission_created',
  'role_permissions_set',
  'role_assigned',
  'role_removed',
  'roles_set',
];

/**
 * GET /api/admin/rbac-audit
 * Get paginated audit logs for RBAC actions
 */
async function getRbacAuditLogs(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action'); // optional filter
    const offset = (page - 1) * limit;

    const whereConditions = [];

    // Filter by RBAC actions only
    if (action && RBAC_ACTIONS.includes(action)) {
      whereConditions.push(eq(auditLogs.action, action));
    } else {
      whereConditions.push(inArray(auditLogs.action, RBAC_ACTIONS));
    }

    const conditions = and(...whereConditions);

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(conditions);
    
    const total = totalCountResult[0]?.count || 0;

    // Get logs with user details
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.performedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(conditions)
      .orderBy(desc(auditLogs.performedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });

  } catch (error) {
    console.error('Get RBAC audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// Re-use ADMIN_ACCESS policy from routing since we haven't strictly created a new API_POLICY constant 
// and we know routing-utils will protect the UI page with admin:access
export const GET = withPolicy(getRbacAuditLogs, API_POLICIES.ADMIN_ACCESS);
