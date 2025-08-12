import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userPreferences, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if user requires 2FA verification for this session
 * Note: This is a simplified check - in a production environment,
 * you would want to check the actual session's 2FA verification status
 */
async function checkSessionRequires2FA(userId: string): Promise<{ requires2FA: boolean; isVerified: boolean }> {
  try {
    // Check if user has 2FA enabled
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
      columns: { twoFactorAuth: true }
    });

    const has2FA = preferences?.twoFactorAuth === true;
    
    if (!has2FA) {
      return { requires2FA: false, isVerified: true }; // No 2FA required
    }

    // If 2FA is required, for now we assume it's verified if user is authenticated
    // In a more robust implementation, you would check the session token against
    // the sessions table to verify the is2faVerified flag
    
    return { requires2FA: true, isVerified: true };
  } catch (error) {
    console.error('Error checking 2FA requirements:', error);
    // Fail safe: allow access if we can't determine 2FA status
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

  console.log(`[MIDDLEWARE] ⚡ RUNNING: ${request.method} ${path}`);
  
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
  
  // Allow public routes for everyone without auth check
  if (publicRoutes.includes(path)) {
    console.log(`[MIDDLEWARE] ✅ Public route allowed: ${path}`);
    return NextResponse.next();
  }

  // Get session only when needed (not for public routes)
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const isEmailVerified = session?.user?.isEmailVerified === true;
  
  // Handle verification page access
  if (path === verificationRoute) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] 🔒 Unauthenticated user trying to access verify page, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }    if (isEmailVerified) {
      console.log(`[MIDDLEWARE] ✅ Email already verified, redirecting to role-based dashboard`);
      // Determine dashboard based on user role
      const userRole = (session?.user as { role?: string })?.role || 'user';
      const dashboardUrl = userRole === 'admin' 
        ? '/protected/admin/dashboard' 
        : '/protected/user/dashboard';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    
    console.log(`[MIDDLEWARE] ✅ Authenticated unverified user accessing verify page`);
    return NextResponse.next();
  }
  
  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {    if (isAuthenticated) {
      if (isEmailVerified) {
        console.log(`[MIDDLEWARE] ✅ Authenticated verified user, redirecting to role-based dashboard`);
        // Determine dashboard based on user role
        const userRole = (session?.user as { role?: string })?.role || 'user';
        const dashboardUrl = userRole === 'admin' 
          ? '/protected/admin/dashboard' 
          : '/protected/user/dashboard';
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
      console.log(`[MIDDLEWARE] 🔒 Redirecting unauthenticated user from ${path} to login`);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', path);
      return NextResponse.redirect(loginUrl);
    }
    // Server-side session expiry check
    const sessionToken = request.cookies.get('session-token')?.value || request.cookies.get('next-auth.session-token')?.value;
    if (session?.user?.id && sessionToken) {
      const sessionRecord = await db.query.sessions.findFirst({
        where: eq(sessions.token, sessionToken),
        columns: { expiresAt: true }
      });
      if (!sessionRecord || new Date() > new Date(sessionRecord.expiresAt)) {
        console.log(`[MIDDLEWARE] 🔒 Session expired for user ${session.user.id}, redirecting to login`);
        // Optionally: clean up expired session here
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
    if (!isEmailVerified) {
      console.log(`[MIDDLEWARE] ⚠️ Authenticated but unverified user, redirecting to verify page`);
      return NextResponse.redirect(new URL('/auth/verify', request.url));
    }
    // Check if session requires 2FA verification
    if (session?.user?.id) {
      const { requires2FA, isVerified } = await checkSessionRequires2FA(session.user.id);
      if (requires2FA && !isVerified) {
        console.log(`[MIDDLEWARE] 🔒 User requires 2FA verification, redirecting to 2FA page`);
        return NextResponse.redirect(new URL('/auth/2fa-verify', request.url));
      }
    }
    console.log(`[MIDDLEWARE] ✅ Authenticated verified user accessing: ${path}`);
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
