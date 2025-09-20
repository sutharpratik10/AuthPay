import { AuthService } from '@/services/auth';
import { NextRequest, NextResponse } from 'next/server';

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
    
    // If only code is provided, verify the code
    if (body.code && !body.newPassword) {
      if (!body.code || typeof body.code !== 'string') {
        return NextResponse.json(
          { error: 'Verification code is required and must be a string' },
          { status: 400 }
        );
      }

      const result = await AuthService.verifyPasswordResetCode(body.code);

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
    }
    
    // If both code and newPassword are provided, reset the password
    if (body.code && body.newPassword) {
      if (!body.code || !body.newPassword || 
          typeof body.code !== 'string' || typeof body.newPassword !== 'string') {
        return NextResponse.json(
          { error: 'Code and new password are required and must be strings' },
          { status: 400 }
        );
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      const result = await AuthService.resetPassword(body.code, body.newPassword);

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
    }
    
    // Invalid request - neither scenario matches
    return NextResponse.json(
      { error: 'Invalid request. Provide either code for verification or both code and newPassword for reset.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    
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
