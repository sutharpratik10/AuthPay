import { AuthService } from './auth';
import { db } from '@/db';
import { tenants } from '@/db/schema';
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
   * Clean up expired subscriptions by marking them as inactive
   */
  static async cleanupExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Find all tenants with expired subscriptions that are still active
      const expiredTenants = await db
        .select()
        .from(tenants)
        .where(
          and(
            lt(tenants.planExpiryDate, now),
            eq(tenants.isActive, true)
          )
        );
      
      const expiredCount = expiredTenants.length;
      
      if (expiredCount > 0) {
        // Mark expired subscriptions as inactive
        await db
          .update(tenants)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(
            and(
              lt(tenants.planExpiryDate, now),
              eq(tenants.isActive, true)
            )
          );
        
        console.log(`[CLEANUP] Marked ${expiredCount} expired subscriptions as inactive`);
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
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Count active subscriptions
      const activeSubscriptions = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.isActive, true),
            gt(tenants.planExpiryDate, now)
          )
        );
      
      // Count expired subscriptions
      const expiredSubscriptions = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.isActive, true),
            lt(tenants.planExpiryDate, now)
          )
        );
      
      // Count expiring soon (within 7 days)
      const expiringSoon = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.isActive, true),
            gt(tenants.planExpiryDate, now),
            lt(tenants.planExpiryDate, sevenDaysFromNow)
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
