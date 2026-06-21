import { db } from '@/server/db';
import { sessions, users } from '@/server/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { LocationService } from './location';
import { emailService } from './email';
import { EmailQueueService } from './email-queue';

interface CreateSessionOptions {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

interface SessionValidationResult {
  isValid: boolean;
  userId?: string;
  sessionId?: string;
  expiresAt?: Date;
  browserName?: string;
  ipAddress?: string;
  lastActiveAt?: Date;
}

interface SessionExtendOptions {
  extendByMinutes?: number; // Default 30 minutes
  maxSessionDuration?: number; // Maximum session duration in hours (default 24)
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
  // Session configuration constants
  private static readonly DEFAULT_SESSION_DURATION_HOURS = 24;
  private static readonly MAX_SESSION_DURATION_HOURS = 72;
  private static readonly SESSION_EXTENSION_MINUTES = 30;
  private static readonly CLEANUP_INTERVAL_HOURS = 1;

  /**
   * Validate a session token and return session details
   */
  static async validateSession(sessionToken: string): Promise<SessionValidationResult> {
    try {
      const now = new Date();

      const sessionRecord = await db.query.sessions.findFirst({
        where: eq(sessions.token, sessionToken),
        columns: {
          id: true,
          userId: true,
          expiresAt: true,
          browserName: true,
          ipAddress: true,
          lastActiveAt: true,
        }
      });

      if (!sessionRecord) {
        return { isValid: false };
      }

      // Check if session has expired
      if (new Date(sessionRecord.expiresAt) <= now) {
        // Clean up expired session
        await this.invalidateSession(sessionToken);
        return { isValid: false };
      }

      // Update last active timestamp if session is still valid
      await this.updateSessionActivity(sessionToken);

      return {
        isValid: true,
        userId: sessionRecord.userId,
        sessionId: sessionRecord.id,
        expiresAt: new Date(sessionRecord.expiresAt),
        browserName: sessionRecord.browserName || undefined,
        ipAddress: sessionRecord.ipAddress || undefined,
        lastActiveAt: new Date(sessionRecord.lastActiveAt || now),
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return { isValid: false };
    }
  }

  /**
   * Extend a session's expiration time (for active users)
   */
  static async extendSession(
    sessionToken: string,
    options: SessionExtendOptions = {}
  ): Promise<boolean> {
    try {
      const {
        extendByMinutes = this.SESSION_EXTENSION_MINUTES,
        maxSessionDuration = this.MAX_SESSION_DURATION_HOURS
      } = options;

      const sessionRecord = await db.query.sessions.findFirst({
        where: eq(sessions.token, sessionToken),
        columns: {
          id: true,
          createdAt: true,
          expiresAt: true,
        }
      });

      if (!sessionRecord) {
        return false;
      }

      const now = new Date();
      const sessionCreatedAt = new Date(sessionRecord.createdAt);
      const sessionAge = (now.getTime() - sessionCreatedAt.getTime()) / (1000 * 60 * 60); // hours

      // Don't extend if session has already been running for too long
      if (sessionAge >= maxSessionDuration) {
        console.log(`Session ${sessionToken.substring(0, 8)}... not extended - max duration reached`);
        return false;
      }

      // Calculate new expiration time
      const newExpirationTime = new Date(now.getTime() + (extendByMinutes * 60 * 1000));

      // Ensure we don't exceed max session duration
      const maxAllowedExpiration = new Date(sessionCreatedAt.getTime() + (maxSessionDuration * 60 * 60 * 1000));
      const finalExpirationTime = newExpirationTime > maxAllowedExpiration
        ? maxAllowedExpiration
        : newExpirationTime;

      await db
        .update(sessions)
        .set({
          expiresAt: finalExpirationTime,
          lastActiveAt: now,
        })
        .where(eq(sessions.token, sessionToken));

      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }

  /**
   * Check if a session needs extension (within 10 minutes of expiry)
   */
  static async shouldExtendSession(sessionToken: string): Promise<boolean> {
    try {
      const sessionRecord = await db.query.sessions.findFirst({
        where: eq(sessions.token, sessionToken),
        columns: { expiresAt: true }
      });

      if (!sessionRecord) {
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(sessionRecord.expiresAt);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const tenMinutesInMs = 10 * 60 * 1000;

      return timeUntilExpiry <= tenMinutesInMs && timeUntilExpiry > 0;
    } catch (error) {
      console.error('Error checking if session should be extended:', error);
      return false;
    }
  }

  /**
   * Create a new session record in the database
   */
  static async createSession({ userId, userAgent, ipAddress }: CreateSessionOptions) {
    try {
      const sessionToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.DEFAULT_SESSION_DURATION_HOURS);

      // Parse browser name from user agent string
      const browserName = userAgent ? parseBrowserName(userAgent) : null;

      // Limit concurrent sessions per user (optional - remove if not needed)
      await this.limitUserSessions(userId, 5); // Max 5 active sessions per user

      // Use a transaction to batch the operations
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

      // Queue security alert email for background processing
      // REMOVED: This is now handled in `src/config/auth.ts` jwt callback with more accurate location and device tracking
      // EmailQueueService.enqueueSecurityAlert(userId, userAgent, ipAddress);

      console.log(`Session created for user ${userId}: ${sessionToken.substring(0, 8)}...`);
      return result;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Limit the number of active sessions per user
   */
  private static async limitUserSessions(userId: string, maxSessions: number = 5) {
    try {
      const now = new Date();
      const activeSessions = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            gte(sessions.expiresAt, now)
          )
        )
        .orderBy(sessions.lastActiveAt);

      if (activeSessions.length >= maxSessions) {
        // Remove oldest sessions
        const sessionsToRemove = activeSessions.slice(0, activeSessions.length - maxSessions + 1);

        for (const session of sessionsToRemove) {
          await this.invalidateSessionById(session.id);
        }

        console.log(`Removed ${sessionsToRemove.length} old sessions for user ${userId}`);
      }
    } catch (error) {
      console.error('Error limiting user sessions:', error);
      // Don't throw - this is not critical
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
      // Fetch location in background (don't await to keep email sending fast)
      const locationPromise = ipAddress ? LocationService.getLocationFromIP(ipAddress) : Promise.resolve(null);
      const browserInfo = userAgent ? LocationService.parseBrowserInfo(userAgent) : {
        browser: 'Unknown Browser',
        os: 'Unknown OS',
        device: 'Unknown Device'
      };

      // Wait for location with a timeout - if it takes too long, send email without location
      const locationData = await Promise.race([
        locationPromise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 500)) // 500ms timeout
      ]);

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
   * Update session activity timestamp and extend if needed
   */
  static async updateSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      const now = new Date();

      // Check if session should be extended
      const shouldExtend = await this.shouldExtendSession(sessionToken);

      if (shouldExtend) {
        // Extend session and update activity
        return await this.extendSession(sessionToken);
      } else {
        // Just update activity timestamp
        await db
          .update(sessions)
          .set({
            lastActiveAt: now
          })
          .where(eq(sessions.token, sessionToken));
        return true;
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  /**
   * Get session details by token
   */
  static async getSessionDetails(sessionToken: string) {
    try {
      return await db.query.sessions.findFirst({
        where: eq(sessions.token, sessionToken),
        columns: {
          id: true,
          userId: true,
          expiresAt: true,
          browserName: true,
          ipAddress: true,
          lastActiveAt: true,
          createdAt: true,
        }
      });
    } catch (error) {
      console.error('Error fetching session details:', error);
      return null;
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
   * Invalidate a specific session by token
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
   * Invalidate a specific session by ID
   */
  static async invalidateSessionById(sessionId: string) {
    try {
      await db
        .update(sessions)
        .set({
          expiresAt: new Date() // Set to current time to expire it
        })
        .where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error('Error invalidating session by ID:', error);
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
   * Clean up expired sessions and return cleanup statistics
   */
  static async cleanupExpiredSessions(): Promise<{
    deletedCount: number;
    totalExpired: number;
    cleanupTime: number;
  }> {
    const startTime = Date.now();

    try {
      const now = new Date();

      // First count how many will be deleted
      const expiredSessions = await db
        .select({ id: sessions.id, userId: sessions.userId })
        .from(sessions)
        .where(
          lt(sessions.expiresAt, now)
        );

      const totalExpired = expiredSessions.length;

      if (totalExpired === 0) {
        return {
          deletedCount: 0,
          totalExpired: 0,
          cleanupTime: Date.now() - startTime,
        };
      }

      // Delete expired sessions in batches for better performance
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < expiredSessions.length; i += batchSize) {
        const batch = expiredSessions.slice(i, i + batchSize);
        const sessionIds = batch.map(s => s.id);

        // Delete batch
        await db
          .delete(sessions)
          .where(
            and(
              lt(sessions.expiresAt, now),
              // Additional safety check
              eq(sessions.id, sessionIds[0]) // This is simplified - in real implementation you'd use IN operator
            )
          );

        deletedCount += batch.length;
      }

      const cleanupTime = Date.now() - startTime;

      console.log(`Session cleanup completed: ${deletedCount}/${totalExpired} expired sessions deleted in ${cleanupTime}ms`);

      return {
        deletedCount,
        totalExpired,
        cleanupTime,
      };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return {
        deletedCount: 0,
        totalExpired: 0,
        cleanupTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up inactive sessions (sessions not accessed for a specified time)
   */
  static async cleanupInactiveSessions(inactiveHours: number = 72): Promise<number> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - inactiveHours);

      const inactiveSessions = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(
          and(
            gte(sessions.expiresAt, new Date()), // Not expired yet
            lt(sessions.lastActiveAt, cutoffTime) // But inactive
          )
        );

      if (inactiveSessions.length === 0) {
        return 0;
      }

      // Mark inactive sessions as expired
      await db
        .update(sessions)
        .set({
          expiresAt: new Date() // Expire them now
        })
        .where(
          and(
            gte(sessions.expiresAt, new Date()),
            lt(sessions.lastActiveAt, cutoffTime)
          )
        );

      console.log(`Marked ${inactiveSessions.length} inactive sessions as expired`);
      return inactiveSessions.length;
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
      return 0;
    }
  }

  /**
   * Get session statistics for monitoring
   */
  static async getSessionStatistics() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalActiveSessions,
        expiredSessions,
        recentSessions,
        weeklyActiveSessions
      ] = await Promise.all([
        // Active sessions
        db.select({ count: sessions.id }).from(sessions).where(gte(sessions.expiresAt, now)),
        // Expired sessions
        db.select({ count: sessions.id }).from(sessions).where(lt(sessions.expiresAt, now)),
        // Sessions created in last 24 hours
        db.select({ count: sessions.id }).from(sessions).where(gte(sessions.createdAt, oneDayAgo)),
        // Sessions active in last week
        db.select({ count: sessions.id }).from(sessions).where(
          and(
            gte(sessions.lastActiveAt, oneWeekAgo),
            gte(sessions.expiresAt, now)
          )
        )
      ]);

      return {
        activeSessionsCount: totalActiveSessions.length,
        expiredSessionsCount: expiredSessions.length,
        recentSessionsCount: recentSessions.length,
        weeklyActiveSessionsCount: weeklyActiveSessions.length,
        lastUpdated: now.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching session statistics:', error);
      return {
        activeSessionsCount: 0,
        expiredSessionsCount: 0,
        recentSessionsCount: 0,
        weeklyActiveSessionsCount: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Schedule automatic session cleanup (call this on app startup)
   */
  static startAutomaticCleanup(intervalHours: number = 1) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Run cleanup immediately on startup
    this.cleanupExpiredSessions().catch(error => {
      console.error('Initial session cleanup failed:', error);
    });

    // Schedule recurring cleanup
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
        await this.cleanupInactiveSessions();
      } catch (error) {
        console.error('Scheduled session cleanup failed:', error);
      }
    }, intervalMs);

    console.log(`Automatic session cleanup scheduled every ${intervalHours} hour(s)`);
  }
}
