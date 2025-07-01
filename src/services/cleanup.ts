import { AuthService } from './auth';

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
      
      console.log('[CLEANUP] All cleanup tasks completed');
      return { success: true };
    } catch (error) {
      console.error('[CLEANUP] Error during cleanup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
