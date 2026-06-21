import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, otpCodes } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '@/server/services/email';
import crypto from 'crypto';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email(),
  type: z.enum(['magic_link', 'otp']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { email, type } = result.data;

    // 1. Find user or check third-party links
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Create user since they don't exist yet (Option A)
      const newUserId = crypto.randomUUID();
      await db.insert(users).values({
        id: newUserId,
        email,
        isEmailVerified: false,
        isActive: true,
      });

      user = await db.query.users.findFirst({
        where: eq(users.id, newUserId),
      });
    } else if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Account disabled' },
        { status: 403 }
      );
    }
    
    // NOTE: user.accounts will contain any third party accounts (Google, Github, etc) linked to this email. 
    // We are proceeding to send the passwordless link so the user can login to this existing account!

    // 2. Generate secure token/OTP
    let codeValue = '';
    let dbType = '';
    let sessionTokenValue: string | null = null;
    let urlTokenValue = '';

    if (type === 'magic_link') {
      sessionTokenValue = crypto.randomBytes(32).toString('hex');
      codeValue = crypto.randomBytes(4).toString('hex'); // Dummy 8 char code
      urlTokenValue = sessionTokenValue;
      dbType = 'magic_link';
    } else {
      // Generate 6-digit OTP
      codeValue = Math.floor(100000 + Math.random() * 900000).toString();
      urlTokenValue = codeValue;
      dbType = 'pwdless_otp';
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 3. Save to database
    await db.insert(otpCodes).values({
      userId: user!.id,
      code: codeValue,
      type: dbType,
      sessionToken: sessionTokenValue,
      expiresAt,
    });

    // 4. Send email
    if (type === 'magic_link') {
      await emailService.sendMagicLink(email, urlTokenValue);
    } else {
      await emailService.sendPasswordlessOTP(email, urlTokenValue);
    }

    return NextResponse.json({
      success: true,
      message: 'Login credentials sent successfully.',
    });
  } catch (error) {
    console.error('[Passwordless Send API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
