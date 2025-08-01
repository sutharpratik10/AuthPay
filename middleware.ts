import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

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
    '/protected/dashboard',
    '/protected/profile',
    '/protected/account',
    '/protected/settings'
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
    }
    
    if (isEmailVerified) {
      console.log(`[MIDDLEWARE] ✅ Email already verified, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/protected/dashboard', request.url));
    }
    
    console.log(`[MIDDLEWARE] ✅ Authenticated unverified user accessing verify page`);
    return NextResponse.next();
  }
  
  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      if (isEmailVerified) {
        console.log(`[MIDDLEWARE] ✅ Authenticated verified user, redirecting to dashboard`);
        return NextResponse.redirect(new URL('/protected/dashboard', request.url));
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
    
    if (!isEmailVerified) {
      console.log(`[MIDDLEWARE] ⚠️ Authenticated but unverified user, redirecting to verify page`);
      return NextResponse.redirect(new URL('/auth/verify', request.url));
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
