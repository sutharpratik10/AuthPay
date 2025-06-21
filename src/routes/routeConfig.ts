import { ROUTES } from './routeUtils';

/**
 * Configuration for route permissions
 */
export const ROUTE_CONFIG = {
  // Which routes require authentication
  requiresAuth: [
    ROUTES.PROTECTED.ROOT,
    ROUTES.PROTECTED.DASHBOARD,
  ],
  
  // Which routes are public (don't require auth)
  public: [
    ROUTES.PUBLIC.HOME,
    ROUTES.PUBLIC.ABOUT,
    ROUTES.PUBLIC.CONTACT,
    ROUTES.AUTH.LOGIN,
    ROUTES.AUTH.SIGNUP,
    ROUTES.AUTH.FORGOT_PASSWORD,
  ],
  
  // Default redirect after login (if no returnTo parameter)
  defaultAuthRedirect: ROUTES.PROTECTED.DASHBOARD,
  
  // Default redirect when accessing a protected route while unauthenticated
  defaultUnauthRedirect: ROUTES.AUTH.LOGIN,
}

/**
 * Helper function to check if a route requires authentication
 */
export function routeRequiresAuth(path: string): boolean {
  return ROUTE_CONFIG.requiresAuth.some(route => {
    // Check if route is the exact route or a subroute
    return path === route || path.startsWith(`${route}/`);
  });
}

/**
 * Helper function to redirect unauthenticated users from protected routes
 */
export function getRedirectForUnauthenticated(currentPath: string): string {
  return `${ROUTE_CONFIG.defaultUnauthRedirect}?returnTo=${encodeURIComponent(currentPath)}`;
}
