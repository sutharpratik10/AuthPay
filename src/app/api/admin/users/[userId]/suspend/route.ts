import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

async function updateSuspension(req: NextRequest) {
  try {
    // Extract userId from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // Get userId from path (suspend is the last segment)
    
    const { isSuspended } = await req.json();
    
    if (typeof isSuspended !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isSuspended must be boolean' }, { status: 400 });
    }
    
    // Check if user exists first
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true }
    });
    
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    await db.update(users)
      .set({ isSuspended })
      .where(eq(users.id, userId));
    
    return NextResponse.json({ success: true, message: 'User suspension status updated' });
  } catch (error) {
    console.error('Update suspension error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update suspension' }, { status: 500 });
  }
}

// Export with admin-only policy
export const PUT = withPolicy(updateSuspension, API_POLICIES.USER_MANAGE);
