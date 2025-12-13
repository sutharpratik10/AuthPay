/**
 * Next.js Middleware
 * 
 * This middleware runs on every request before it reaches the route handler.
 * 
 * Security Features:
 * - CVE-2025-55182 RSC Exploitation Protection (CRITICAL)
 * - Additional security headers
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { rscProtectionMiddleware } from '@/lib/middleware/rsc-protection';

export async function middleware(request: NextRequest) {
  // ============================================
  // CVE-2025-55182 Protection (MUST BE FIRST)
  // ============================================
  // Check for RSC deserialization exploitation attempts
  // This MUST run before any other middleware logic
  try {
    const rscProtectionResponse = await rscProtectionMiddleware(request);
    if (rscProtectionResponse) {
      return rscProtectionResponse;
    }
  } catch (error) {
    // Log error but continue - don't let protection errors cause DoS
    console.error('[MIDDLEWARE] RSC protection error:', error);
  }

  // ============================================
  // Continue with normal request processing
  // ============================================
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
