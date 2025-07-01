import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { emailService } from "./email";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { eq, and, or, lt } from "drizzle-orm";

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
      
      if (!newUser) {
        return { success: false, error: "Failed to create user" };
      }
      
      // Generate verification code
      const verificationCode = this.generateVerificationCode();
        // Store verification code with 15-minute expiration
      await db.insert(otpCodes).values({
        userId: newUser.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        isValid: true,
        createdAt: new Date(),
      });
      
      // Send verification email
      await emailService.sendVerificationEmail(email, verificationCode);
      
      return { 
        success: true, 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name 
        } 
      };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An error occurred during registration" };
    }
  }
  
  /**
   * Generate a random 6-digit verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Verify user email with verification code
   */  static async verifyEmail(code: string) {
    try {
      // Clean up expired codes first
      await this.cleanupExpiredCodes();
      
      // Find the OTP record
      const otpRecord = await db.query.otpCodes.findFirst({
        where: (otpCodes, { eq, and, gt }) => and(
          eq(otpCodes.code, code),
          eq(otpCodes.type, "email_verification"),
          eq(otpCodes.isValid, true),
          gt(otpCodes.expiresAt, new Date())
        ),
        with: {
          user: true
        }
      });
      
      if (!otpRecord) {
        return { success: false, error: "Invalid or expired verification code" };
      }
        // Update user as verified
      await db.update(users)
        .set({ 
          isEmailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, otpRecord.userId));
      
      // Delete the OTP code after successful verification
      await db.delete(otpCodes)
        .where(eq(otpCodes.id, otpRecord.id));
      
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
        expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now
        isValid: true,
        createdAt: new Date(),
      });
      
      // Send verification email
      await emailService.sendVerificationEmail(email, verificationCode);
      
      return { success: true };
    } catch (error) {
      console.error("Resend verification email error:", error);
      return { success: false, error: "An error occurred while resending verification email" };
    }
  }
  
  /**
   * Clean up expired OTP codes from the database
   * This should be called periodically (e.g., via a cron job)
   */
  static async cleanupExpiredOtpCodes() {
    try {
      const result = await db.delete(otpCodes)
        .where(
          or(
            // Delete codes that have expired
            lt(otpCodes.expiresAt, new Date()),
            // Delete codes that are no longer valid
            eq(otpCodes.isValid, false)
          )
        );
      
      console.log(`Cleaned up expired OTP codes`);
      return { success: true, deletedCount: result.length || 0 };
    } catch (error) {
      console.error("Cleanup expired OTP codes error:", error);
      return { success: false, error: "An error occurred during cleanup" };
    }
  }

  /**
   * Automatically delete expired OTP codes when verifying
   * This ensures expired codes are cleaned up during normal operation
   */
  private static async cleanupExpiredCodes() {
    try {
      await db.delete(otpCodes)
        .where(lt(otpCodes.expiresAt, new Date()));
    } catch (error) {
      console.error("Auto cleanup error:", error);
      // Don't throw error, just log it
    }
  }
}
