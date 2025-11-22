import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * POST /api/auth/validate-credentials - Validate user credentials
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both your email and password.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: (usersTable) => eq(usersTable.email, email.toLowerCase()),
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // Check password
    if (!user.password) {
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
    }

    // Check if 2FA is enabled
    const has2FA = user.userPreferences?.twoFactorAuth === true;
    
    if (has2FA) {
      return NextResponse.json(
        { 
          success: true,
          requires2FA: true,
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
