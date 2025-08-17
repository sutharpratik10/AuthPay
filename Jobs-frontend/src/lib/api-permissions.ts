import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';

/**
 * Permission configuration for API routes
 */
export interface RoutePermission {
  permission: string;
  adminOnly?: boolean;
}

/**
 * Higher-order function to wrap API route handlers with permission checking
 */
export function withPermission(
  handler: (req: NextRequest, context?: unknown) => Promise<NextResponse>,
  config: RoutePermission
) {
  return async function (req: NextRequest, context?: unknown): Promise<NextResponse> {
    try {
      // Get the current session
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }

      const userId = session.user.id;

      // Check admin-only routes
      if (config.adminOnly) {
        const isAdmin = await PermissionService.isAdmin(userId);
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
          );
        }
      }

      // Check specific permission
      const hasPermission = await PermissionService.hasPermission(userId, config.permission);
      if (!hasPermission) {
        return NextResponse.json(
          { error: `Forbidden - Missing permission: ${config.permission}` },
          { status: 403 }
        );
      }

      // Permission granted, proceed with the original handler
      return await handler(req, context);
    } catch (error) {
      console.error('Permission check error:', error);
      return NextResponse.json(
        { error: 'Internal server error during permission check' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to check if user has specific permission
 */
export async function checkPermission(permission: string): Promise<{
  userId: string | null;
  hasPermission: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        userId: null,
        hasPermission: false,
        error: 'Unauthorized - Please login'
      };
    }

    const userId = session.user.id;
    const hasPermission = await PermissionService.hasPermission(userId, permission);
    
    return {
      userId,
      hasPermission,
    };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      userId: null,
      hasPermission: false,
      error: 'Internal server error during permission check'
    };
  }
}

/**
 * Utility function to ensure user is admin
 */
export async function requireAdmin(): Promise<{
  userId: string | null;
  isAdmin: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        userId: null,
        isAdmin: false,
        error: 'Unauthorized - Please login'
      };
    }

    const userId = session.user.id;
    const isAdmin = await PermissionService.isAdmin(userId);
    
    return {
      userId,
      isAdmin,
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      userId: null,
      isAdmin: false,
      error: 'Internal server error during admin check'
    };
  }
}

/**
 * API route permission decorators/configs
 */
export const API_PERMISSIONS = {
  // User management
  USER_VIEW: { permission: 'user.view', adminOnly: true },
  USER_CREATE: { permission: 'user.create', adminOnly: true },
  USER_EDIT: { permission: 'user.edit', adminOnly: true },
  USER_DELETE: { permission: 'user.delete', adminOnly: true },
  
  // Profile management
  PROFILE_VIEW: { permission: 'profile.view' },
  PROFILE_EDIT: { permission: 'profile.edit' },
  
  // Tenant management
  TENANT_VIEW: { permission: 'tenant.view' },
  TENANT_CREATE: { permission: 'tenant.create' },
  TENANT_EDIT: { permission: 'tenant.edit' },
  TENANT_DELETE: { permission: 'tenant.delete', adminOnly: true },
  
  // Subscription management
  SUBSCRIPTION_VIEW: { permission: 'subscription.view' },
  SUBSCRIPTION_PURCHASE: { permission: 'subscription.purchase' },
  SUBSCRIPTION_CANCEL: { permission: 'subscription.cancel' },
  SUBSCRIPTION_MANAGE: { permission: 'subscription.manage', adminOnly: true },
  
  // Content management
  CONTENT_VIEW: { permission: 'content.view' },
  CONTENT_CREATE: { permission: 'content.create' },
  CONTENT_EDIT: { permission: 'content.edit' },
  CONTENT_DELETE: { permission: 'content.delete' },
  
  // System management
  SYSTEM_MANAGE: { permission: 'system.manage', adminOnly: true },
  ANALYTICS_VIEW: { permission: 'analytics.view', adminOnly: true },
  LOGS_VIEW: { permission: 'logs.view', adminOnly: true },
  SETTINGS_MANAGE: { permission: 'settings.manage', adminOnly: true },
} as const;
