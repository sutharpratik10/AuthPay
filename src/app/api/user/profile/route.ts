import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login again' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
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
