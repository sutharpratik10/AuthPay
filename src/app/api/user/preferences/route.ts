import { NextRequest } from 'next/server';
import { 
  withApiHandler, 
  successResponse, 
  errorResponse,
  parseRequestBody 
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';

interface PreferencesBody {
  emailNotifications?: boolean;
  securityAlerts?: boolean;
  productUpdates?: boolean;
  profileVisibility?: boolean;
  additionalSettings?: Record<string, unknown>;
  twoFactorAuth?: boolean;
}

/**
 * GET /api/user/preferences - Get user preferences
 * Rate Limited: 60 requests per minute
 * Uses centralized API helpers for auth and response handling
 */
export const GET = rateLimiters.api(
  withApiHandler(
    async (_req: NextRequest, { user }) => {
      const userId = user!.id;

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
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        // Create default preferences for the user
        const defaultPreferences = {
          userId: userId,
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

        return successResponse(newPreferences[0]);
      }

      return successResponse(preferences[0]);
    },
    { requireAuth: true }
  )
);

/**
 * POST /api/user/preferences - Create or update user preferences
 * Rate Limited: 60 requests per minute
 * Uses centralized API helpers for auth and response handling
 */
export const POST = rateLimiters.api(
  withApiHandler(
    async (req: NextRequest, { user }) => {
      const userId = user!.id;

      const { data: body, error: parseError } = await parseRequestBody<PreferencesBody>(req);
      if (parseError) return parseError;

      const {
        emailNotifications,
        securityAlerts,
        productUpdates,
        profileVisibility,
        additionalSettings,
        twoFactorAuth
      } = body!;

      // Check if preferences already exist
      const existingPreferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (existingPreferences.length === 0) {
        // Create new preferences
        const newPreferences = await db
          .insert(userPreferences)
          .values({
            userId: userId,
            emailNotifications,
            securityAlerts,
            productUpdates,
            profileVisibility,
            additionalSettings: additionalSettings ? JSON.stringify(additionalSettings) : null,
            twoFactorAuth,
            updatedAt: new Date().toISOString()
          })
          .returning();

        return successResponse(
          { preferences: newPreferences[0] },
          'Preferences created successfully'
        );
      } else {
        // Update existing preferences
        const updatedPreferences = await db
          .update(userPreferences)
          .set({
            emailNotifications,
            securityAlerts,
            productUpdates,
            additionalSettings: additionalSettings ? JSON.stringify(additionalSettings) : undefined,
            twoFactorAuth,
            updatedAt: new Date().toISOString()
          })
          .where(eq(userPreferences.userId, userId))
          .returning();

        return successResponse(
          { preferences: updatedPreferences[0] },
          'Preferences updated successfully'
        );
      }
    },
    { requireAuth: true }
  )
);
