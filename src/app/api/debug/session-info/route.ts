import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionService } from '@/services/session';
import { LocationService } from '@/services/location';
import { emailService } from '@/services/email';
import { getClientInfo } from '@/lib/client-info';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    // Get user active sessions
    const sessions = await SessionService.getUserActiveSessions(session.user.id);

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      email: session.user.email,
      isAuthenticated: true,
      isEmailVerified: session.user.isEmailVerified,
      sessionCount: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        browserName: s.browserName,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching session info:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
