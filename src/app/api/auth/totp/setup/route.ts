import { NextRequest } from 'next/server';
import {
  withApiHandler,
  successResponse,
  errorResponse,
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { twoFactorAuth } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { TOTPService } from '@/server/services/totp';

/**
 * POST /api/auth/totp/setup — Initiate TOTP setup
 * 
 * Generates a TOTP secret and OTP Auth URI for the authenticated user.
 * The secret is encrypted and stored in the database with enabled=false
 * until the user verifies their first TOTP code.
 * 
 * Rate Limited: 5 requests per 15 minutes (auth tier)
 * Requires: Authentication
 */
export const POST = rateLimiters.auth(
  withApiHandler(
    async (_req: NextRequest, { user }) => {
      const userId = user!.id;
      const email = user!.email;

      // Check if user already has TOTP enabled
      const existing = await db.query.twoFactorAuth.findFirst({
        where: eq(twoFactorAuth.userId, userId),
      });

      if (existing?.enabled) {
        return errorResponse(
          'TOTP two-factor authentication is already enabled. Disable it first to set up a new authenticator.',
          409
        );
      }

      // Generate new TOTP secret
      const { secret, uri } = TOTPService.generateSecret(email);

      // Encrypt the secret for database storage
      const encryptedSecret = TOTPService.encryptSecret(secret);

      if (existing) {
        // Update existing pending setup
        await db
          .update(twoFactorAuth)
          .set({
            secret: encryptedSecret,
            enabled: false,
            method: 'app',
            updatedAt: new Date(),
          })
          .where(eq(twoFactorAuth.userId, userId));
      } else {
        // Create new record
        await db.insert(twoFactorAuth).values({
          userId,
          secret: encryptedSecret,
          enabled: false,
          method: 'app',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return successResponse({
        secret, // Base32 secret for manual entry
        uri,    // otpauth:// URI for QR code generation (client-side)
      });
    },
    { requireAuth: true }
  )
);
