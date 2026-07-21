import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { NotificationService } from '@/server/services/notification';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await NotificationService.getNotifications(session.user.id, page, limit);
    const unreadCount = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      notifications: result.items,
      unreadCount,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Failed to fetch user notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
