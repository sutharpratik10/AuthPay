import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CreateSessionOptions {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Parse user agent string to extract browser name
 */
function parseBrowserName(userAgent: string): string {
  if (!userAgent) return 'Unknown Browser';
  
  const ua = userAgent.toLowerCase();
  
  // Check for specific browsers in order of specificity
  if (ua.includes('edg/') || ua.includes('edge/')) {
    return 'Microsoft Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    return 'Google Chrome';
  } else if (ua.includes('firefox/')) {
    return 'Mozilla Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    return 'Safari';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    return 'Opera';
  } else if (ua.includes('brave/')) {
    return 'Brave';
  } else if (ua.includes('vivaldi/')) {
    return 'Vivaldi';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    return 'Internet Explorer';
  } else {
    return 'Unknown Browser';
  }
}

export class SessionService {
  /**
   * Create a new session record in the database
   */  static async createSession({ userId, userAgent, ipAddress }: CreateSessionOptions) {
    try {
      const sessionToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      // Parse browser name from user agent string
      const browserName = userAgent ? parseBrowserName(userAgent) : null;      const newSession = await db.insert(sessions).values({
        userId,
        token: sessionToken,
        expiresAt,
        browserName: browserName,
        ipAddress: ipAddress || null,
        lastActiveAt: new Date(),
        createdAt: new Date(),
      }).returning();

      // Update user's last login time
      await db
        .update(users)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return newSession[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update session activity timestamp
   */
  static async updateSessionActivity(sessionToken: string) {
    try {
      await db
        .update(sessions)
        .set({ 
          lastActiveAt: new Date() 
        })
        .where(eq(sessions.token, sessionToken));
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getUserActiveSessions(userId: string) {
    try {
      const now = new Date();
      return await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            gte(sessions.expiresAt, now)
          )
        )
        .orderBy(sessions.lastActiveAt);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionToken: string) {
    try {
      await db
        .update(sessions)
        .set({ 
          expiresAt: new Date() // Set to current time to expire it
        })
        .where(eq(sessions.token, sessionToken));
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  /**
   * Invalidate all sessions for a user (logout from all devices)
   */
  static async invalidateAllUserSessions(userId: string) {
    try {
      await db
        .update(sessions)
        .set({ 
          expiresAt: new Date() // Set to current time to expire them
        })
        .where(eq(sessions.userId, userId));
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
    }
  }  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions() {
    try {
      const now = new Date();
      const result = await db
        .delete(sessions)
        .where(
          lt(sessions.expiresAt, now)
        );
      
      console.log(`Cleaned up expired sessions`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}
