import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (preferences.length === 0) {
      // Return default preferences if none exist
      return NextResponse.json({
        emailNotifications: true,
        securityAlerts: true,
        productUpdates: false,
        profileVisibility: true,
        language: 'en-US',
        timezone: 'UTC',
        theme: 'system'
      });
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailNotifications,
      securityAlerts,
      productUpdates,
      profileVisibility,
      language,
      timezone,
      theme,
      additionalSettings
    } = body;

    // Check if preferences already exist
    const existingPreferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (existingPreferences.length === 0) {
      // Create new preferences
      const newPreferences = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          emailNotifications,
          securityAlerts,
          productUpdates,
          profileVisibility,
          language,
          timezone,
          theme,
          additionalSettings,
          updatedAt: new Date()
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Preferences created successfully',
        preferences: newPreferences[0]
      });
    } else {
      // Update existing preferences
      const updatedPreferences = await db
        .update(userPreferences)
        .set({
          emailNotifications,
          securityAlerts,
          productUpdates,
          profileVisibility,
          language,
          timezone,
          theme,
          additionalSettings,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, session.user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences[0]
      });
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
