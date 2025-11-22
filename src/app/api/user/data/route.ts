/**
 * UNIFIED USER DATA ENDPOINT
 * 
 * GET /api/user/data - Fetch all user data in a single request
 * 
 * This endpoint combines multiple checks to reduce API calls:
 * - User validation (exists in database)
 * - Admin status check
 * 
 * BENEFITS:
 * - Reduces number of API requests from 2+ to 1
 * - Improves page load performance
 * - Better caching with SWR
 * - Single point of failure handling
 */

import { NextRequest } from 'next/server';
import { 
  withApiHandler, 
  successResponse,
  createPerformanceLogger 
} from '@/lib/api/helpers';
import { RBACService } from '@/lib/rbac/rbac-service';
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/user/data - Get comprehensive user data
 * 
 * Returns:
 * - isAdmin: Whether user has admin access
 * - exists: Whether user exists in database
 * - shouldSignOut: Whether user should be signed out (for deleted/inactive users)
 */
export const GET = withApiHandler(
  async (request: NextRequest, { user }) => {
    const logger = createPerformanceLogger(request);
    
    // User is guaranteed to exist due to requireAuth option
    const userId = user!.id;

    // Perform all checks in parallel for better performance
    const [isAdmin, userRecord] = await Promise.all([
      // Check admin status using policy-based RBAC
      RBACService.hasPolicy(userId, 'admin:access'),
      
      // Verify user exists in database
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { 
          id: true, 
          isActive: true
        }
      })
    ]);

    // Determine if user exists and is active
    const exists = !!userRecord;
    const isActive = userRecord?.isActive ?? false;
    const shouldSignOut = !exists || !isActive;

    if (!exists) {
      console.log(`[API] User ${userId} not found in database`);
    } else if (!isActive) {
      console.log(`[API] User ${userId} is deactivated`);
    }

    logger.end(userId);
    
    return successResponse({ 
      isAdmin,
      exists,
      shouldSignOut
    });
  },
  { requireAuth: true } // Automatic auth check
);
