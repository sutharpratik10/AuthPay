import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { users, otpCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 3 requests per hour (VERY STRICT - sensitive operation)
 */
export const POST = rateLimiters.sensitive(async (req: NextRequest) =>req: NextRequest) {
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
    const { newPassword, otp } = body;

    // Validate input - we no longer need currentPassword since it was verified in verify-password
    if (!newPassword || !otp) {
      return NextResponse.json(
        { error: 'New password and OTP are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify OTP from database
    const otpRecord = await db.query.otpCodes.findFirst({
      where: (otpCodes, { eq, and }) => 
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.code, otp),
          eq(otpCodes.type, "password_change"),
          eq(otpCodes.isValid, true)
        ),
      with: {
        user: true,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      // Delete expired OTP
      await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get user from database to check current password
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { id: true, email: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or no password set' },
        { status: 404 }
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db
      .update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, user.id));

    // Delete the used OTP
    await db.delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.type, "password_change")
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while changing password' },
      { status: 500 }
    );
  }
});