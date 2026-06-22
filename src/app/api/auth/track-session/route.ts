import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { SessionService } from '@/server/services/session';
import { getClientInfo } from '@/lib/utils/client-info';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (request: NextRequest) => {
  try {
    const requestStart = Date.now();
    console.log('[track-session] Starting request');
    
    const authStart = Date.now();
    const session = await auth();
    console.log(`[track-session] Auth check took ${Date.now() - authStart}ms`);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get additional data from request body (for OAuth tracking)
    const bodyStart = Date.now();
    const body = await request.json().catch(() => ({}));
    const { provider, skipIfExists = false } = body;
    console.log(`[track-session] Body parse took ${Date.now() - bodyStart}ms`);

    // Get request information with improved IP detection
    const clientInfoStart = Date.now();
    const clientInfo = getClientInfo(request);
    console.log(`[track-session] Client info took ${Date.now() - clientInfoStart}ms`);
    
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
      const checkStart = Date.now();
      const existingSessions = await SessionService.getUserActiveSessions(session.user.id);
      console.log(`[track-session] Session check took ${Date.now() - checkStart}ms, found ${existingSessions.length} sessions`);
      if (existingSessions.length > 0) {
        console.log(`[track-session] Total request time: ${Date.now() - requestStart}ms`);
        return NextResponse.json({
          success: true,
          message: 'Session already exists',
          sessionCount: existingSessions.length
        });
      }
    }

    // Create or get session record
    const createStart = Date.now();
    const sessionRecord = await SessionService.createSession({
      userId: session.user.id,
      userAgent: userAgent,
      ipAddress: clientInfo.ipAddress,
    });
    console.log(`[track-session] Session creation took ${Date.now() - createStart}ms`);

    console.log(`[track-session] Session creation took ${Date.now() - createStart}ms`);

    // If the session is expired, delete it and return error
    if (new Date(sessionRecord.expiresAt) <= new Date()) {
      await SessionService.invalidateSessionById(sessionRecord.id);
      return NextResponse.json({
        success: false,
        message: 'Session has been expired. Please login again.'
      }, { status: 401 });
    }

    console.log(`[track-session] Total request time: ${Date.now() - requestStart}ms`);
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
});
