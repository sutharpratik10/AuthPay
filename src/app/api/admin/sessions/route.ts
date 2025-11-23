import { NextRequest, NextResponse } from 'next/server';
import { withSessionValidation } from '@/lib/auth/session-validation';
import { SessionService } from '@/server/services/session';
import { RBACService } from '@/lib/rbac/rbac-service';
import { rateLimiters } from '@/lib/middleware/rate-limit';

// Get session statistics (admin only - uses policy-based check)
/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (request: NextRequest) => {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        // Use policy-based RBAC check
        const hasAccess = await RBACService.hasPolicy(sessionData.userId!, 'admin:access');
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions - admin:access policy required' },
            { status: 403 }
          );
        }

        const statistics = await SessionService.getSessionStatistics();
        
        return NextResponse.json({
          success: true,
          data: statistics,
        });
      } catch (error) {
        console.error('Error fetching session statistics:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch statistics' },
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
});

// Manual session cleanup (admin only - uses policy-based check)
export const POST = rateLimiters.api(async (request: NextRequest) => {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        // Use policy-based RBAC check
        const hasAccess = await RBACService.hasPolicy(sessionData.userId!, 'admin:access');
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions - admin:access policy required' },
            { status: 403 }
          );
        }

        const body = await request.json();
        const { action, inactiveHours } = body;
        
        if (action === 'cleanup_expired') {
          const cleanupResult = await SessionService.cleanupExpiredSessions();
          
          return NextResponse.json({
            success: true,
            message: 'Expired sessions cleaned up',
            data: cleanupResult,
          });
        }
        
        if (action === 'cleanup_inactive') {
          const hours = inactiveHours || 72; // Default 72 hours
          const inactiveCount = await SessionService.cleanupInactiveSessions(hours);
          
          return NextResponse.json({
            success: true,
            message: `Cleaned up ${inactiveCount} inactive sessions`,
            data: { inactiveSessionsCount: inactiveCount },
          });
        }
        
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      } catch (error) {
        console.error('Error performing session cleanup:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to cleanup sessions' },
          { status: 500 }
        );
      }
    }
  );
});
