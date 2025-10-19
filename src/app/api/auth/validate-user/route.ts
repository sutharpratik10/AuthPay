import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import { users, sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ exists: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = await request.json();
    
    // Validate that the requesting user can only check their own existence
    if (session.user.id !== userId) {
      return NextResponse.json({ exists: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user exists in database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        id: true, 
        email: true, 
        isEmailVerified: true,
        isActive: true // Add this if you have user status field
      }
    });

    if (!user) {
      console.log(`[API] User ${userId} not found in database - cleaning up sessions`);
      
      // Clean up any sessions for this non-existent user
      await db.delete(sessions).where(eq(sessions.userId, userId));
      
      // Create response with cookie clearing headers
      const response = NextResponse.json({ exists: false, shouldSignOut: true });
      
      // Clear auth cookies
      const cookiesToClear = [
        'next-auth.session-token',
        'session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token'
      ];

      cookiesToClear.forEach(cookieName => {
        response.cookies.delete(cookieName);
        response.cookies.set(cookieName, '', { 
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      });
      
      return response;
    }

    // Check if user is active (if you have this field)
    if ('isActive' in user && !user.isActive) {
      console.log(`[API] User ${userId} is deactivated`);
      return NextResponse.json({ exists: false, shouldSignOut: true });
    }

    return NextResponse.json({ 
      exists: true, 
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('[API] Error validating user:', error);
    return NextResponse.json(
      { exists: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}