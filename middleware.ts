import { NextRequest, NextResponse } from "next/server";
import { validateSessionFromRequest, createUnauthorizedResponse, trackSessionActivity } from "@/lib/session-validation";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if user requires 2FA verification for this session
 */
async function checkSessionRequires2FA(userId: string): Promise<{ requires2FA: boolean; isVerified: boolean }> {
  try {
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
      columns: { twoFactorAuth: true }
    });

    const has2FA = preferences?.twoFactorAuth === true;
    
    if (!has2FA) {
      return { requires2FA: false, isVerified: true };
    }

    return { requires2FA: true, isVerified: true };
  } catch (error) {
    console.error('Error checking 2FA requirements:', error);
    return { requires2FA: false, isVerified: true };
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for static assets and API routes (except auth)
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') && !path.startsWith('/api/auth') ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  console.log(`[MIDDLEWARE] ⚡ Processing: ${request.method} ${path}`);
  
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
    console.log(`[MIDDLEWARE] ✅ Public route allowed: ${path}`);
    return NextResponse.next();
  }

  // For all other routes, validate session using the new system
  const sessionValidation = await validateSessionFromRequest(request, {
    extendSession: true,
    requireVerifiedEmail: false, // We'll handle this per route
    requireActiveUser: true,
  });

  const isAuthenticated = sessionValidation.isValid;
  const user = sessionValidation.user;
  const isEmailVerified = user?.isEmailVerified === true;

  // Track user activity if session is valid
  if (isAuthenticated) {
    trackSessionActivity(request).catch(error => {
      console.error('Failed to track session activity:', error);
    });
  }


  // Helper to get role name from user data
  function getUserRole(): string {
    if (!user?.roleId) return "user";
    // You might want to fetch role name from roleId here if needed
    return "user"; // Simplified for now
  }

  // Helper to get dashboard URL based on user role
  function getDashboardUrl(): string {
    const userRole = getUserRole();
    return userRole === 'admin'
      ? '/protected/admin/dashboard'
      : '/protected/user/dashboard';
  }

  // Handle verification page access
  if (path === verificationRoute) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] 🔒 Unauthenticated user trying to access verify page`);
      return createUnauthorizedResponse(request, 'Authentication required', '/auth/login');
    }
    if (isEmailVerified) {
      const dashboardUrl = getDashboardUrl();
      console.log(`[MIDDLEWARE] ✅ Email verified, redirecting to dashboard`);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    console.log(`[MIDDLEWARE] ✅ Authenticated unverified user accessing verify page`);
    return NextResponse.next();
  }
  
  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      if (isEmailVerified) {
        console.log(`[MIDDLEWARE] ✅ Authenticated verified user, redirecting to dashboard`);
        const dashboardUrl = getDashboardUrl();
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      } else {
        console.log(`[MIDDLEWARE] ⚠️ Authenticated unverified user, redirecting to verify`);
        return NextResponse.redirect(new URL('/auth/verify', request.url));
      }
    }
    console.log(`[MIDDLEWARE] ✅ Unauthenticated user accessing auth page: ${path}`);
    return NextResponse.next();
  }
  
  // Handle protected routes
  const needsProtection = protectedRoutes.some(route => 
    path.startsWith(route) || path === route
  );

  if (needsProtection) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] 🔒 Unauthenticated access to protected route: ${path}`);
      return createUnauthorizedResponse(request, 'Authentication required', '/auth/login');
    }

    if (!isEmailVerified) {
      console.log(`[MIDDLEWARE] ⚠️ Unverified email accessing protected route: ${path}`);
      // Only redirect to verify if we're not already in a verification flow
      if (!request.headers.get('referer')?.includes('/auth/verify')) {
        return NextResponse.redirect(new URL('/auth/verify', request.url));
      }
      // If coming from verify page, allow access (user might be in verification process)
      console.log(`[MIDDLEWARE] ⚠️ User coming from verify page, allowing temporary access`);
    }

    // Check if session requires 2FA verification
    if (user?.id) {
      const { requires2FA, isVerified } = await checkSessionRequires2FA(user.id);
      if (requires2FA && !isVerified) {
        console.log(`[MIDDLEWARE] 🔒 2FA verification required for: ${path}`);
        return NextResponse.redirect(new URL('/auth/2fa-verify', request.url));
      }
    }

    console.log(`[MIDDLEWARE] ✅ Authorized access to: ${path}`);
    return NextResponse.next();
  }
  
  console.log(`[MIDDLEWARE] ✅ Allowing access to: ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/protected/(.*)',
    '/auth/(.*)',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};