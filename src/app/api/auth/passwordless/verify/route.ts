import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes } from '@/server/db/schema';
import { eq, and, gt, or } from 'drizzle-orm';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(6), // Can be 6-digit OTP or 64-char magic link token
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid verification data' },
        { status: 400 }
      );
    }

    const { email, token } = result.data;

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Account disabled' },
        { status: 403 }
      );
    }

    // Verify token
    const validCode = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.userId, user.id),
        or(
          eq(otpCodes.code, token),
          eq(otpCodes.sessionToken, token)
        ),
        gt(otpCodes.expiresAt, new Date()), // Not expired
        eq(otpCodes.isValid, true)
      ),
      orderBy: (otpCodes, { desc }) => [desc(otpCodes.createdAt)],
    });

    if (!validCode) {
      // It's either invalid, expired, or doesn't belong to this user
      return NextResponse.json(
        { error: 'Invalid or expired login code/link' },
        { status: 400 }
      );
    }

    // Delete the code so it can't be used again
    await db.delete(otpCodes).where(eq(otpCodes.id, validCode.id));

    // Mark email as verified if it wasn't
    if (!user.isEmailVerified) {
      await db.update(users)
        .set({
          isEmailVerified: true,
          emailVerified: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
    } else {
      await db.update(users)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(users.id, user.id));
    }

    // Return success with credentials to sign in
    return NextResponse.json({
      success: true,
      message: 'Login verified successfully',
      credentials: {
        email: user.email,
        password: 'passwordless', // Dummy value, will be skipped by skipPasswordCheck
        skipPasswordCheck: 'true'
      },
    });
  } catch (error) {
    console.error('[Passwordless Verify API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
