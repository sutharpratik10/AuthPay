import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { LocationService } from './location';
import { emailService } from './email';

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
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      // Parse browser name from user agent string
      const browserName = userAgent ? parseBrowserName(userAgent) : null;      // Use a transaction to batch the operations
      const result = await db.transaction(async (tx) => {
        // Create the session record
        const newSession = await tx.insert(sessions).values({
          userId,
          token: sessionToken,
          expiresAt,
          browserName: browserName,
          ipAddress: ipAddress || null,
          lastActiveAt: new Date(),
          createdAt: new Date(),
        }).returning();

        // Update user's last login time in the same transaction
        await tx
          .update(users)
          .set({ 
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.id, userId));

        return newSession[0];
      });

      // Send security alert email asynchronously (don't block session creation)
      this.sendSecurityAlertEmail(userId, userAgent, ipAddress).catch(error => {
        console.error('Failed to send security alert email:', error);
        // Don't throw error - session creation should succeed even if email fails
      });

      return result;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send security alert email if user has security alerts enabled
   */
  private static async sendSecurityAlertEmail(userId: string, userAgent?: string, ipAddress?: string) {
    try {
      // Get user data and preferences
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true
        },
        with: {
          userPreferences: {
            columns: {
              securityAlerts: true
            }
          }
        }
      });

      if (!user) {
        console.warn('User not found for security alert:', userId);
        return;
      }

      // Check if user has security alerts enabled (defaults to true if no preferences set)
      const securityAlertsEnabled = user.userPreferences?.securityAlerts !== false;
      
      if (!securityAlertsEnabled) {
        console.log('Security alerts disabled for user:', user.email);
        return;
      }

      // Get location and browser information
      const locationData = ipAddress ? await LocationService.getLocationFromIP(ipAddress) : null;
      const browserInfo = userAgent ? LocationService.parseBrowserInfo(userAgent) : {
        browser: 'Unknown Browser',
        os: 'Unknown OS',
        device: 'Unknown Device'
      };

      // Format location for email
      const location = locationData 
        ? LocationService.formatLocationForEmail(locationData, browserInfo)
        : `Unknown Location (${browserInfo.browser} on ${browserInfo.os})`;

      // Format device info for email
      const deviceInfo = `${browserInfo.browser} on ${browserInfo.os} (${browserInfo.device})`;

      // Send the security alert email
      await emailService.sendSecurityAlertEmail(
        user.email,
        user.name || '',
        new Date(),
        location,
        ipAddress || 'Unknown IP',
        deviceInfo
      );

      console.log('Security alert email sent to:', user.email);
    } catch (error) {
      console.error('Error sending security alert email:', error);
      // Don't throw - this is a background operation
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
      
      // First count how many will be deleted
      const expiredSessions = await db
        .select()
        .from(sessions)
        .where(
          lt(sessions.expiresAt, now)
        );
      
      const deletedCount = expiredSessions.length;
      
      // Delete expired sessions
      await db
        .delete(sessions)
        .where(
          lt(sessions.expiresAt, now)
        );
      
      console.log(`Cleaned up ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Count expired sessions for cleanup reporting
   */
  static async countExpiredSessions() {
    try {
      const now = new Date();
      const result = await db
        .select()
        .from(sessions)
        .where(
          lt(sessions.expiresAt, now)
        );
      
      return result.length;
    } catch (error) {
      console.error('Error counting expired sessions:', error);
      return 0;
    }
  }
}
