import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  console.log(`[MIDDLEWARE] ⚡ RUNNING: ${request.method} ${path}`);
  
  // Simple test: always redirect /protected routes to /auth/login
  if (path.startsWith('/protected')) {
    console.log(`[MIDDLEWARE] 🔒 Redirecting protected route ${path} to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
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
