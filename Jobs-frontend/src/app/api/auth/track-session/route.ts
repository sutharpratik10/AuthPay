import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionService } from '@/services/session';
import { getClientInfo } from '@/lib/client-info';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    // Get request information with improved IP detection
    const clientInfo = getClientInfo(request);
    
    console.log('Client info for session creation:', {
      userId: session.user.id,
      email: session.user.email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      debug: clientInfo.debugInfo
    });

    // Create or get session record
    const sessionRecord = await SessionService.createSession({
      userId: session.user.id,
      userAgent: clientInfo.userAgent,
      ipAddress: clientInfo.ipAddress,
    });

    // If the session is expired, delete it and return error
    if (new Date(sessionRecord.expiresAt) <= new Date()) {
      await SessionService.invalidateSession(sessionRecord.token);
      return NextResponse.json({
        success: false,
        message: 'Session has been expired. Please login again.'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      sessionId: sessionRecord.id
    });
  } catch (error) {
    console.error('Error creating session record:', error);
    return NextResponse.json(
      { error: 'Failed to create session record' },
      { status: 500 }
    );
  }
}
