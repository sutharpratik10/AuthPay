import { NextRequest, NextResponse } from 'next/server';
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function updateProfile(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Validate session and user ID
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (name.trim().length < 1) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name cannot be longer than 100 characters' },
        { status: 400 }
      );
    }

    // Update user name in database
    await db
      .update(users)
      .set({ 
        name: name.trim(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId));

    // Fetch updated user data to return
    const updatedUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { 
        id: true, 
        email: true, 
        name: true, 
        isEmailVerified: true 
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating profile' },
      { status: 500 }
    );
  }
}

// Export the route handler wrapped with permission checking
export const PUT = withPermission(updateProfile, API_PERMISSIONS.PROFILE_EDIT);
