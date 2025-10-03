/**
 * REFACTORED: /api/user/admin-status
 * 
 * This is a refactored version using centralized API helpers
 * 
 * IMPROVEMENTS:
 * - Eliminated repetitive auth checking code
 * - Standardized response format
 * - Better error handling
 * - Performance logging
 * - Cleaner, more maintainable code
 */

import { NextRequest } from 'next/server';
import { 
  withApiHandler, 
  successResponse,
  createPerformanceLogger 
} from '@/lib/api-helpers';
import { PermissionService } from '@/services/permissions';

/**
 * GET /api/user/admin-status - Check if current user is admin
 * 
 * BEFORE: ~15 lines with manual auth checks
 * AFTER: ~8 lines using withApiHandler wrapper
 */
export const GET = withApiHandler(
  async (request: NextRequest, { user }) => {
    const logger = createPerformanceLogger(request);
    
    // User is guaranteed to exist due to requireAuth option
    const isAdmin = await PermissionService.isAdmin(user!.id);
    
    logger.end(user!.id);
    return successResponse({ isAdmin });
  },
  { requireAuth: true } // Automatic auth check
);
