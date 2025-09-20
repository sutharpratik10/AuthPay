import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';

/**
 * GET /api/user/admin-status - Check if current user is admin
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await PermissionService.isAdmin(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: { isAdmin }
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
