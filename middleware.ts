import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
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
    return NextResponse.next();
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
    return NextResponse.next();
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
    if (token.exp < currentTimestamp) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ⚠️ JWT token expired at ${new Date(token.exp * 1000).toISOString()}`);
      }
      // Token has expired - redirect to login with session expired message
      if (needsProtection || authRoutes.includes(path)) {
        return NextResponse.redirect(new URL('/auth/login?error=SessionExpired', request.url));
      }
    }
  } else if (token && !token.exp) {
    // SECURITY: Token without expiration claim - this is a legacy/invalid token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ⚠️ JWT token missing expiration claim - forcing re-login`);
    }
    if (needsProtection || authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/auth/login?error=SecurityUpdate', request.url));
    }
  }
  
  const user = token ? {
    id: token.sub as string,
    email: token.email as string,
    isEmailVerified: token.isEmailVerified as boolean,
    roleId: token.roleId as string,
  } : null;
  const isEmailVerified = user?.isEmailVerified === true;
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] 🔒 Unauthenticated user trying to access verify page`);
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (isEmailVerified) {
      const dashboardUrl = getDashboardUrl();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ✅ Email verified, redirecting to dashboard`);
      }
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Authenticated unverified user accessing verify page`);
    }
    return NextResponse.next();
  }
  
  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      if (isEmailVerified) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIDDLEWARE] ✅ Authenticated verified user, redirecting to dashboard`);
        }
        const dashboardUrl = getDashboardUrl();
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIDDLEWARE] ⚠️ Authenticated unverified user, redirecting to verify`);
        }
        return NextResponse.redirect(new URL('/auth/verify', request.url));
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Unauthenticated user accessing auth page: ${path}`);
    }
    return NextResponse.next();
  }
  
  // Handle protected routes
  // needsProtection already declared above for expiration check

  if (needsProtection) {
    if (!isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] 🔒 Unauthenticated access to protected route: ${path}`);
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!isEmailVerified) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ⚠️ Unverified email accessing protected route: ${path}`);
      }
      // Only redirect to verify if we're not already in a verification flow
      if (!request.headers.get('referer')?.includes('/auth/verify')) {
        return NextResponse.redirect(new URL('/auth/verify', request.url));
      }
      // If coming from verify page, allow access (user might be in verification process)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] ⚠️ User coming from verify page, allowing temporary access`);
      }
    }

    // Note: 2FA verification is now handled by the protected pages themselves
    // This reduces database queries in middleware and improves performance

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ✅ Authorized access to: ${path}`);
    }
    return NextResponse.next();
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIDDLEWARE] ✅ Allowing access to: ${path}`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/protected/(.*)',
    '/auth/(.*)',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};