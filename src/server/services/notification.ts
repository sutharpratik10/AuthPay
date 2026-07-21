import { db } from '@/server/db';
import { userNotifications, adminNotifications } from '@/server/db/schema/logs';
import { eq, desc, and } from 'drizzle-orm';
import { sseManager } from '@/server/sse/channel';

export class NotificationService {
  /**
   * Create a notification for a specific user and broadcast via SSE
   */
  static async createUserNotification(
    userId: string,
    title: string,
    content: string,
    type: 'info' | 'warning' | 'error' | 'success',
    link?: string
  ) {
    // 1. Upsert DB row
    const [notification] = await db.insert(userNotifications).values({
      userId,
      title,
      content,
      type,
      link,
    }).returning();

    // 2. Broadcast to SSE channel
    const channelName = `user:${userId}:notifications`;
    const channel = sseManager.getChannel(channelName);
    
    // Also fetch unread count to push
    const unreadCount = await this.getUnreadCount(userId);

    channel.broadcast({
      type: 'notification',
      data: notification,
      unreadCount
    });

    return notification;
  }

  /**
   * Create a notification for admins and broadcast via SSE
   */
  static async createAdminNotification(
    title: string,
    content: string,
    type: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    link?: string
  ) {
    // 1. Upsert DB row
    const [notification] = await db.insert(adminNotifications).values({
      title,
      content,
      type,
      priority,
      link,
    }).returning();

    // 2. Broadcast to admin SSE channel
    const channelName = 'admin:notifications';
    const channel = sseManager.getChannel(channelName);

    channel.broadcast({
      type: 'admin_notification',
      data: notification,
    });

    return notification;
  }

  /**
   * Mark a user notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const [updated] = await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, userId)
      ))
      .returning();

    if (updated) {
      const channelName = `user:${userId}:notifications`;
      const channel = sseManager.getChannel(channelName);
      const unreadCount = await this.getUnreadCount(userId);
      
      channel.broadcast({
        type: 'notifications_read',
        data: { notificationId },
        unreadCount
      });
    }

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));

    const channelName = `user:${userId}:notifications`;
    const channel = sseManager.getChannel(channelName);
    
    channel.broadcast({
      type: 'notifications_read_all',
      unreadCount: 0
    });
  }

  /**
   * Get count of unread notifications for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ id: userNotifications.id })
      .from(userNotifications)
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));
    return result.length;
  }

  /**
   * Get paginated notifications for a user
   */
  static async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const items = await db.select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountQuery = await db.select({ id: userNotifications.id })
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId));
      
    const totalCount = totalCountQuery.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      pagination: {
        total: totalCount,
        pageCount: totalPages,
        currentPage: page,
        perPage: limit,
      }
    };
  }
}
