import { NextRequest, NextResponse } from "next/server";
import { auth } from "./src/auth";
import { Session } from "next-auth";

export async function middleware(request: NextRequest) {
  const session = await auth() as Session | null;
  
  // Path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/forgot-password"];
  
  // Auth routes that require authentication but don't require email verification
  const authRoutes = ["/auth/verify", "/auth/verify-request"];
  
  // Protected routes that require both authentication and email verification
  const isProtectedRoute = path.startsWith("/protected");
  
  // Check if user is authenticated
  const isAuthenticated = !!session;
  
  // Check if user's email is verified
  const isEmailVerified = !!session?.user?.isEmailVerified;

  // Allow access to public routes
  if (publicRoutes.includes(path)) {
    // If authenticated user tries to access login/signup pages, redirect to dashboard
    if (isAuthenticated && isEmailVerified) {
      return NextResponse.redirect(new URL("/protected/dashboard", request.url));
    }
    return NextResponse.next();
  }
  
  // Handle auth routes (routes that need auth but not email verification)
  if (authRoutes.includes(path)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (isEmailVerified) {
      return NextResponse.redirect(new URL("/protected/dashboard", request.url));
    }
    return NextResponse.next();
  }
  
  // Handle protected routes
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-request", request.url));
    }
    
    return NextResponse.next();
  }
  
  // Default: allow access
  return NextResponse.next();
}

// Configure the paths the middleware should run on and runtime
export const config = {
  runtime: 'nodejs',
  matcher: [
    // Routes that require protection
    "/protected/:path*",
    
    // Auth routes
    "/auth/:path*",
    
    // Exclude API routes, static files, favicon, etc.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
