import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
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
}
