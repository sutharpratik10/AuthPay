import { NextRequest, NextResponse } from 'next/server';
import { withSessionValidation } from '@/lib/auth/session-validation';
import { SessionService } from '@/server/services/session';
import { db } from '@/server/db';
import { users, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { roleId: true }
    });
    
    if (!user?.roleId) return false;
    
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, user.roleId),
      columns: { name: true }
    });
    
    return role?.name === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get session statistics (admin only)
export async function GET(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        // Check if user is admin
        const isAdmin = await isUserAdmin(sessionData.userId!);
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
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
}

// Manual session cleanup (admin only)
export async function POST(request: NextRequest) {
  return withSessionValidation(
    request,
    async (req, sessionData) => {
      try {
        // Check if user is admin
        const isAdmin = await isUserAdmin(sessionData.userId!);
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
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
}
