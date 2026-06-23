import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';

/**
 * GET /api/admin/users/[userId]/permissions
 * Returns the effective permissions and roles for a specific user.
 * Requires user:view policy.
 */
async function getUserPermissions(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const effectivePermissions = await RBACService.getEffectivePermissions(userId);

    return NextResponse.json({
      success: true,
      data: effectivePermissions
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch user permissions' }, { status: 500 });
  }
}

export const GET = withPolicy(getUserPermissions, API_POLICIES.USER_VIEW);
