import { NextResponse } from 'next/server';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';

/**
 * GET /api/rbac/user/policies
 * Returns the effective permissions and roles for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectivePermissions = await RBACService.getEffectivePermissions(session.user.id);

    return NextResponse.json({
      success: true,
      data: effectivePermissions
    });
  } catch (error) {
    console.error('Get user policies error:', error);
    return NextResponse.json({ error: 'Failed to fetch user policies' }, { status: 500 });
  }
}
