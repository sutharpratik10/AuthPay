import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// Fixed variable name issue in debugging logs.
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await db
      .select({
        id: userPreferences.id,
        userId: userPreferences.userId,
        emailNotifications: userPreferences.emailNotifications,
        securityAlerts: userPreferences.securityAlerts,
        productUpdates: userPreferences.productUpdates,
        profileVisibility: userPreferences.profileVisibility,
        createdAt: userPreferences.createdAt,
        updatedAt: userPreferences.updatedAt,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);    if (preferences.length === 0) {
      // Create default preferences for the user
      const defaultPreferences = {
        userId: session.user.id,
        emailNotifications: true,
        securityAlerts: true,
        productUpdates: false,
        profileVisibility: true,
        updatedAt: new Date().toISOString()
      };

      const newPreferences = await db
        .insert(userPreferences)
        .values(defaultPreferences)
        .returning({
          id: userPreferences.id,
          userId: userPreferences.userId,
          emailNotifications: userPreferences.emailNotifications,
          securityAlerts: userPreferences.securityAlerts,
          productUpdates: userPreferences.productUpdates,
          profileVisibility: userPreferences.profileVisibility,
          createdAt: userPreferences.createdAt,
          updatedAt: userPreferences.updatedAt,
        });

      return NextResponse.json(newPreferences[0]);
    }

    return NextResponse.json(preferences[0]);  } catch {
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    const body = await request.json();
    const {
      emailNotifications,
      securityAlerts,
      productUpdates,
      profileVisibility,
      additionalSettings,
      twoFactorAuth
    } = body;

    // Check if preferences already exist
    const existingPreferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);    if (existingPreferences.length === 0) {      // Create new preferences
      const newPreferences = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          emailNotifications,
          securityAlerts,
          productUpdates,
          profileVisibility,
          additionalSettings,
          twoFactorAuth,
          updatedAt: new Date().toISOString()
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Preferences created successfully',
        preferences: newPreferences[0]
      });    } else {      // Update existing preferences
      const updatedPreferences = await db
        .update(userPreferences)
        .set({
          emailNotifications,
          securityAlerts,
          productUpdates,
          additionalSettings,
          twoFactorAuth,
          updatedAt: new Date().toISOString()
        })
        .where(eq(userPreferences.userId, session.user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences[0]
      });
    }  } catch {
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
