import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { BaseRouteHandler } from './BaseRouteHandler';

/**
 * User route handler - base class for user-related routes
 * Handles user authorization and permission checks using direct user-role model
 */
export abstract class UserRouteHandler extends BaseRouteHandler {
  /**
   * Check authorization for user operations
   * Uses direct user-role relationship (no tenants)
   */
  protected async checkUserAuthorization(req: NextRequest, requiredPermission?: string): Promise<{ authorized: boolean; error?: string; userId?: string }> {
    // Get the current user from the session
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { authorized: false, error: 'Authentication required' };
    }
    const userId = session.user.id;
    // Check if a specific permission is required
    if (requiredPermission) {
      try {
        const { PermissionService } = await import('@/services/permissions');
        const hasPermission = await PermissionService.hasPermission(userId, requiredPermission);
        if (!hasPermission) {
          return {
            authorized: false,
            error: `You don't have the required permission: ${requiredPermission}`
          };
        }
      } catch (permError) {
        console.error('Error checking permissions:', permError);
        return { authorized: false, error: 'Error checking permissions' };
      }
    }
    return { authorized: true, userId };
  }
}
