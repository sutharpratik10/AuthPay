import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { NotificationService } from '@/server/services/notification';
import { RBACService } from '@/lib/rbac/rbac-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await RBACService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await NotificationService.getAdminNotifications(page, limit);
    const unreadCount = await NotificationService.getAdminUnreadCount();

    return NextResponse.json({
      notifications: result.items,
      unreadCount,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to fetch admin notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
