import { db } from "@/server/db";
import { users, otpCodes, userRoles } from "@/server/db/schema";
import { EmailQueueService } from "./email-queue";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, and, lt, gt } from "drizzle-orm";
import { sanitizeEmail, normalizeEmail, sanitizeName, validatePassword, hasSQLInjectionPatterns } from "@/lib/utils/sanitize";

type ServiceResult<T extends object = object> = { success: true } & T | { success: false; error: string };

function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  );
}

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async registerUser(email: string, password: string, name?: string): Promise<ServiceResult<{ user: { id: string; email: string; name?: string | null; isEmailVerified: boolean } }>> {
    try {
      // Sanitize and validate email
      const sanitizedEmail = sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: "Invalid email format" };
      }

      // Normalize the email to prevent + aliases and Gmail dot variants
      const normalizedEmail = normalizeEmail(sanitizedEmail);

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error || "Invalid password" };
      }

      // Sanitize name if provided
      const sanitizedName = name ? sanitizeName(name) : null;

      // Security check for injection patterns
      if (hasSQLInjectionPatterns(email) || (name && hasSQLInjectionPatterns(name))) {
        console.warn('[SECURITY] Potential injection attempt in registration');
        return { success: false, error: "Invalid input detected" };
      }

      // Check if user already exists (using normalized email)
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, normalizedEmail)
      });
      if (existingUser) {
        console.log(`[Registration] Duplicate registration attempt for user: ${existingUser.id}`);
        return { success: false, error: "Registration failed. Please try again or contact support." };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get the default 'User' role (case-insensitive search)
      const defaultRole = await db.query.roles.findFirst({
        where: (rolesTable, { eq, or, sql }) => 
          or(
            eq(sql`LOWER(${rolesTable.name})`, 'user'),
            eq(rolesTable.isDefault, true)
          ),
        columns: { id: true }
      });

      if (!defaultRole) {
        return { success: false, error: 'Default user role not found. Please contact administrator.' };
      }

      // Generate verification code before the transaction
      const verificationCode = this.generateVerificationCode();

      // Run user, role, and OTP inserts atomically
      const newUser = await db.transaction(async (tx) => {
        const [createdUser] = await tx.insert(users).values({
          id: uuidv4(),
          email: normalizedEmail,
          password: hashedPassword,
          name: sanitizedName,
          isEmailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning();

        await tx.insert(userRoles).values({
          userId: createdUser.id,
          roleId: defaultRole.id,
        });

        await tx.insert(otpCodes).values({
          userId: createdUser.id,
          code: verificationCode,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          isValid: true,
          createdAt: new Date(),
        });

        return createdUser;
      });

      // Queue verification email for background sending (non-blocking)
      EmailQueueService.enqueueVerificationEmail(newUser.email, verificationCode);

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isEmailVerified: newUser.isEmailVerified ?? false,
        },
      };
    } catch (error: unknown) {
      if (isUniqueViolationError(error)) {
        console.warn('[Registration] Unique violation during registration insert:', error);
        return { success: false, error: "Registration failed. Please try again or contact support." };
      }
      console.error("Registration error:", error);
      return { success: false, error: "An unexpected error occurred during registration. Please try again later." };
    }
  }

  /**
   * Verify email with OTP code
   * @param code - The OTP code entered by the user
   * @param userId - Optional user ID from the signed verification token or session.
   *                   When provided, the user's active verification record is looked up
   *                   first so wrong guesses increment attemptCount and lock out after 5 tries.
   */
  static async verifyEmail(code: string, userId?: string): Promise<ServiceResult<{ user: { email: string; name?: string } }>> {
    try {
      let otpRecord: (typeof otpCodes.$inferSelect & { user: { email: string; name?: string } }) | undefined;

      if (userId) {
        // Cookie/session-based flow: look up the user's active verification record
        // and compare the provided code. This lets us count wrong guesses.
        otpRecord = await db.query.otpCodes.findFirst({
          where: (otpCodes, { eq, and }) =>
            and(
              eq(otpCodes.userId, userId),
              eq(otpCodes.type, "email_verification"),
              eq(otpCodes.isValid, true)
            ),
          with: {
            user: true,
          },
        }) as (typeof otpCodes.$inferSelect & { user: { email: string; name?: string } }) | undefined;

        if (!otpRecord) {
          return { success: false, error: "Invalid or expired verification code" };
        }

        const now = new Date();
        const isExpired = otpRecord.expiresAt < now;
        const isMatch = otpRecord.code === code;

        if (!isMatch || isExpired) {
          const newAttemptCount = (otpRecord.attemptCount ?? 0) + 1;
          const shouldInvalidate = newAttemptCount >= 5;

          await db.update(otpCodes)
            .set({
              attemptCount: newAttemptCount,
              ...(shouldInvalidate ? { isValid: false } : {}),
            })
            .where(eq(otpCodes.id, otpRecord.id));

          return { success: false, error: "Invalid or expired verification code" };
        }
      } else {
        // Direct POST fallback: exact-code lookup, IP-level rate limiting handles brute force
        await this.cleanupExpiredOtpCodes();
        otpRecord = await db.query.otpCodes.findFirst({
          where: (otpCodes, { eq, and }) =>
            and(
              eq(otpCodes.code, code),
              eq(otpCodes.type, "email_verification"),
              eq(otpCodes.isValid, true)
            ),
          with: {
            user: true,
          },
        }) as (typeof otpCodes.$inferSelect & { user: { email: string; name?: string } }) | undefined;

        if (!otpRecord || otpRecord.expiresAt < new Date()) {
          return { success: false, error: "Invalid or expired verification code" };
        }
      }

      // Update user's email verification status
      await db.update(users)
        .set({
          isEmailVerified: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, otpRecord.userId));
      
      // Delete the used OTP code
      await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
      
      // Fetch the updated user to return correct data
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, otpRecord.userId),
        columns: {
          email: true,
          name: true,
          isEmailVerified: true
        }
      });
      
      // Send welcome email in background (non-blocking)
      if (updatedUser) {
        EmailQueueService.enqueueWelcomeEmail(
          updatedUser.email,
          updatedUser.name || ''
        );
      }
      
      return {
        success: true,
        user: {
          email: updatedUser?.email || otpRecord.user.email,
          name: updatedUser?.name ?? otpRecord.user.name,
        },
      };
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      return { success: false, error: "An unexpected error occurred during verification. Please try again later." };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<ServiceResult> {
    try {
      // Sanitize and validate email
      const sanitizedEmail = sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: "Invalid email format" };
      }

      // Normalize the email to match the stored address
      const normalizedEmail = normalizeEmail(sanitizedEmail);

      // Security check for injection patterns
      if (hasSQLInjectionPatterns(email)) {
        console.warn('[SECURITY] Potential injection attempt in resend verification');
        return { success: false, error: "Invalid input detected" };
      }

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, normalizedEmail)
      });
      if (!user) {
        return { success: false, error: "User not found" };
      }
      if (user.isEmailVerified) {
        return { success: false, error: "Email already verified" };
      }
      const verificationCode = this.generateVerificationCode();
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "email_verification")
          )
        );
      await db.insert(otpCodes).values({
        userId: user.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isValid: true,
        createdAt: new Date(),
      });
      
      // Queue verification email for background sending (non-blocking)
      EmailQueueService.enqueueVerificationEmail(user.email, verificationCode);
      
      return { success: true };
    } catch (error: unknown) {
      console.error("Resend verification email error:", error);
      return { success: false, error: "An unexpected error occurred while resending verification email. Please try again later." };
    }
  }

  /**
   * Initiate password reset process with secure token-based flow
   */
  static async initiatePasswordReset(email: string): Promise<ServiceResult<{ message: string; sessionToken?: string }>> {
    try {
      // Sanitize and validate email
      const sanitizedEmail = sanitizeEmail(email);
      if (!sanitizedEmail) {
        // Return generic message to prevent email enumeration
        return {
          success: true,
          message: "If an account exists with this email, a reset code has been sent"
        };
      }

      // Security check for injection patterns
      if (hasSQLInjectionPatterns(email)) {
        console.warn('[SECURITY] Potential injection attempt in password reset');
        return {
          success: true,
          message: "If an account exists with this email, a reset code has been sent"
        };
      }

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, sanitizedEmail)
      });
      
      // SECURITY: Always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        console.log('[Password Reset] User not found, but returning success to prevent enumeration')
        return {
          success: true,
          message: "If an account exists with this email, a reset code has been sent"
        };
      }
      
      const resetCode = this.generateVerificationCode();
      
      // SECURITY: Generate session token for secure flow
      const crypto = await import('crypto');
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Delete old password reset codes for this user
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "password_reset")
          )
        );
      
      // Insert new code with session token
      await db.insert(otpCodes).values({
        userId: user.id,
        code: resetCode,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isValid: true,
        createdAt: new Date(),
        sessionToken, // SECURITY: Token for step validation
      });
      
      console.log('[Password Reset] Session token generated for user:', user.email)
      
      // Queue password reset email for background sending (non-blocking)
      EmailQueueService.enqueuePasswordResetEmail(user.email, resetCode, user.name || '');
      
      return {
        success: true,
        message: "Password reset code sent to your email",
        sessionToken // Return session token to client
      };
    } catch (error: unknown) {
      console.error("Password reset initiation error:", error);
      return {
        success: false,
        error: "An unexpected error occurred while initiating password reset. Please try again later."
      };
    }
  }

  /**
   * Verify password reset OTP code
   */
  static async verifyPasswordResetCode(code: string): Promise<ServiceResult<{ userId: string; email?: string }>> {
    try {
      await this.cleanupExpiredOtpCodes();
      const otpRecord = await db.query.otpCodes.findFirst({
        where: (otpCodes, { eq, and }) =>
          and(
            eq(otpCodes.code, code),
            eq(otpCodes.type, "password_reset"),
            eq(otpCodes.isValid, true)
          ),
        with: {
          user: true,
        },
      }) as (typeof otpCodes.$inferSelect & { user?: { email: string; name?: string } });
      if (!otpRecord) {
        return {
          success: false,
          error: "Invalid or expired password reset code"
        };
      }
      if (otpRecord.expiresAt < new Date()) {
        await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
        return {
          success: false,
          error: "Password reset code has expired"
        };
      }
      return {
        success: true,
        userId: otpRecord.userId,
        email: otpRecord.user?.email
      };
    } catch (error: unknown) {
      console.error("Password reset code verification error:", error);
      return {
        success: false,
        error: "An unexpected error occurred during code verification. Please try again later."
      };
    }
  }
  /**
   * Reset password with verified OTP
   */
  static async resetPassword(code: string, newPassword: string): Promise<ServiceResult<{ message: string }>> {
    try {
      if (!code || typeof code !== 'string') {
        return {
          success: false,
          error: "Invalid verification code"
        };
      }
      if (!newPassword || typeof newPassword !== 'string') {
        return {
          success: false,
          error: "Invalid new password"
        };
      }
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.error || "Invalid new password"
        };
      }
      const verificationResult = await this.verifyPasswordResetCode(code);
      if (!verificationResult.success) {
        return verificationResult;
      }
      if (!('userId' in verificationResult) || !verificationResult.userId) {
        return {
          success: false,
          error: "Invalid user data from verification"
        };
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, verificationResult.userId));
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.code, code),
            eq(otpCodes.type, "password_reset")
          )
        );
      return {
        success: true,
        message: "Password reset successfully"
      };
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      return {
        success: false,
        error: "An unexpected error occurred while resetting password. Please try again later."
      };
    }
  }

  /**
   * SECURE PASSWORD RESET: Reset password using verified token
   * This method requires a verifiedToken (proof that code was verified in previous step)
   * This prevents attackers from bypassing the verification step
   */
  static async resetPasswordWithVerifiedToken(verifiedToken: string, newPassword: string): Promise<ServiceResult<{ message: string }>> {
    try {
      if (!verifiedToken || typeof verifiedToken !== 'string') {
        return {
          success: false,
          error: "Invalid verified token"
        };
      }
      
      if (!newPassword || typeof newPassword !== 'string') {
        return {
          success: false,
          error: "Invalid new password"
        };
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.error || "Invalid new password"
        };
      }

      console.log('[Reset Password] Verifying token and resetting password')

      // SECURITY: Verify the token exists, is valid, and was verified
      const resetCode = await db.query.otpCodes.findFirst({
        where: and(
          eq(otpCodes.verifiedToken, verifiedToken),
          eq(otpCodes.type, 'password_reset'),
          eq(otpCodes.isValid, true),
          gt(otpCodes.expiresAt, new Date())
        )
      });

      if (!resetCode) {
        console.log('[Reset Password] Invalid or expired verified token')
        return {
          success: false,
          error: "Invalid or expired reset session. Please start the password reset process again."
        };
      }

      // SECURITY: Verify the code was actually verified (has verifiedAt timestamp)
      if (!resetCode.verifiedAt) {
        console.log('[Reset Password] Token was not verified through proper flow')
        return {
          success: false,
          error: "Invalid reset session. Please verify your code first."
        };
      }

      console.log('[Reset Password] Token validated, updating password')

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, resetCode.userId));

      // SECURITY: Delete the OTP code (one-time use)
      await db.delete(otpCodes)
        .where(eq(otpCodes.id, resetCode.id));

      console.log('[Reset Password] Password reset successful')

      return {
        success: true,
        message: "Password reset successfully"
      };
    } catch (error: unknown) {
      console.error("[Reset Password Error]:", error);
      return {
        success: false,
        error: "An unexpected error occurred while resetting password. Please try again later."
      };
    }
  }

  /**
   * Generate an 8-digit verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
  /**
   * Clean up expired OTP codes
   */
  static async cleanupExpiredOtpCodes(): Promise<ServiceResult<{ deletedCount: number }>> {
    try {
      const now = new Date();
      const result = await db.delete(otpCodes)
        .where(lt(otpCodes.expiresAt, now));
      return {
        success: true,
        deletedCount: result.length || 0
      };
    } catch (error: unknown) {
      console.error("OTP cleanup error:", error);
      return {
        success: false,
        error: "Failed to cleanup expired OTP codes"
      };
    }
  }
}