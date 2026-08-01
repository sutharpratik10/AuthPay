import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/config/auth.config";
import { enforceCookieConsent } from "@/lib/middleware/cookie-consent";
import { rscProtectionMiddleware } from "@/lib/middleware/rsc-protection";
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils";

/**
 * Middleware uses a SEPARATE, lightweight NextAuth instance built from
 * auth.config.ts (edge-safe). This avoids pulling in Node.js-only modules
 * (fs, path, crypto, drizzle/db) that the Edge Runtime cannot execute.
 *
 * The full auth instance (with DB callbacks, Credentials provider, etc.)
 * lives in auth.ts and is only used by API routes running in Node.js.
 */
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  // 1. Run RSC Protection first (blocks malicious payloads)
  const rscResponse = await rscProtectionMiddleware(req);
  if (rscResponse) {
    return rscResponse;
  }

  const url = req.nextUrl.pathname;

  // 2. Enforce authentication for protected routes at the edge
  if (url.startsWith('/protected') && !req.auth?.user) {
    const loginUrl = new URL(ROUTE_POLICIES.AUTH_LOGIN.path, req.url);
    loginUrl.searchParams.set('callbackUrl', url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Prevent authenticated users from accessing auth pages (login/signup)
  if (url.startsWith('/auth') && req.auth?.user) {
    // Exclude /auth/verify or other specific auth routes if needed, 
    // but usually if you're logged in you shouldn't be at /auth/login or /auth/signup
    if (url.startsWith('/auth/login') || url.startsWith('/auth/signup')) {
      const dashboardUrl = new URL('/protected', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // 3. Create the base response using NextResponse.next()
  const response = NextResponse.next();

  // 4. Enforce cookie consent on all responses
  const consentResponse = enforceCookieConsent(req, response);

  return consentResponse;
});

// Matcher to define on which paths the middleware runs
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api/auth (NextAuth API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
