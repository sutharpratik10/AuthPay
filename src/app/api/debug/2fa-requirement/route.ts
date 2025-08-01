import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has 2FA enabled
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
      columns: { twoFactorAuth: true }
    });

    const has2FA = preferences?.twoFactorAuth === true;

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      has2FA,
      requires2FA: has2FA,
      message: has2FA ? '2FA is enabled for this user' : '2FA is not enabled for this user'
    });

  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
