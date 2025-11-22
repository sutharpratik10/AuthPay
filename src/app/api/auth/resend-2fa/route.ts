import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/server/services/email';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/middleware/rate-limit';

interface TempTokenPayload {
  email: string;
  userId: string;
  type: string;
}

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) =>req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tempToken } = body;

    if (!email || !tempToken) {
      return NextResponse.json(
        { error: 'Email and temporary token are required' },
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

    // Generate new 2FA OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing 2FA OTP codes for this user
    await db.delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.type, "2fa_login")
        )
      );

    // Store new OTP with 10-minute expiration
    await db.insert(otpCodes).values({
      userId: user.id,
      code: newOtp,
      type: "2fa_login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isValid: true,
      createdAt: new Date(),
    });

    // Send OTP via email
    try {
      await emailService.send2FACode(user.email, newOtp, user.name || '');
    } catch (emailError) {
      console.error('Failed to send 2FA email:', emailError);
      // Continue anyway - OTP is stored in database
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email'
    });

  } catch (error) {
    console.error('2FA resend error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resending code' },
      { status: 500 }
    );
  }
});
