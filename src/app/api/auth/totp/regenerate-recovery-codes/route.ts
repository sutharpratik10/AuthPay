import { NextRequest } from 'next/server';
import {
  withApiHandler,
  successResponse,
  errorResponse,
  parseRequestBody,
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { users, twoFactorAuth, recoveryCodes } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { TOTPService } from '@/server/services/totp';
import { TOTPRegenerateRecoveryCodesSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/totp/regenerate-recovery-codes
 * 
 * Verifies the user's password, deletes their old recovery codes,
 * and generates a fresh batch of 10 new recovery codes.
 * 
 * Rate Limited: 5 requests per 15 minutes (auth tier)
 * Requires: Authentication
 */
export const POST = rateLimiters.auth(
  withApiHandler(
    async (req: NextRequest, { user: sessionUser }) => {
      const userId = sessionUser!.id;

      // Parse and validate input
      const { data: body, error: parseError } = await parseRequestBody(req);
      if (parseError) return parseError;

      const validation = TOTPRegenerateRecoveryCodesSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          validation.error.issues[0]?.message || 'Invalid input',
          400
        );
      }

      const { password } = validation.data;

      // Verify the user's password
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!dbUser || !dbUser.password) {
        return errorResponse('User not found or password not set', 400);
      }

      const isPasswordValid = await bcrypt.compare(password, dbUser.password);
      if (!isPasswordValid) {
        return errorResponse('Incorrect password', 401);
      }

      // Ensure TOTP is enabled
      const totpRecord = await db.query.twoFactorAuth.findFirst({
        where: eq(twoFactorAuth.userId, userId),
      });

      if (!totpRecord || !totpRecord.enabled || totpRecord.method !== 'app') {
        return errorResponse(
          'App-based two-factor authentication is not enabled.',
          400
        );
      }

      // Delete old recovery codes
      await db
        .delete(recoveryCodes)
        .where(eq(recoveryCodes.userId, userId));

      // Generate new recovery codes
      const plaintextCodes = TOTPService.generateRecoveryCodes();

      // Hash and store each code
      const hashedCodes = await Promise.all(
        plaintextCodes.map(async (code) => ({
          userId,
          code: await TOTPService.hashRecoveryCode(code),
          isUsed: false,
          createdAt: new Date(),
        }))
      );

      await db.insert(recoveryCodes).values(hashedCodes);

      return successResponse({
        backupCodes: plaintextCodes,
        message: 'Recovery codes regenerated successfully.',
      });
    },
    { requireAuth: true }
  )
);
