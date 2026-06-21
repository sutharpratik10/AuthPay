import { NextRequest } from 'next/server';
import {
  withApiHandler,
  successResponse,
  errorResponse,
  parseRequestBody,
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { twoFactorAuth, recoveryCodes, userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { TOTPService } from '@/server/services/totp';
import { TOTPSetupVerifySchema } from '@/lib/validations/auth';

/**
 * POST /api/auth/totp/verify-setup — Verify first TOTP code and enable 2FA
 * 
 * After the user scans the QR code and enters their first TOTP code,
 * this endpoint verifies the code, enables TOTP 2FA, generates recovery codes,
 * and returns the plaintext recovery codes (one-time display).
 * 
 * Rate Limited: 5 requests per 15 minutes (auth tier)
 * Requires: Authentication
 */
export const POST = rateLimiters.auth(
  withApiHandler(
    async (req: NextRequest, { user }) => {
      const userId = user!.id;

      // Parse and validate input
      const { data: body, error: parseError } = await parseRequestBody(req);
      if (parseError) return parseError;

      const validation = TOTPSetupVerifySchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          validation.error.issues[0]?.message || 'Invalid input',
          400
        );
      }

      const { token } = validation.data;

      // Fetch the pending TOTP setup
      const totpRecord = await db.query.twoFactorAuth.findFirst({
        where: eq(twoFactorAuth.userId, userId),
      });

      if (!totpRecord || !totpRecord.secret) {
        return errorResponse(
          'No TOTP setup found. Please start the setup process first.',
          404
        );
      }

      if (totpRecord.enabled) {
        return errorResponse(
          'TOTP is already enabled for this account.',
          409
        );
      }

      // Decrypt the stored secret and verify the token
      let plainSecret: string;
      try {
        plainSecret = TOTPService.decryptSecret(totpRecord.secret);
      } catch {
        console.error('[TOTP Verify Setup] Failed to decrypt secret for user:', userId);
        return errorResponse(
          'Failed to verify code. Please restart the setup process.',
          500
        );
      }

      const isValid = TOTPService.verifyToken(plainSecret, token);
      if (!isValid) {
        return errorResponse(
          'Invalid verification code. Please check your authenticator app and try again.',
          400
        );
      }

      // Token is valid — enable TOTP
      await db
        .update(twoFactorAuth)
        .set({
          enabled: true,
          method: 'app',
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(twoFactorAuth.userId, userId));

      // Set the master 2FA toggle in userPreferences
      await db
        .update(userPreferences)
        .set({
          twoFactorAuth: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPreferences.userId, userId));

      // Delete any existing recovery codes for this user
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
        backupCodes: plaintextCodes, // One-time display — user must save these
        message: 'Two-factor authentication has been enabled successfully.',
      });
    },
    { requireAuth: true }
  )
);
