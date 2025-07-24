/**
 * Route configuration for the application
 */

// Define the main route paths
export const ROUTES = {
  // Auth routes
  AUTH: {
    ROOT: "/auth",
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  // Protected routes
  PROTECTED: {
    ROOT: "/protected",
    DASHBOARD: "/protected/dashboard",
    SETTINGS: "/protected/settings",
    PROFILE: "/protected/profile",
    ACCOUNT: "/protected/account",
    VERIFY: "/auth/verify",
  },
  
  // Public routes
  PUBLIC: {
    HOME: "/",
    ABOUT: "/about",
    CONTACT: "/contact",
  }
}

/**
 * Helper function to generate URLs with path parameters
 * @example buildUrl(ROUTES.PUBLIC.PRODUCT, { id: '123' }) => '/product/123'
 */
export function buildUrl(pattern: string, params: Record<string, string | number> = {}): string {
  return Object.entries(params).reduce((url, [key, value]) => {
    return url.replace(`:${key}`, String(value))
  }, pattern)
}

/**
 * Redirect URL when a user needs to login
 * @param returnTo - The URL to return to after login
 */
export function getLoginRedirectUrl(returnTo?: string): string {
  if (!returnTo) return ROUTES.AUTH.LOGIN
  
  // Encode the return path so we can redirect back after login
  const encodedReturnPath = encodeURIComponent(returnTo)
  return `${ROUTES.AUTH.LOGIN}?returnTo=${encodedReturnPath}`
}

/**
 * Helper for accessing robust URL patterns
 */
export const URL = {
  // Auth
  login: () => ROUTES.AUTH.LOGIN,
  signup: () => ROUTES.AUTH.SIGNUP,
  forgotPassword: () => ROUTES.AUTH.FORGOT_PASSWORD,
  // Protected
  verify: () => ROUTES.PROTECTED.VERIFY,
  dashboard: () => ROUTES.PROTECTED.DASHBOARD,
  settings: () => ROUTES.PROTECTED.SETTINGS,
  profile: () => ROUTES.PROTECTED.PROFILE,
  account: () => ROUTES.PROTECTED.ACCOUNT,
  // Public
  home: () => ROUTES.PUBLIC.HOME,
  // Helper functions
  getLoginRedirectUrl,
  buildUrl,
}
