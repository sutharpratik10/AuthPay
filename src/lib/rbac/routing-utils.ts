/**
 * Centralized Policy-Based Routing Utilities
 * 
 * This file provides centralized routing logic based on RBAC policies.
 * Change routing behavior here instead of modifying multiple layout files.
 * 
 * NOTE: This file is safe for both server and client components as it doesn't
 * directly import database-dependent services. Use the API endpoint for client-side routing.
 */

/**
 * Route configuration with policy requirements
 */
export const ROUTE_POLICIES = {
  // Admin routes
  ADMIN_DASHBOARD: {
    path: '/protected/admin/dashboard',
    policy: 'admin:access',
    fallback: '/protected/user/dashboard'
  },
  ADMIN_USERS: {
    path: '/protected/admin/users',
    policy: 'user:manage',
    fallback: '/protected/user/dashboard'
  },
  ADMIN_ROLES: {
    path: '/protected/admin/roles',
    policy: 'role:manage',
    fallback: '/protected/user/dashboard'
  },
  ADMIN_USER_ROLES: {
    path: '/protected/admin/user-roles',
    policy: 'user:manage',
    fallback: '/protected/user/dashboard'
  },
  ADMIN_TRANSACTIONS: {
    path: '/protected/admin/transactions',
    policy: 'admin:access',
    fallback: '/protected/user/dashboard'
  },
  ADMIN_PAYMENT_GATEWAY: {
    path: '/protected/admin/paymentgateway',
    policy: 'admin:access',
    fallback: '/protected/user/dashboard'
  },
  
  // User routes
  USER_DASHBOARD: {
    path: '/protected/user/dashboard',
    policy: 'user:access',
    fallback: '/auth/login'
  },
  USER_PROFILE: {
    path: '/protected/profile',
    policy: 'profile:view',
    fallback: '/protected/user/dashboard'
  },
  USER_SETTINGS: {
    path: '/protected/settings',
    policy: 'settings:manage',
    fallback: '/protected/user/dashboard'
  },
  
  // Auth routes
  AUTH_LOGIN: {
    path: '/auth/login',
    policy: null, // Public
    fallback: null
  },
  AUTH_SIGNUP: {
    path: '/auth/signup',
    policy: null, // Public
    fallback: null
  },
  AUTH_VERIFY: {
    path: '/auth/verify',
    policy: null, // Requires auth but no specific policy
    fallback: null
  }
} as const;

/**
 * Export constants for easy access
 */
export const DASHBOARD_PATHS = {
  ADMIN: ROUTE_POLICIES.ADMIN_DASHBOARD.path,
  USER: ROUTE_POLICIES.USER_DASHBOARD.path,
} as const;

/**
 * Server-side routing utilities
 * These should only be imported in server components or API routes
 */

// Only import RBACService on server-side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RBACService: any = null;

// Lazy load RBACService only when needed (server-side)
async function getRBACService() {
  if (!RBACService && typeof window === 'undefined') {
    const rbacModule = await import('./rbac-service');
    RBACService = rbacModule.RBACService;
  }
  return RBACService;
}

/**
 * Get the appropriate dashboard URL based on user's policies
 * This is the SINGLE source of truth for dashboard routing
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function getDashboardUrl(userId: string): Promise<string> {
  try {
    const service = await getRBACService();
    
    // Check if user has admin access
    const hasAdminAccess = await service.isAdmin(userId);
    
    if (hasAdminAccess) {
      return ROUTE_POLICIES.ADMIN_DASHBOARD.path;
    }
    
    // Default to user dashboard
    return ROUTE_POLICIES.USER_DASHBOARD.path;
  } catch (error) {
    console.error('[RBAC Routing] Error determining dashboard URL:', error);
    // Fail safe - return user dashboard
    return ROUTE_POLICIES.USER_DASHBOARD.path;
  }
}

/**
 * Check if user can access a specific route
 * Returns the route path if allowed, or fallback path if denied
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function getAuthorizedRoute(
  userId: string, 
  requestedPath: string
): Promise<{ allowed: boolean; redirectTo?: string }> {
  try {
    const service = await getRBACService();
    
    // Find matching route policy
    const routeConfig = Object.values(ROUTE_POLICIES).find(
      config => requestedPath.startsWith(config.path)
    );

    // If no policy required (public route), allow access
    if (!routeConfig || !routeConfig.policy) {
      return { allowed: true };
    }

    // Check if user has required policy
    const hasAccess = await service.hasPolicy(userId, routeConfig.policy);

    if (hasAccess) {
      return { allowed: true };
    }

    // Access denied - return fallback route
    return { 
      allowed: false, 
      redirectTo: routeConfig.fallback || ROUTE_POLICIES.USER_DASHBOARD.path 
    };
  } catch (error) {
    console.error('[RBAC Routing] Error checking route authorization:', error);
    return { 
      allowed: false, 
      redirectTo: ROUTE_POLICIES.USER_DASHBOARD.path 
    };
  }
}

/**
 * Get redirect path after successful login
 * Priority: returnTo param > user's default dashboard
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function getPostLoginRedirect(
  userId: string,
  returnTo?: string | null
): Promise<string> {
  // If returnTo is specified and valid, use it
  if (returnTo && returnTo.startsWith('/protected')) {
    const { allowed, redirectTo } = await getAuthorizedRoute(userId, returnTo);
    if (allowed) {
      return returnTo;
    }
    if (redirectTo) {
      return redirectTo;
    }
  }

  // Default to user's dashboard
  return getDashboardUrl(userId);
}

/**
 * Determine if user should be redirected from auth pages
 * Returns dashboard URL if user is authenticated and verified
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function getAuthPageRedirect(
  userId: string | null,
  isEmailVerified: boolean,
  currentPath: string
): Promise<string | null> {
  // Not authenticated - no redirect
  if (!userId) {
    return null;
  }

  // On verify page and not verified - allow access
  if (currentPath === ROUTE_POLICIES.AUTH_VERIFY.path && !isEmailVerified) {
    return null;
  }

  // Authenticated and verified - redirect to dashboard
  if (isEmailVerified) {
    return getDashboardUrl(userId);
  }

  // Authenticated but not verified - redirect to verify page
  return ROUTE_POLICIES.AUTH_VERIFY.path;
}

/**
 * Helper to check if user has admin access
 * This is a convenience method used in layouts
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const service = await getRBACService();
    return service.isAdmin(userId);
  } catch (error) {
    console.error('[RBAC Routing] Error checking admin status:', error);
    return false;
  }
}

/**
 * Helper to check if user has any of the specified policies
 * 
 * ⚠️ SERVER-SIDE ONLY - Use API endpoint for client-side
 */
export async function hasAnyPolicy(
  userId: string,
  policies: string[]
): Promise<boolean> {
  try {
    const service = await getRBACService();
    return service.hasAnyPolicy(userId, policies);
  } catch (error) {
    console.error('[RBAC Routing] Error checking policies:', error);
    return false;
  }
}
