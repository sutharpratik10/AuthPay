import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { userPreferences, languages, timezones } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    // Get user preferences with related language and timezone data
    const preferences = await db
      .select({
        id: userPreferences.id,
        userId: userPreferences.userId,
        emailNotifications: userPreferences.emailNotifications,
        securityAlerts: userPreferences.securityAlerts,
        productUpdates: userPreferences.productUpdates,
        profileVisibility: userPreferences.profileVisibility,
        languageId: userPreferences.languageId,
        timezoneId: userPreferences.timezoneId,
        theme: userPreferences.theme,
        additionalSettings: userPreferences.additionalSettings,
        twoFactorAuth: userPreferences.twoFactorAuth,
        createdAt: userPreferences.createdAt,
        updatedAt: userPreferences.updatedAt,
        language: {
          id: languages.id,
          name: languages.name,
          code: languages.code,
          nativeName: languages.nativeName
        },
        timezone: {
          id: timezones.id,
          name: timezones.name,
          code: timezones.code,
          utcOffset: timezones.utcOffset,
          description: timezones.description
        }
      })
      .from(userPreferences)
      .leftJoin(languages, eq(userPreferences.languageId, languages.id))
      .leftJoin(timezones, eq(userPreferences.timezoneId, timezones.id))
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);    if (preferences.length === 0) {
      // Cache default values to avoid repeated queries
      const [defaultLanguage, defaultTimezone] = await Promise.all([
        db.select().from(languages).where(eq(languages.code, 'en')).limit(1),
        db.select().from(timezones).where(eq(timezones.code, 'UTC')).limit(1)
      ]);      // Return default preferences if none exist
      const defaultPrefs = {
        emailNotifications: true,
        securityAlerts: true,
        productUpdates: false,
        profileVisibility: true,
        languageId: defaultLanguage[0]?.id || null,
        timezoneId: defaultTimezone[0]?.id || null,
        theme: 'system',
        twoFactorAuth: false,
        language: defaultLanguage[0] || { id: null, name: 'English', code: 'en', nativeName: 'English' },
        timezone: defaultTimezone[0] || { id: null, name: 'UTC', code: 'UTC', utcOffset: '+00:00', description: 'Coordinated Universal Time' }
      };

      return NextResponse.json(defaultPrefs, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
        }
      });
    }

    return NextResponse.json(preferences[0], {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
      }
    });
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
    }    const body = await request.json();
    const {
      emailNotifications,
      securityAlerts,
      productUpdates,
      profileVisibility,
      languageId,
      timezoneId,
      theme,
      additionalSettings,
      twoFactorAuth
    } = body;

    // Ensure languageId and timezoneId are valid UUIDs or null
    const validLanguageId = typeof languageId === 'string' && languageId.match(/^([0-9a-fA-F-]{36})$/) ? languageId : null;
    const validTimezoneId = typeof timezoneId === 'string' && timezoneId.match(/^([0-9a-fA-F-]{36})$/) ? timezoneId : null;

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
          languageId: validLanguageId,
          timezoneId: validTimezoneId,
          theme,
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
          profileVisibility,
          languageId: validLanguageId,
          timezoneId: validTimezoneId,
          theme,
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
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
