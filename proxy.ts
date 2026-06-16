import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rscProtectionMiddleware } from '@/lib/middleware/rsc-protection';

// Policy-based route protection mapping
const ROUTE_POLICY_MAP: Record<string, string> = {
  // Admin routes require admin policies
  '/protected/admin': 'admin:access',

  // User profile and settings
  '/protected/profile': 'profile:view',
  '/protected/account': 'account:manage',
  '/protected/settings': 'settings:manage',

  // Regular user routes
  '/protected/user': 'user:access',
};

/**
 * Check if user has required policy for a route
 */
async function hasRequiredPolicy(userId: string, path: string): Promise<boolean> {
  try {
    const { RBACService } = await import("./src/lib/rbac");

    // Check if path matches any policy-protected route
    for (const [route, requiredPolicy] of Object.entries(ROUTE_POLICY_MAP)) {
      if (path.startsWith(route) || path === route) {
        // Check if user has the required policy
        const hasPolicy = await RBACService.hasPolicy(userId, requiredPolicy);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIDDLEWARE] 🔐 Policy check: ${requiredPolicy} for ${path} = ${hasPolicy}`);
        }
        return hasPolicy;
      }
    }

    // No specific policy required - allow access
    return true;
  } catch (error) {
    console.error('[MIDDLEWARE] Error checking policy:', error);
    // Fail secure - deny access on error
    return false;
  }
}

// Attach a small set of security headers to responses
function setSecurityHeaders(response: NextResponse) {
  try {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  } catch (e) {
    // Defensive: headers might be frozen in some response types
    if (process.env.NODE_ENV === 'development') {
      console.warn('[MIDDLEWARE] Could not set security headers:', e);
    }
  }
  return response;
}

export async function proxy(request: NextRequest) {
  // ============================================
  // CVE-2025-55182 Protection (MUST BE FIRST)
  // ============================================
  try {
    const rscProtectionResponse = await rscProtectionMiddleware(request);
    if (rscProtectionResponse) {
      return rscProtectionResponse;
    }
  } catch (error) {
    // Log error but continue - don't let protection errors cause DoS
    console.error('[MIDDLEWARE] RSC protection error:', error);
  }

  const path = request.nextUrl.pathname;

  // Skip middleware for:
  // 1. Static assets and Next.js internals
  // 2. ALL API routes (including /api/auth/* - NextAuth handles its own auth)
  // 3. Image files
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||  // Skip ALL API routes
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js|gif|webp|woff|woff2|ttf)$/)
  ) {
    const res = NextResponse.next();
    return setSecurityHeaders(res);
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIDDLEWARE] ⚡ Processing: ${request.method} ${path}`);
  }

  // Define route categories
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];

  const authRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];

  const protectedRoutes = [
    '/protected/profile',
    '/protected/account',
    '/protected/settings',
    '/protected/admin',
    '/protected/user'
  ];

  const verificationRoute = '/auth/verify';

  // Allow public routes without authentication check
  if (publicRoutes.includes(path)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Public route allowed: ${path}`);
    }
    const res = NextResponse.next();
    return setSecurityHeaders(res);
  }

  // Use NextAuth's JWT check for fast authentication (no database query)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!token;

  // Check if this is a protected route
  const needsProtection = protectedRoutes.some(route =>
    path.startsWith(route) || path === route
  );

  // SECURITY: Check if JWT token has expired
  if (token && token.exp) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tokenExp = token.exp as number;
    if (tokenExp < currentTimestamp) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ⚠️ JWT token expired at ${new Date(tokenExp * 1000).toISOString()}`);
      }
      // Token has expired - redirect to login with session expired message
      if (needsProtection || authRoutes.includes(path)) {
        const res = NextResponse.redirect(new URL('/auth/login?error=SessionExpired', request.url));
        return setSecurityHeaders(res);
      }
    }
  } else if (token && !token.exp) {
    // SECURITY: Token without expiration claim - this is a legacy/invalid token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ⚠️ JWT token missing expiration claim - forcing re-login`);
    }
    if (needsProtection || authRoutes.includes(path)) {
      const res = NextResponse.redirect(new URL('/auth/login?error=SecurityUpdate', request.url));
      return setSecurityHeaders(res);
    }
  }

  const user = token ? {
    id: token.sub as string,
    email: token.email as string,
    isEmailVerified: token.isEmailVerified as boolean,
    role: token.role as string,
  } : null;
  const isEmailVerified = user?.isEmailVerified === true;

  // Helper to get dashboard URL based on user role
  function getDashboardUrl(): string {
    const userRole = user?.role || 'user';
    return userRole === 'admin'
      ? '/protected/admin/dashboard'
      : '/protected/user/dashboard';
  }

  // Handle verification page access
  if (path === verificationRoute) {
    // Allow both authenticated and unauthenticated users to access verify page
    // Unauthenticated: Have verification token from registration
    // Authenticated: Want to verify their email from dashboard

    if (isAuthenticated && isEmailVerified) {
      // Already verified, redirect to dashboard
      const dashboardUrl = getDashboardUrl();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ✅ Email already verified, redirecting to dashboard`);
      }
      const res = NextResponse.redirect(new URL(dashboardUrl, request.url));
      return setSecurityHeaders(res);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Allowing access to verify page`);
    }
    const res = NextResponse.next();
    return setSecurityHeaders(res);
  }

  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      // Authenticated users should go to their dashboard
      // No need to check email verification - they can verify from dashboard
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ✅ Authenticated user, redirecting to dashboard`);
      }
      const dashboardUrl = getDashboardUrl();
      const res = NextResponse.redirect(new URL(dashboardUrl, request.url));
      return setSecurityHeaders(res);
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Unauthenticated user accessing auth page: ${path}`);
    }
    const res = NextResponse.next();
    return setSecurityHeaders(res);
  }

  // Handle protected routes with POLICY-BASED ACCESS CONTROL
  if (needsProtection) {
    if (!isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] 🔒 Unauthenticated access to protected route: ${path}`);
      }
      const res = NextResponse.redirect(new URL('/auth/login', request.url));
      return setSecurityHeaders(res);
    }

    // Allow unverified users to access protected routes
    // They will see a verification banner on the dashboard instead of being blocked
    if (!isEmailVerified) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ⚠️ Unverified email accessing protected route (allowed with banner): ${path}`);
      }
    }

    // POLICY-BASED ACCESS CONTROL: Check if user has required policy
    const hasAccess = await hasRequiredPolicy(user!.id, path);

    if (!hasAccess) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] 🚫 Policy check failed for ${path}`);
      }
      // User doesn't have required policy - redirect to forbidden page or user dashboard
      const res = NextResponse.redirect(new URL('/protected/user/dashboard?error=Forbidden', request.url));
      return setSecurityHeaders(res);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Authorized access to: ${path}`);
    }
    const res = NextResponse.next();
    return setSecurityHeaders(res);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIDDLEWARE] ✅ Allowing access to: ${path}`);
  }
  const res = NextResponse.next();
  return setSecurityHeaders(res);
}

export const config = {
  matcher: [
    '/protected/(.*)',
    '/auth/(.*)',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Conservative exclusion to avoid running on static image assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};

