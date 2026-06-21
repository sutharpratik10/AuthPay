import { NextRequest } from 'next/server';
import {
  withApiHandler,
  successResponse,
  errorResponse,
  parseRequestBody,
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { users, twoFactorAuth, recoveryCodes, userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { TOTPDisableSchema } from '@/lib/validations/auth';

/**
 * POST /api/auth/totp/disable — Disable TOTP 2FA
 * 
 * Requires the user's current password for confirmation.
 * Deletes the TOTP record and all recovery codes, and
 * sets userPreferences.twoFactorAuth to false.
 * 
 * Rate Limited: 5 requests per 15 minutes (auth tier)
 * Requires: Authentication
 */
export const POST = rateLimiters.auth(
  withApiHandler(
    async (req: NextRequest, { user: authUser }) => {
      const userId = authUser!.id;

      // Parse and validate input
      const { data: body, error: parseError } = await parseRequestBody(req);
      if (parseError) return parseError;

      const validation = TOTPDisableSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          validation.error.issues[0]?.message || 'Invalid input',
          400
        );
      }

      const { password } = validation.data;

      // Verify user's password
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!userRecord || !userRecord.password) {
        return errorResponse('Unable to verify identity', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, userRecord.password);
      if (!isPasswordValid) {
        return errorResponse('Invalid password. Please check and try again.', 401);
      }

      // Check if TOTP is actually enabled
      const totpRecord = await db.query.twoFactorAuth.findFirst({
        where: eq(twoFactorAuth.userId, userId),
      });

      if (!totpRecord || !totpRecord.enabled) {
        return errorResponse('TOTP two-factor authentication is not enabled.', 400);
      }

      // Delete TOTP record
      await db
        .delete(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, userId));

      // Delete all recovery codes
      await db
        .delete(recoveryCodes)
        .where(eq(recoveryCodes.userId, userId));

      // Set the master 2FA toggle to false
      await db
        .update(userPreferences)
        .set({
          twoFactorAuth: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPreferences.userId, userId));

      console.log(`[SECURITY] TOTP 2FA disabled for user: ${userId}`);

      return successResponse({
        message: 'Two-factor authentication has been disabled.',
      });
    },
    { requireAuth: true }
  )
);
