import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes, twoFactorAuth } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { sanitizeEmail, sanitizeOTPCode, hasSQLInjectionPatterns } from '@/lib/utils/sanitize';
import { logSecurityEvent } from '@/lib/utils/validation-middleware';

interface TempTokenPayload {
  email: string;
  userId: string;
  password: string;
  type: string;
}

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  try {
    const body = await req.json();
    const { email, otp, tempToken } = body;

    if (!email || !otp || !tempToken) {
      return NextResponse.json(
        { error: 'Email, OTP, and temporary token are required' },
        { status: 400 }
      );
    }

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email) || hasSQLInjectionPatterns(otp)) {
      logSecurityEvent('sql_injection_attempt', { field: 'email/otp', ip: req.headers.get('x-forwarded-for') });
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize OTP (must be 6 digits)
    const sanitizedOtp = sanitizeOTPCode(otp);
    if (!sanitizedOtp) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Verify temporary token
    let decodedToken: TempTokenPayload;
    try {
      decodedToken = jwt.verify(tempToken, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret') as TempTokenPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please login again.' },
        { status: 401 }
      );
    }

    if (decodedToken.email !== sanitizedEmail) {
      return NextResponse.json(
        { error: 'Token email mismatch' },
        { status: 401 }
      );
    }

    // Find user (using sanitized email)
    const user = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail)
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify OTP (using sanitized OTP)
    const otpRecord = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.code, sanitizedOtp),
        eq(otpCodes.type, "2fa_login"),
        eq(otpCodes.isValid, true)
      )
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      // Clean up expired OTP
      await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }    // OTP is valid - complete the login process
    // Delete the used OTP
    await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));

    // Check if App 2FA is ALSO enabled
    const totpRecord = await db.query.twoFactorAuth.findFirst({
      where: (table) => eq(table.userId, user.id),
    });

    const hasApp2FA = totpRecord?.enabled && totpRecord.method === 'app';

    if (hasApp2FA) {
      return NextResponse.json({
        success: true,
        requiresApp2FA: true,
        message: 'Email verified. Authenticator app code required.',
      });
    }

    // Return success with the credentials needed for client-side signIn
    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication verified successfully',
      credentials: {
        email: user.email,
        password: '2fa-verified', // Dummy value, will be skipped by skipPasswordCheck
        skipPasswordCheck: 'true' // Custom flag to skip password verification since we already verified it
      }
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification' },
      { status: 500 }
    );
  }
});
