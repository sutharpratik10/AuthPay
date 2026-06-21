import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/server/db";
import { users, twoFactorAuth } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { sanitizeEmail, hasSQLInjectionPatterns } from '@/lib/utils/sanitize';
import { logSecurityEvent } from '@/lib/utils/validation-middleware';

/**
 * POST /api/auth/validate-credentials - Validate user credentials
 * Rate Limited: 30 requests per minute (validation tier - allows reasonable typing attempts)
 */
export const POST = rateLimiters.validation(async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both your email and password.' },
        { status: 400 }
      );
    }

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email)) {
      logSecurityEvent('sql_injection_attempt', { field: 'email', ip: request.headers.get('x-forwarded-for') });
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Note: We don't validate password format on login - users should be able to 
    // log in with any password they created, even if it doesn't meet current requirements

    // Find user by email (using sanitized email)
    const user = await db.query.users.findFirst({
      where: (usersTable) => eq(usersTable.email, sanitizedEmail),
      with: {
        userPreferences: true
      }
    });

    // User doesn't exist
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if account is disabled/suspended
    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'Account disabled' },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' },
        { status: 403 }
      );
    }

    // Note: We allow unverified users to log in
    // They will see a verification banner on their dashboard

    // Check password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil: string | null = null;
      
      if (failedAttempts >= 5) {
        // Lock for 15 minutes
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        console.log(`[SECURITY] Account locked for user: ${sanitizedEmail}`);
      }

      await db.update(users)
        .set({
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockedUntil
        })
        .where(eq(users.id, user.id));

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset failed login attempts on successful password match
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await db.update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null
        })
        .where(eq(users.id, user.id));
    }

    // Check if 2FA is enabled
    const hasEmail2FA = user.userPreferences?.twoFactorAuth === true;
    
    // Check if App 2FA is enabled
    const totpRecord = await db.query.twoFactorAuth.findFirst({
      where: (table) => eq(table.userId, user.id),
    });
    
    const hasApp2FA = totpRecord?.enabled && totpRecord.method === 'app';

    if (hasEmail2FA || hasApp2FA) {
      let method: 'email' | 'app' | 'both' = 'email';
      
      if (hasEmail2FA && hasApp2FA) {
        method = 'both';
      } else if (hasApp2FA) {
        method = 'app';
      }
      
      return NextResponse.json(
        { 
          success: true,
          requires2FA: true,
          method,
          message: 'Two-factor authentication required'
        },
        { status: 200 }
      );
    }

    // All validations passed
    return NextResponse.json(
      { 
        success: true,
        requires2FA: false,
        message: 'Credentials valid'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Validate Credentials] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
});
