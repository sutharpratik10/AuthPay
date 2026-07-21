import { db } from '@/server/db';
import { userNotifications, adminNotifications, webPushSubscriptions } from '@/server/db/schema/logs';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { sseManager } from '@/server/sse/channel';
import webpush from 'web-push';
import { users } from '@/server/db/schema/auth';
import { userRoles, roles } from '@/server/db/schema/rbac';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@authpay.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

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

    // 3. Send WebPush notification
    if (vapidPublicKey && vapidPrivateKey) {
      try {
        const subs = await db.select().from(webPushSubscriptions).where(eq(webPushSubscriptions.userId, userId));
        const payload = JSON.stringify({
          title,
          body: content,
          url: link || '/'
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              // Subscription expired or unsubscribed, remove from DB
              await db.delete(webPushSubscriptions).where(eq(webPushSubscriptions.id, sub.id));
            } else {
              console.error('WebPush error for user', userId, e);
            }
          }
        }
      } catch (e) {
        console.error('Failed to process web push for user', userId, e);
      }
    }

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

    // 3. Send WebPush notification to admins
    if (vapidPublicKey && vapidPrivateKey) {
      try {
        const adminUsers = await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(userRoles, eq(users.id, userRoles.userId))
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(roles.name, 'admin'));

        const adminIds = adminUsers.map((u) => u.id);
        
        if (adminIds.length > 0) {
          const subs = await db.select().from(webPushSubscriptions).where(inArray(webPushSubscriptions.userId, adminIds));
          const payload = JSON.stringify({
            title,
            body: content,
            url: link || '/protected/admin/dashboard'
          });

          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              );
            } catch (e: any) {
              if (e.statusCode === 410 || e.statusCode === 404) {
                await db.delete(webPushSubscriptions).where(eq(webPushSubscriptions.id, sub.id));
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to process web push for admins', e);
      }
    }

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

  /**
   * Get count of unread notifications for admins
   */
  static async getAdminUnreadCount(): Promise<number> {
    const result = await db.select({ id: adminNotifications.id })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false));
    return result.length;
  }

  /**
   * Get paginated admin notifications
   */
  static async getAdminNotifications(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const items = await db.select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCountQuery = await db.select({ id: adminNotifications.id })
      .from(adminNotifications);
      
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
