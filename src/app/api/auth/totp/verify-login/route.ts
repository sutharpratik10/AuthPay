import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, twoFactorAuth, recoveryCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { sanitizeEmail, hasSQLInjectionPatterns } from '@/lib/utils/sanitize';
import { logSecurityEvent } from '@/lib/utils/validation-middleware';
import { TOTPService } from '@/server/services/totp';
import { TOTPLoginVerifySchema } from '@/lib/validations/auth';

interface TempTokenPayload {
  email: string;
  userId?: string;
  timestamp: number;
  // Legacy: password may still be present in old tokens
  password?: string;
}

/**
 * POST /api/auth/totp/verify-login — Verify TOTP code during login
 * 
 * After the user enters their credentials and is redirected to the 2FA page,
 * this endpoint verifies the TOTP code (or recovery code) from their
 * authenticator app.
 * 
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  try {
    const body = await req.json();

    // Validate input with Zod
    const validation = TOTPLoginVerifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, token, tempToken, isRecoveryCode } = validation.data;

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email)) {
      logSecurityEvent('sql_injection_attempt', {
        field: 'email',
        ip: req.headers.get('x-forwarded-for'),
      });
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

    // Verify temporary token
    let decodedToken: TempTokenPayload;
    try {
      decodedToken = jwt.verify(
        tempToken,
        process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret'
      ) as TempTokenPayload;
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

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch TOTP record
    const totpRecord = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, user.id),
    });

    if (!totpRecord || !totpRecord.enabled || !totpRecord.secret) {
      return NextResponse.json(
        { error: 'TOTP is not enabled for this account' },
        { status: 400 }
      );
    }

    if (isRecoveryCode) {
      // ===== Recovery Code Flow =====
      const userRecoveryCodes = await db.query.recoveryCodes.findMany({
        where: and(
          eq(recoveryCodes.userId, user.id),
          eq(recoveryCodes.isUsed, false)
        ),
      });

      if (userRecoveryCodes.length === 0) {
        return NextResponse.json(
          { error: 'No unused recovery codes remaining. Contact support for assistance.' },
          { status: 400 }
        );
      }

      // Try each unused code
      let matchedCodeId: string | null = null;
      for (const codeRecord of userRecoveryCodes) {
        const isMatch = await TOTPService.verifyRecoveryCode(token, codeRecord.code);
        if (isMatch) {
          matchedCodeId = codeRecord.id;
          break;
        }
      }

      if (!matchedCodeId) {
        return NextResponse.json(
          { error: 'Invalid recovery code. Please check and try again.' },
          { status: 400 }
        );
      }

      // Mark the code as used
      await db
        .update(recoveryCodes)
        .set({
          isUsed: true,
          usedAt: new Date(),
        })
        .where(eq(recoveryCodes.id, matchedCodeId));

      // Count remaining codes
      const remainingCodes = userRecoveryCodes.length - 1;

      return NextResponse.json({
        success: true,
        message: 'Recovery code verified successfully',
        credentials: {
          email: user.email,
          password: '2fa-verified',
          skipPasswordCheck: 'true',
        },
        warning: remainingCodes <= 2
          ? `You have ${remainingCodes} recovery code${remainingCodes !== 1 ? 's' : ''} remaining. Please generate new codes in your account settings.`
          : undefined,
      });
    } else {
      // ===== TOTP Code Flow =====
      let plainSecret: string;
      try {
        plainSecret = TOTPService.decryptSecret(totpRecord.secret);
      } catch {
        console.error('[TOTP Verify Login] Failed to decrypt secret for user:', user.id);
        return NextResponse.json(
          { error: 'Authentication error. Please try again.' },
          { status: 500 }
        );
      }

      const isValid = TOTPService.verifyToken(plainSecret, token);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please check your authenticator app.' },
          { status: 400 }
        );
      }

      // Update last verified timestamp
      await db
        .update(twoFactorAuth)
        .set({ lastVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(twoFactorAuth.userId, user.id));

      return NextResponse.json({
        success: true,
        message: 'Two-factor authentication verified successfully',
        credentials: {
          email: user.email,
          password: '2fa-verified',
          skipPasswordCheck: 'true',
        },
      });
    }
  } catch (error) {
    console.error('[TOTP Verify Login] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification' },
      { status: 500 }
    );
  }
});
