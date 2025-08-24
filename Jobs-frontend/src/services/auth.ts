import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { emailService } from "./email";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, and, lt } from "drizzle-orm";

type ServiceResult<T extends object = object> = { success: true } & T | { success: false; error: string };

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async registerUser(email: string, password: string, name?: string): Promise<ServiceResult<{ user: { id: string; email: string; name?: string | null; isEmailVerified: boolean } }>> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase())
      });
      if (existingUser) {
        return { success: false, error: "Email already in use" };
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Get the default 'user' role id
      const userRole = await db.query.roles.findFirst({
        where: (roles, { eq }) => eq(roles.name, 'user'),
        columns: { id: true }
      });
      if (!userRole) {
        return { success: false, error: 'Default user role not found' };
      }
      // Create the user
      const [newUser] = await db.insert(users).values({
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        isEmailVerified: false,
        roleId: userRole.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      // Store verification code with 15-minute expiration
      await db.insert(otpCodes).values({
        userId: newUser.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isValid: true,
        createdAt: new Date(),
      });
      // Send verification email
      await emailService.sendVerificationEmail(newUser.email, verificationCode);
      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isEmailVerified: newUser.isEmailVerified,
        },
      };
    } catch (error: unknown) {
      console.error("Registration error:", error);
      return { success: false, error: error instanceof Error ? error.message : "An error occurred during registration" };
    }
  }

  /**
   * Verify email with OTP code
   */
  static async verifyEmail(code: string): Promise<ServiceResult<{ user: { email: string; name?: string } }>> {
    try {
      await this.cleanupExpiredOtpCodes();
      const otpRecord = await db.query.otpCodes.findFirst({
        where: (otpCodes, { eq, and }) =>
          and(
            eq(otpCodes.code, code),
            eq(otpCodes.type, "email_verification"),
            eq(otpCodes.isValid, true)
          ),
        with: {
          user: true,
        },
      }) as (typeof otpCodes.$inferSelect & { user: { email: string; name?: string } });
      if (!otpRecord) {
        return { success: false, error: "Invalid or expired verification code" };
      }
      if (otpRecord.expiresAt < new Date()) {
        await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
        return { success: false, error: "Verification code has expired" };
      }
      await db.update(users)
        .set({
          isEmailVerified: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, otpRecord.userId));
      await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
      if (otpRecord.user) {
        await emailService.sendWelcomeEmail(
          otpRecord.user.email,
          otpRecord.user.name || ''
        );
      }
      return {
        success: true,
        user: otpRecord.user,
      };
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      return { success: false, error: error instanceof Error ? error.message : "An error occurred during verification" };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<ServiceResult> {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase())
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
      await emailService.sendVerificationEmail(user.email, verificationCode);
      return { success: true };
    } catch (error: unknown) {
      console.error("Resend verification email error:", error);
      return { success: false, error: error instanceof Error ? error.message : "An error occurred while resending verification email" };
    }
  }

  /**
   * Initiate password reset process
   */
  static async initiatePasswordReset(email: string): Promise<ServiceResult<{ message: string }>> {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase())
      });
      if (!user) {
        return {
          success: false,
          error: `Account with email ${email} doesn't exist`
        };
      }
      const resetCode = this.generateVerificationCode();
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "password_reset")
          )
        );
      await db.insert(otpCodes).values({
        userId: user.id,
        code: resetCode,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isValid: true,
        createdAt: new Date(),
      });
      await emailService.sendPasswordResetEmail(user.email, resetCode, user.name || '');
      return {
        success: true,
        message: "Password reset code sent to your email"
      };
    } catch (error: unknown) {
      console.error("Password reset initiation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while initiating password reset"
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
        error: error instanceof Error ? error.message : "An error occurred during code verification"
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
      if (newPassword.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long"
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
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('constraint')) {
          return {
            success: false,
            error: "Database constraint error. Please try again."
          };
        }
        if (error.message.includes('connection')) {
          return {
            success: false,
            error: "Database connection error. Please try again later."
          };
        }
      }
      return {
        success: false,
        error: "An error occurred while resetting password. Please try again."
      };
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
        error: error instanceof Error ? error.message : "Failed to cleanup expired OTP codes"
      };
    }
  }
}