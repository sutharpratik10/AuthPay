import { NextRequest } from 'next/server'
import { 
  withApiHandler, 
  successResponse, 
  errorResponse,
  parseRequestBody 
} from '@/lib/api/helpers'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { validatePassword } from '@/lib/utils/sanitize';

/**
 * POST /api/user/set-password - Set password for OAuth users
 * Rate Limited: 3 requests per hour (VERY STRICT - sensitive operation)
 * Uses centralized API helpers for auth and response handling
 */
export const POST = rateLimiters.sensitive(
  withApiHandler(
    async (request: NextRequest, { user }) => {
      const userId = user!.id;

      const { data: body, error: parseError } = await parseRequestBody<{ password: string }>(request);
      if (parseError) return parseError;

      const { password } = body!;

      if (!password || typeof password !== 'string') {
        return errorResponse('Password is required', 400);
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return errorResponse(passwordValidation.error || 'Invalid password', 400);
      }

      // Fetch user from database
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, password: true }
      });

      if (!dbUser) {
        return errorResponse('User not found', 404);
      }

      // Check if user already has a password
      if (dbUser.password !== null && dbUser.password !== undefined) {
        return errorResponse('User already has a password set. Use change password instead.', 400);
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with new password
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date().toISOString() 
        })
        .where(eq(users.id, dbUser.id));

      return successResponse(null, 'Password set successfully');
    },
    { requireAuth: true }
  )
);
