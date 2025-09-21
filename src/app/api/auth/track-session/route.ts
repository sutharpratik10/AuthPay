import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionService } from '@/services/session';
import { getClientInfo } from '@/lib/client-info';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get additional data from request body (for OAuth tracking)
    const body = await request.json().catch(() => ({}));
    const { provider, skipIfExists = false } = body;

    // Get request information with improved IP detection
    const clientInfo = getClientInfo(request);
    
    // If this is an OAuth login, add provider info to user agent
    const userAgent = provider 
      ? `${provider} OAuth Login - ${clientInfo.userAgent}`
      : clientInfo.userAgent;
    
    console.log('Client info for session creation:', {
      userId: session.user.id,
      email: session.user.email,
      ipAddress: clientInfo.ipAddress,
      userAgent: userAgent,
      provider: provider,
      debug: clientInfo.debugInfo
    });

    // Check if session already exists for this user (to avoid duplicates)
    if (skipIfExists) {
      const existingSessions = await SessionService.getUserActiveSessions(session.user.id);
      if (existingSessions.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Session already exists',
          sessionCount: existingSessions.length
        });
      }
    }

    // Create or get session record
    const sessionRecord = await SessionService.createSession({
      userId: session.user.id,
      userAgent: userAgent,
      ipAddress: clientInfo.ipAddress,
    });

    // If the session is expired, delete it and return error
    if (new Date(sessionRecord.expiresAt) <= new Date()) {
      await SessionService.invalidateSessionById(sessionRecord.id);
      return NextResponse.json({
        success: false,
        message: 'Session has been expired. Please login again.'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: provider ? `OAuth session tracked for ${provider}` : 'Session created successfully',
      sessionId: sessionRecord.id,
      provider: provider
    });
  } catch (error) {
    console.error('Error creating session record:', error);
    return NextResponse.json(
      { error: 'Failed to create session record' },
      { status: 500 }
    );
  }
}
