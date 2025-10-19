import { NextRequest, NextResponse } from 'next/server';
import { withSessionValidation } from '@/lib/auth/session-validation';
import { SessionService } from '@/server/services/session';

// Example: Get user's active sessions
export async function GET(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        const activeSessions = await SessionService.getUserActiveSessions(sessionData.userId!);
        
        return NextResponse.json({
          success: true,
          data: {
            sessions: activeSessions.map(session => ({
              id: session.id,
              browserName: session.browserName,
              ipAddress: session.ipAddress,
              lastActiveAt: session.lastActiveAt,
              createdAt: session.createdAt,
              expiresAt: session.expiresAt,
              isCurrent: sessionData.sessionDetails?.sessionId === session.id,
            })),
            currentSession: sessionData.sessionDetails,
          },
        });
      } catch (error) {
        console.error('Error fetching user sessions:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch sessions' },
          { status: 500 }
        );
      }
    },
    {
      extendSession: true,
      requireVerifiedEmail: true,
      requireActiveUser: true,
    }
  );
}

// Example: Invalidate a specific session
export async function DELETE(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'Session ID is required' },
            { status: 400 }
          );
        }

        // Get the session to verify it belongs to the user
        const sessionDetails = await SessionService.getSessionDetails(sessionId);
        
        if (!sessionDetails || sessionDetails.userId !== sessionData.userId) {
          return NextResponse.json(
            { success: false, error: 'Session not found or unauthorized' },
            { status: 404 }
          );
        }

        await SessionService.invalidateSessionById(sessionDetails.id);
        
        return NextResponse.json({
          success: true,
          message: 'Session invalidated successfully',
        });
      } catch (error) {
        console.error('Error invalidating session:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to invalidate session' },
          { status: 500 }
        );
      }
    }
  );
}

// Example: Invalidate all other sessions (logout from other devices)
export async function POST(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        const body = await request.json();
        const { action } = body;
        
        if (action === 'logout_all_other_devices') {
          // Get all user sessions
          const allSessions = await SessionService.getUserActiveSessions(sessionData.userId!);
          
          // Invalidate all sessions except current one
          const currentSessionId = sessionData.sessionDetails?.sessionId;
          const sessionsToInvalidate = allSessions.filter(
            session => session.id !== currentSessionId
          );
          
          for (const session of sessionsToInvalidate) {
            await SessionService.invalidateSessionById(session.id);
          }
          
          return NextResponse.json({
            success: true,
            message: `Logged out from ${sessionsToInvalidate.length} other devices`,
            invalidatedCount: sessionsToInvalidate.length,
          });
        }
        
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      } catch (error) {
        console.error('Error processing session action:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to process action' },
          { status: 500 }
        );
      }
    }
  );
}
