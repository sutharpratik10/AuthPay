import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { emailService } from "./email";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, and, lt } from "drizzle-orm";

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async registerUser(email: string, password: string, name?: string) {
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

      // Create the user
      const [newUser] = await db.insert(users).values({
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Generate verification code
      const verificationCode = this.generateVerificationCode();

      // Store verification code with 15-minute expiration
      await db.insert(otpCodes).values({
        userId: newUser.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
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
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An error occurred during registration" };
    }
  }

  /**
   * Verify email with OTP code
   */
  static async verifyEmail(code: string) {
    try {
      // Clean up expired codes first
      await this.cleanupExpiredOtpCodes();

      // Find valid OTP code
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
      });

      if (!otpRecord) {
        return { success: false, error: "Invalid or expired verification code" };
      }

      // Check if code is expired
      if (otpRecord.expiresAt < new Date()) {
        // Delete expired code
        await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
        return { success: false, error: "Verification code has expired" };
      }

      // Mark user as verified
      await db
        .update(users)
        .set({ 
          isEmailVerified: true, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, otpRecord.userId));

      // Delete the OTP code immediately after successful verification
      await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));

      // Send welcome email
      if (otpRecord.user) {
        await emailService.sendWelcomeEmail(
          otpRecord.user.email,
          otpRecord.user.name || ''
        );
      }

      return {
        success: true,
        user: otpRecord.user
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return { success: false, error: "An error occurred during verification" };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string) {
    try {
      // Find the user
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase())
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (user.isEmailVerified) {
        return { success: false, error: "Email already verified" };
      }

      // Generate new verification code
      const verificationCode = this.generateVerificationCode();

      // Delete old codes instead of just invalidating them
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "email_verification")
          )
        );

      // Store new verification code with 15-minute expiration
      await db.insert(otpCodes).values({
        userId: user.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isValid: true,
        createdAt: new Date(),
      });

      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationCode);

      return { success: true };
    } catch (error) {
      console.error("Resend verification email error:", error);
      return { success: false, error: "An error occurred while resending verification email" };
    }
  }

  /**
   * Initiate password reset process
   */
  static async initiatePasswordReset(email: string) {
    try {
      // Check if email exists in user table
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase())
      });

      if (!user) {
        return { 
          success: false, 
          error: `Account with email ${email} doesn't exist` 
        };
      }

      // Generate OTP code for password reset
      const resetCode = this.generateVerificationCode();

      // Delete any existing password reset codes for this user
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "password_reset")
          )
        );

      // Store password reset code with 15-minute expiration
      await db.insert(otpCodes).values({
        userId: user.id,
        code: resetCode,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isValid: true,
        createdAt: new Date(),
      });

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, resetCode, user.name || '');

      return { 
        success: true,
        message: "Password reset code sent to your email" 
      };
    } catch (error) {
      console.error("Password reset initiation error:", error);
      return { 
        success: false, 
        error: "An error occurred while initiating password reset" 
      };
    }
  }

  /**
   * Verify password reset OTP code
   */
  static async verifyPasswordResetCode(code: string) {
    try {
      // Clean up expired codes first
      await this.cleanupExpiredOtpCodes();

      // Find valid password reset OTP code
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
      });

      if (!otpRecord) {
        return { 
          success: false, 
          error: "Invalid or expired password reset code" 
        };
      }

      // Check if code is expired
      if (otpRecord.expiresAt < new Date()) {
        // Delete expired code
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
    } catch (error) {
      console.error("Password reset code verification error:", error);
      return { 
        success: false, 
        error: "An error occurred during code verification" 
      };
    }
  }

  /**
   * Reset password with verified OTP
   */
  static async resetPassword(code: string, newPassword: string) {
    try {
      // First verify the code is still valid
      const verificationResult = await this.verifyPasswordResetCode(code);
      
      if (!verificationResult.success) {
        return verificationResult;
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date() 
        })
        .where(eq(users.id, verificationResult.userId!));

      // Delete the used password reset code
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
    } catch (error) {
      console.error("Password reset error:", error);
      return { 
        success: false, 
        error: "An error occurred while resetting password" 
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
  static async cleanupExpiredOtpCodes() {
    try {
      const now = new Date();
      const result = await db.delete(otpCodes)
        .where(lt(otpCodes.expiresAt, now));
      
      return {
        success: true,
        deletedCount: result.length || 0
      };
    } catch (error) {
      console.error("OTP cleanup error:", error);
      return {
        success: false,
        error: "Failed to cleanup expired OTP codes"
      };
    }
  }
}