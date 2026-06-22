/**
 * REFACTORED: /api/user/admin-status
 * 
 * This is a refactored version using centralized API helpers and policy-based RBAC
 * 
 * IMPROVEMENTS:
 * - Eliminated repetitive auth checking code
 * - Standardized response format
 * - Better error handling
 * - Performance logging
 * - Uses policy-based RBAC system
 * - Cleaner, more maintainable code
 */

import { NextRequest } from 'next/server';
import { 
  withApiHandler, 
  successResponse,
  createPerformanceLogger 
} from '@/lib/api/helpers';
import { RBACService } from '@/lib/rbac/rbac-service';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * GET /api/user/admin-status - Check if current user has admin access
 * Rate Limited: 60 requests per minute
 * 
 * Uses policy-based RBAC: checks for 'admin:access' policy
 */
export const GET = rateLimiters.api(
  withApiHandler(
  async (request: NextRequest, { user }) => {
    const logger = createPerformanceLogger(request);
    
    // User is guaranteed to exist due to requireAuth option
    // Use policy-based check instead of direct isAdmin call
    const isAdmin = await RBACService.hasPolicy(user!.id, 'admin:access');
    
    logger.end(user!.id);
    return successResponse({ isAdmin });
  },
  { requireAuth: true } // Automatic auth check
  )
);
