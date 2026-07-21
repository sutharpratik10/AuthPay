import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { sanitizeEmail, normalizeEmail, hasSQLInjectionPatterns } from '@/lib/utils/sanitize';
import { logSecurityEvent } from '@/lib/utils/validation-middleware';

/**
 * POST /api/auth/check-suspension - Check if user is suspended
 * Rate Limited: 30 requests per minute (validation endpoint)
 */
export const POST = rateLimiters.validation(async (request: NextRequest) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email)) {
      logSecurityEvent('sql_injection_attempt', { field: 'email', ip: request.headers.get('x-forwarded-for') });
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

    // Check if user exists and is suspended
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
      columns: {
        id: true,
        email: true,
        isSuspended: true,
        isActive: true
      }
    });

    if (!user) {
      // User doesn't exist - return not suspended so login can proceed to show proper error
      return NextResponse.json({ isSuspended: false });
    }

    return NextResponse.json({ 
      isSuspended: user.isSuspended || false,
      isActive: user.isActive !== false
    });

  } catch (error) {
    console.error('[API] Error checking suspension status:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
});
