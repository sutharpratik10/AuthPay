import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { users, sessions, otpCodes, userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '@/server/services/email';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 3 requests per hour (VERY STRICT - sensitive operation)
 */
export const DELETE = rateLimiters.sensitive(async (req: NextRequest): Promise<Response> => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login again' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { confirmationText } = body;

    // Validate confirmation text
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion' },
        { status: 400 }
      );
    }

    // Get user details before deletion for email
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { 
        id: true, 
        email: true, 
        name: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Start transaction to delete all user data
    await db.transaction(async (tx) => {
      // Delete user preferences
      await tx.delete(userPreferences).where(eq(userPreferences.userId, userId));
      
      // Delete all OTP codes
      await tx.delete(otpCodes).where(eq(otpCodes.userId, userId));
      
      // Delete all sessions
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      
      // Finally delete the user account
      await tx.delete(users).where(eq(users.id, userId));
    });

    // Send account deletion confirmation email
    try {
      await emailService.sendAccountDeletionEmail(
        user.email, 
        user.name || 'User'
      );
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError);
      // Don't fail the request if email fails, as account is already deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting account' },
      { status: 500 }
    );
  }
});
