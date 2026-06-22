/**
 * Email Queue Service
 * Handles background email sending to prevent blocking HTTP requests
 */

import { db } from '@/server/db';
import { emailService } from './email';
import { LocationService } from './location';

interface SecurityAlertJob {
  type: 'security_alert';
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

interface VerificationEmailJob {
  type: 'verification_email';
  email: string;
  code: string;
}

interface PasswordResetEmailJob {
  type: 'password_reset_email';
  email: string;
  code: string;
  name: string;
}

interface WelcomeEmailJob {
  type: 'welcome_email';
  email: string;
  name: string;
}

type EmailJob = SecurityAlertJob | VerificationEmailJob | PasswordResetEmailJob | WelcomeEmailJob;

export class EmailQueueService {
  private static queue: EmailJob[] = [];
  private static isProcessing = false;

  /**
   * Add a security alert email job to the queue
   * This returns immediately without blocking
   */
  static enqueueSecurityAlert(userId: string, userAgent?: string, ipAddress?: string) {
    this.queue.push({ 
      type: 'security_alert',
      userId, 
      userAgent, 
      ipAddress 
    });
    console.log(`[EmailQueue] Security alert queued for user ${userId}. Queue size: ${this.queue.length}`);
    
    // Process immediately in a completely detached promise
    // We intentionally don't await this and catch any errors
    Promise.resolve().then(() => this.processNextJob()).catch(err => {
      console.error('[EmailQueue] Error in background processing:', err);
    });
  }

  /**
   * Add a verification email job to the queue
   * This returns immediately without blocking
   */
  static enqueueVerificationEmail(email: string, code: string) {
    this.queue.push({
      type: 'verification_email',
      email,
      code
    });
    console.log(`[EmailQueue] Verification email queued for ${email}. Queue size: ${this.queue.length}`);
    
    // Process immediately in a completely detached promise
    Promise.resolve().then(() => this.processNextJob()).catch(err => {
      console.error('[EmailQueue] Error in background processing:', err);
    });
  }

  /**
   * Add a password reset email job to the queue
   * This returns immediately without blocking
   */
  static enqueuePasswordResetEmail(email: string, code: string, name: string) {
    this.queue.push({
      type: 'password_reset_email',
      email,
      code,
      name
    });
    console.log(`[EmailQueue] Password reset email queued for ${email}. Queue size: ${this.queue.length}`);
    
    // Process immediately in a completely detached promise
    Promise.resolve().then(() => this.processNextJob()).catch(err => {
      console.error('[EmailQueue] Error in background processing:', err);
    });
  }

  /**
   * Add a welcome email job to the queue
   * This returns immediately without blocking
   */
  static enqueueWelcomeEmail(email: string, name: string) {
    this.queue.push({
      type: 'welcome_email',
      email,
      name
    });
    console.log(`[EmailQueue] Welcome email queued for ${email}. Queue size: ${this.queue.length}`);
    
    // Process immediately in a completely detached promise
    Promise.resolve().then(() => this.processNextJob()).catch(err => {
      console.error('[EmailQueue] Error in background processing:', err);
    });
  }

