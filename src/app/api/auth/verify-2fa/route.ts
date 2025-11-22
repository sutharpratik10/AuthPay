import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/middleware/rate-limit';

interface TempTokenPayload {
  email: string;
  userId: string;
  password: string;
  type: string;
}

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) =>req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, tempToken } = body;

    if (!email || !otp || !tempToken) {
      return NextResponse.json(
        { error: 'Email, OTP, and temporary token are required' },
        { status: 400 }
      );
    }    // Verify temporary token
    let decodedToken: TempTokenPayload;
    try {
      decodedToken = jwt.verify(tempToken, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret') as TempTokenPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please login again.' },
        { status: 401 }
      );
    }

    if (decodedToken.email !== email) {
      return NextResponse.json(
        { error: 'Token email mismatch' },
        { status: 401 }
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify OTP
    const otpRecord = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.code, otp),
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

    // Return success with the credentials needed for client-side signIn
    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication verified successfully',
      credentials: {
        email: user.email,
        password: decodedToken.password, // Password was verified during initial login
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
