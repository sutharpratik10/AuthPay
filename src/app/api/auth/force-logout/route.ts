import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 3 requests per hour (VERY STRICT - sensitive operation)
 */
export const POST = rateLimiters.sensitive(async (req: NextRequest) =>request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Delete all sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, userId));
    console.log(`[FORCE_LOGOUT] Cleared all sessions for user: ${userId}`);
    
    // Create response with cookie clearing headers
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear all possible auth-related cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'authjs.session-token',
      '__Secure-authjs.session-token'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
      // Set expired cookie to ensure clearing
      response.cookies.set(cookieName, '', { 
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });
    
    return response;

  } catch (error) {
    console.error('[FORCE_LOGOUT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
});