import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * POST /api/auth/check-suspension - Check if user is suspended
 * Rate Limited: 5 requests per 15 minutes (auth endpoint)
 */
export const POST = rateLimiters.auth(async (request: NextRequest) => {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists and is suspended
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: { 
        id: true, 
        email: true, 
        isSuspended: true,
        isActive: true
      }
    });

    if (!user) {
      // User doesn't exist - return not suspended so login can proceed to show proper error
      return NextResponse.json({ isSuspended: false });
    }

    return NextResponse.json({ 
      isSuspended: user.isSuspended || false,
      isActive: user.isActive !== false
    });

  } catch (error) {
    console.error('[API] Error checking suspension status:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
});
