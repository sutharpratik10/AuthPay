import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { rateLimiters } from '@/lib/middleware/rate-limit'
import { sanitizeEmail, hasSQLInjectionPatterns } from '@/lib/utils/sanitize'
import { logSecurityEvent } from '@/lib/utils/validation-middleware'

/**
 * POST /api/auth/check-email - Check if email exists
 * Rate Limited: 30 requests per minute (validation endpoint)
 */
export const POST = rateLimiters.validation(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { email } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Security: Check for injection patterns
    if (hasSQLInjectionPatterns(email)) {
      logSecurityEvent('sql_injection_attempt', { field: 'email', ip: req.headers.get('x-forwarded-for') });
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Sanitize and validate email format
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email exists in database (using sanitized email)
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, sanitizedEmail),
      columns: { id: true, email: true }
    })
    const emailExists = !!existingUser

    return NextResponse.json({
      success: true,
      emailExists,
      message: emailExists 
        ? 'Email is already registered, kindly SignIn' 
        : 'Email is available'
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
});
