import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, twoFactorAuth, recoveryCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { auth } from '@/config/auth';

/**
 * GET /api/auth/check-2fa-status - Check authenticated user's 2FA status
 * Used by the AccountPage to show current 2FA method and recovery code count
 */
export const GET = rateLimiters.api(async (): Promise<Response> => {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ totpEnabled: false });
    }

    const userId = session.user.id;

    // Check TOTP record
    const totpRecord = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    // Count remaining recovery codes
    const unusedCodes = await db.query.recoveryCodes.findMany({
      where: and(
        eq(recoveryCodes.userId, userId),
        eq(recoveryCodes.isUsed, false)
      ),
    });

    const isAppEnabled = !!totpRecord?.enabled && totpRecord.method === 'app';

    // Get user preferences for email 2FA
    const userPrefs = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { userPreferences: true }
    });

    const isEmailEnabled = !!userPrefs?.userPreferences?.twoFactorAuth;

    return NextResponse.json({
      totpEnabled: isAppEnabled,
      email2faEnabled: isEmailEnabled,
      recoveryCodesRemaining: unusedCodes.length,
    });

  } catch (error) {
    console.error('2FA status check error:', error);
    return NextResponse.json({ totpEnabled: false, email2faEnabled: false });
  }
});

/**
 * POST /api/auth/check-2fa-status - Check 2FA status by email (login flow)
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user and check 2FA status
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      with: {
        userPreferences: true
      }
    });

    if (!user) {
      // Don't reveal whether the user exists or not for security
      return NextResponse.json({ has2FA: false });
    }

    const has2FA = user.userPreferences?.twoFactorAuth === true;

    return NextResponse.json({ 
      has2FA,
      email: user.email 
    });

  } catch (error) {
    console.error('2FA status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

