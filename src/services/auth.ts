import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { emailService } from "./email";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { eq, and } from "drizzle-orm";

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
      
      // Store verification code
      await db.insert(otpCodes).values({
        userId: newUser.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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
   */
  static async verifyEmail(code: string) {
    try {
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
      
      // Invalidate the OTP
      await db.update(otpCodes)
        .set({ 
          isValid: false,
          usedAt: new Date()
        })
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
        // Invalidate old codes
      await db.update(otpCodes)
        .set({ isValid: false })
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "email_verification"),
            eq(otpCodes.isValid, true)
          )
        );
      
      // Store new verification code
      await db.insert(otpCodes).values({
        userId: user.id,
        code: verificationCode,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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
}
