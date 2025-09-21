import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user and check 2FA status
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      with: {
        userPreferences: true
      }
    });

    if (!user) {
      // Don't reveal whether the user exists or not for security
      return NextResponse.json({ has2FA: false });
    }

    const has2FA = user.userPreferences?.twoFactorAuth === true;

    return NextResponse.json({ 
      has2FA,
      email: user.email 
    });

  } catch (error) {
    console.error('2FA status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
