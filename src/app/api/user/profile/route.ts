import { NextRequest } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { 
  withApiHandler, 
  successResponse, 
  errorResponse,
  parseRequestBody 
} from '@/lib/api/helpers';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/user/profile - Update user profile
 * Uses centralized API helpers for auth and response handling
 */
const updateProfile = withApiHandler(
  async (req: NextRequest, { user }) => {
    const userId = user!.id;

    const { data: body, error: parseError } = await parseRequestBody<{ name: string }>(req);
    if (parseError) return parseError;

    const { name } = body!;

    // Validate input
    if (!name || typeof name !== 'string') {
      return errorResponse('Name is required and must be a string', 400);
    }

    if (name.trim().length < 1) {
      return errorResponse('Name cannot be empty', 400);
    }

    if (name.trim().length > 100) {
      return errorResponse('Name cannot be longer than 100 characters', 400);
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

    return successResponse(
      { user: updatedUser },
      'Profile updated successfully'
    );
  },
  { requireAuth: true }
);

// Export the route handler wrapped with policy checking
export const PUT = withPolicy(updateProfile, API_POLICIES.PROFILE_EDIT);
