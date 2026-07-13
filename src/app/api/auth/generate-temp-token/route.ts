import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes, twoFactorAuth } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/server/services/email';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { sanitizeEmail, normalizeEmail, hasSQLInjectionPatterns } from '@/lib/utils/sanitize';
import { logSecurityEvent } from '@/lib/utils/validation-middleware';

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  try {
    const body = await req.json();
    const { email, password, method } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email)) {
      logSecurityEvent('sql_injection_attempt', { field: 'email', ip: req.headers.get('x-forwarded-for') });
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // Sanitize and normalize email to match the stored address
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    const normalizedEmail = normalizeEmail(sanitizedEmail);

    // Verify user credentials
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
      with: {
        userPreferences: true
      }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }    // Check if user has 2FA enabled
    const hasEmail2FA = user.userPreferences?.twoFactorAuth === true;
    const totpRecord = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, user.id),
    });
    const hasApp2FA = totpRecord?.enabled && totpRecord.method === 'app';

    if (!hasEmail2FA && !hasApp2FA) {
      return NextResponse.json(
        { error: '2FA is not enabled for this user' },
        { status: 400 }
      );
    }

    // For TOTP (app) ONLY method, skip OTP generation and email — just create the temp token
    if (method !== 'app') {
      // Generate 2FA OTP for email method
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete any existing 2FA OTP codes for this user
      await db.delete(otpCodes)
        .where(
          and(
            eq(otpCodes.userId, user.id),
            eq(otpCodes.type, "2fa_login")
          )
        );

      // Store OTP with 10-minute expiration
      await db.insert(otpCodes).values({
        userId: user.id,
        code: otp,
        type: "2fa_login",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        isValid: true,
        createdAt: new Date(),
      });

      // Send OTP via email
      try {
        await emailService.send2FACode(user.email, otp, user.name || '');
      } catch (emailError) {
        console.error('Failed to send 2FA email:', emailError);
        // Continue anyway - OTP is stored in database
      }
    }

    // Generate temporary token (expires in 15 minutes)
    // Security: Do NOT include password in the token payload
    const tempToken = jwt.sign(
      { 
        email: user.email,
        userId: user.id,
        timestamp: Date.now() 
      },
      process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret',
      { expiresIn: '15m' }
    );

    return NextResponse.json({
      success: true,
      tempToken,
      message: method === 'app' 
        ? 'Enter the code from your authenticator app' 
        : '2FA code sent to your email address'
    });

  } catch (error) {
    console.error('Temp token generation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
});
