import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { RBACService } from '@/lib/rbac/rbac-service';

/**
 * Permission configuration for API routes
 */
export interface RoutePermission {
  permission: string;
  adminOnly?: boolean;
}

/**
 * Policy-based permission configuration for API routes
 */
export interface PolicyPermission {
  policy: string;
}

/**
 * Higher-order function to wrap API route handlers with policy-based permission checking
 * Use this for new routes - it uses the centralized policy-based RBAC system
 */
export function withPolicy(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: PolicyPermission
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
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

      // Check if user has required policy using centralized RBAC service
      const hasAccess = await RBACService.hasPolicy(userId, config.policy);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: `Forbidden - Missing policy: ${config.policy}` },
          { status: 403 }
        );
      }

      // Policy granted, proceed with the original handler
      return await handler(req, context);
    } catch (error) {
      console.error('Policy check error:', error);
      return NextResponse.json(
        { error: 'Internal server error during policy check' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with permission checking
 * @deprecated Use withPolicy instead for new routes - it uses the centralized policy-based RBAC system
 */
export function withPermission(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: RoutePermission
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
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
        const isAdmin = await RBACService.isAdmin(userId);
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
          );
        }
      }

      // Check specific permission (using hasPolicy since that's what RBACService provides)
      const hasPermission = await RBACService.hasPolicy(userId, config.permission);
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
 * Utility function to check if user has specific policy
 */
export async function checkPolicy(policy: string): Promise<{
  userId: string | null;
  hasPolicy: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        userId: null,
        hasPolicy: false,
        error: 'Unauthorized - Please login'
      };
    }

    const userId = session.user.id;
    const hasPolicy = await RBACService.hasPolicy(userId, policy);
    
    return {
      userId,
      hasPolicy,
    };
  } catch (error) {
    console.error('Error checking policy:', error);
    return {
      userId: null,
      hasPolicy: false,
      error: 'Internal server error during policy check'
    };
  }
}

/**
 * Utility function to check if user has specific permission
 * @deprecated Use checkPolicy instead for new code - it uses the centralized policy-based RBAC system
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
    // Use hasPolicy since the new RBAC system is policy-based
    const hasPermission = await RBACService.hasPolicy(userId, permission);
    
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
    const isAdmin = await RBACService.isAdmin(userId);
    
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

/**
 * Policy-based API route configurations
 * Use these with withPolicy middleware for new routes
 */
export const API_POLICIES = {
  // Admin policies
  ADMIN_ACCESS: { policy: 'admin:access' },
  ADMIN_DASHBOARD: { policy: 'admin:dashboard' },
  USER_MANAGE: { policy: 'user:manage' },
  ROLE_MANAGE: { policy: 'role:manage' },
  SYSTEM_MANAGE: { policy: 'system:manage' },
  ANALYTICS_VIEW: { policy: 'analytics:view' },
  LOGS_VIEW: { policy: 'logs:view' },
  
  // User policies
  USER_ACCESS: { policy: 'user:access' },
  PROFILE_VIEW: { policy: 'profile:view' },
  PROFILE_EDIT: { policy: 'profile:edit' },
  SETTINGS_MANAGE: { policy: 'settings:manage' },
  
  // Subscription policies
  SUBSCRIPTION_VIEW: { policy: 'subscription:view' },
  SUBSCRIPTION_PURCHASE: { policy: 'subscription:purchase' },
  SUBSCRIPTION_CANCEL: { policy: 'subscription:cancel' },
  SUBSCRIPTION_MANAGE: { policy: 'subscription:manage' },
  
  // Content policies
  CONTENT_VIEW: { policy: 'content:view' },
  CONTENT_CREATE: { policy: 'content:create' },
  CONTENT_EDIT: { policy: 'content:edit' },
  CONTENT_DELETE: { policy: 'content:delete' },
  
  // Tenant policies
  TENANT_VIEW: { policy: 'tenant:view' },
  TENANT_CREATE: { policy: 'tenant:create' },
  TENANT_EDIT: { policy: 'tenant:edit' },
  TENANT_DELETE: { policy: 'tenant:delete' },
} as const;