  /**
   * Process a single job from the queue
   */
  private static async processNextJob() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const job = this.queue.shift();
      if (job) {
        if (job.type === 'security_alert') {
          console.log(`[EmailQueue] Processing security alert for user ${job.userId}`);
          await this.processSecurityAlertJob(job);
        } else if (job.type === 'verification_email') {
          console.log(`[EmailQueue] Processing verification email for ${job.email}`);
          await this.processVerificationEmailJob(job);
        } else if (job.type === 'password_reset_email') {
          console.log(`[EmailQueue] Processing password reset email for ${job.email}`);
          await this.processPasswordResetEmailJob(job);
        } else if (job.type === 'welcome_email') {
          console.log(`[EmailQueue] Processing welcome email for ${job.email}`);
          await this.processWelcomeEmailJob(job);
        }
        
        console.log(`[EmailQueue] Completed job. Remaining: ${this.queue.length}`);
        
        // Process next job if any (in a detached promise)
        if (this.queue.length > 0) {
          Promise.resolve().then(() => this.processNextJob()).catch(err => {
            console.error('[EmailQueue] Error processing next job:', err);
          });
        }
      }
    } catch (error) {
      console.error('[EmailQueue] Error processing job:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single security alert job
   */
  private static async processSecurityAlertJob(job: SecurityAlertJob) {
    const { userId, userAgent, ipAddress } = job;
    
    try {
      // Import users table
      const { users } = await import('@/server/db/schema');
      const { eq } = await import('drizzle-orm');

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
        console.warn(`[EmailQueue] User not found: ${userId}`);
        return;
      }

      // Check if security alerts are enabled FIRST before doing any work
      const securityAlertsEnabled = user.userPreferences?.securityAlerts !== false;
      
      if (!securityAlertsEnabled) {
        console.log(`[EmailQueue] Security alerts disabled for user: ${user.email} - skipping email`);
        return;
      }

      // Only log "Sending" after confirming alerts are enabled
      console.log(`[EmailQueue] Sending security alert email to ${user.email}`);

      // Get location and browser information
      const locationPromise = ipAddress 
        ? LocationService.getLocationFromIP(ipAddress) 
        : Promise.resolve(null);
      
      const browserInfo = userAgent 
        ? LocationService.parseBrowserInfo(userAgent) 
        : {
            browser: 'Unknown Browser',
            os: 'Unknown OS',
            device: 'Unknown Device'
          };

      // Wait for location with timeout (1 second - we're not blocking HTTP now)
      const locationData = await Promise.race([
        locationPromise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 1000))
      ]);

      // Format location
      const location = locationData 
        ? `${locationData.city || 'Unknown'}, ${locationData.region || 'Unknown'}, ${locationData.country || 'Unknown'}`
        : 'Unknown Location';

      const deviceInfo = `${browserInfo.browser} on ${browserInfo.os}`;

      // Send the email
      await emailService.sendSecurityAlertEmail(
        user.email,
        user.name || 'User',
        new Date(),
        location,
        ipAddress || 'Unknown',
        deviceInfo
      );

      console.log(`[EmailQueue] Security alert sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`[EmailQueue] Failed to send security alert for user ${userId}:`, error);
      // Don't rethrow - we don't want to crash the queue processor
    }
  }

  /**
   * Process a verification email job
   */
  private static async processVerificationEmailJob(job: VerificationEmailJob) {
    const { email, code } = job;
    
    try {
      console.log(`[EmailQueue] Sending verification email to ${email}`);

      await emailService.sendVerificationEmail(email, code);

      console.log(`[EmailQueue] Verification email sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EmailQueue] Failed to send verification email to ${email}:`, error);
      // Don't rethrow - we don't want to crash the queue processor
    }
  }

  /**
   * Process a password reset email job
   */
  private static async processPasswordResetEmailJob(job: PasswordResetEmailJob) {
    const { email, code, name } = job;
    
    try {
      console.log(`[EmailQueue] Sending password reset email to ${email}`);

      await emailService.sendPasswordResetEmail(email, code, name);

      console.log(`[EmailQueue] Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EmailQueue] Failed to send password reset email to ${email}:`, error);
      // Don't rethrow - we don't want to crash the queue processor
    }
  }

  /**
   * Process a welcome email job
   */
  private static async processWelcomeEmailJob(job: WelcomeEmailJob) {
    const { email, name } = job;
    
    try {
      console.log(`[EmailQueue] Sending welcome email to ${email}`);

      await emailService.sendWelcomeEmail(email, name);

      console.log(`[EmailQueue] Welcome email sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EmailQueue] Failed to send welcome email to ${email}:`, error);
      // Don't rethrow - we don't want to crash the queue processor
    }
  }

  /**
   * Get queue status
   */
  static getStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
}
