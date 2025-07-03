import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  console.log(`[MIDDLEWARE] ⚡ RUNNING: ${request.method} ${path}`);
    // Define protected routes - now everything is under /protected/*
  const protectedRoutes = [
    '/protected'
  ];
  
  // Check if the current path needs protection
  const needsProtection = protectedRoutes.some(route => 
    path.startsWith(route) || path === route
  );
  
  if (needsProtection) {
    // Get session to check authentication
    const session = await auth();
    
    if (!session?.user) {
      console.log(`[MIDDLEWARE] 🔒 Redirecting unauthenticated user from ${path} to login`);
      
      // Create login URL with returnTo parameter
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', path);
      
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`[MIDDLEWARE] ✅ Authenticated user accessing: ${path}`);
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
