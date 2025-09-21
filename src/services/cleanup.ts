import { AuthService } from './auth';
import { db } from '@/db';
import { userSubscriptions, subscriptionStatuses } from '@/db/schema';
import { lt, and, eq, gt } from 'drizzle-orm';

/**
 * Cleanup service for maintaining database hygiene
 * This service handles the removal of expired and invalid data
 */
export class CleanupService {
  /**
   * Run all cleanup tasks
   */
  static async runCleanup() {
    console.log('[CLEANUP] Starting cleanup tasks...');
    try {
      // Clean up expired OTP codes
      const otpCleanup = await AuthService.cleanupExpiredOtpCodes();
      console.log(`[CLEANUP] OTP cleanup: ${otpCleanup.success ? 'Success' : 'Failed'}`);
      if (otpCleanup.success) {
        console.log(`[CLEANUP] Deleted ${otpCleanup.deletedCount} expired OTP codes`);
      }

      // Clean up expired subscriptions
      const subscriptionCleanup = await this.cleanupExpiredSubscriptions();
      console.log(`[CLEANUP] Subscription cleanup: ${subscriptionCleanup.success ? 'Success' : 'Failed'}`);
      if (subscriptionCleanup.success) {
        console.log(`[CLEANUP] Processed ${subscriptionCleanup.expiredCount} expired subscriptions`);
      }

      console.log('[CLEANUP] All cleanup tasks completed');
      return { success: true };
    } catch (error) {
      console.error('[CLEANUP] Error during cleanup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Clean up expired subscriptions by marking them as expired
   */
  static async cleanupExpiredSubscriptions() {
    try {
      const nowIso = new Date().toISOString();

      // Get status IDs
      const activeStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'active'),
        columns: { id: true }
      });
      const expiredStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'expired'),
        columns: { id: true }
      });

      if (!activeStatus?.id || !expiredStatus?.id) {
        throw new Error('Required subscription statuses not found');
      }

      // Find all userSubscriptions that are expired and still active
      const expiredSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            lt(userSubscriptions.expiryDate, nowIso),
            eq(userSubscriptions.statusId, activeStatus.id)
          )
        );

      const expiredCount = expiredSubscriptions.length;

      if (expiredCount > 0) {
        await db
          .update(userSubscriptions)
          .set({
            statusId: expiredStatus.id,
            updatedAt: new Date().toISOString()
          })
          .where(
            and(
              lt(userSubscriptions.expiryDate, nowIso),
              eq(userSubscriptions.statusId, activeStatus.id)
            )
          );
        console.log(`[CLEANUP] Marked ${expiredCount} expired subscriptions as expired`);
      }

      return {
        success: true,
        expiredCount
      };
    } catch (error) {
      console.error('[CLEANUP] Error cleaning up expired subscriptions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        expiredCount: 0
      };
    }
  }

  /**
   * Get subscription status report
   */
  static async getSubscriptionStatusReport() {
    try {
      const nowIso = new Date().toISOString();

      // Get status IDs
      const activeStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'active'),
        columns: { id: true }
      });
      const expiredStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'expired'),
        columns: { id: true }
      });

      if (!activeStatus?.id || !expiredStatus?.id) {
        throw new Error('Required subscription statuses not found');
      }

      // Count active subscriptions
      const activeSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.statusId, activeStatus.id));

      // Count expired subscriptions
      const expiredSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.statusId, expiredStatus.id));

      // Count expiring soon (within 7 days)
      const sevenDaysFromNowIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const expiringSoon = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.statusId, activeStatus.id),
            lt(userSubscriptions.expiryDate, sevenDaysFromNowIso),
            gt(userSubscriptions.expiryDate, nowIso)
          )
        );

      return {
        success: true,
        report: {
          active: activeSubscriptions.length,
          expired: expiredSubscriptions.length,
          expiringSoon: expiringSoon.length
        }
      };
    } catch (error) {
      console.error('[CLEANUP] Error generating subscription status report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Schedule periodic cleanup (if running in a server environment)
   * This method sets up an interval to run cleanup tasks
   * @param intervalMinutes - How often to run cleanup (in minutes, default: 60)
   */
  static schedulePeriodicCleanup(intervalMinutes: number = 60) {
    console.log(`[CLEANUP] Scheduling periodic cleanup every ${intervalMinutes} minutes`);

    // Run cleanup immediately
    this.runCleanup();

    // Schedule periodic cleanup
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(() => {
      this.runCleanup();
    }, intervalMs);
  }
}