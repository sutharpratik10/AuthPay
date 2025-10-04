import { AuthService } from '@/server/services/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SECURE PASSWORD RESET: Step 3 - Reset password with verified token
 * This endpoint now ONLY handles password reset, not code verification
 * Code verification is handled by /api/auth/verify-reset-code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate JSON body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { verifiedToken, newPassword } = body;
    
    // SECURITY: Require verified token instead of raw code
    // This ensures the user went through the verification step
    if (!verifiedToken || typeof verifiedToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid session. Please verify your code first.' },
        { status: 400 }
      );
    }
    
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    console.log('[Reset Password] Processing password reset with verified token')

    // Call service method with verified token
    const result = await AuthService.resetPasswordWithVerifiedToken(verifiedToken, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Failed to reset password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'message' in result ? result.message : 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    
    // Handle different types of errors more gracefully
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}
