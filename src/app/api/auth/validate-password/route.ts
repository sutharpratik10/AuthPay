import { AuthService } from '@/server/services/auth';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Validate password reset code route
 * This endpoint validates a password reset OTP code without resetting the password
 */
/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const result = await AuthService.verifyPasswordResetCode(code);

    if (!result.success) {
      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Invalid or expired code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully',
      userId: result.userId,
      email: result.email
    });
  } catch (error) {
    console.error('Password validation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
});