import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/config/auth.config";
import { enforceCookieConsent } from "@/lib/middleware/cookie-consent";

/**
 * Middleware uses a SEPARATE, lightweight NextAuth instance built from
 * auth.config.ts (edge-safe). This avoids pulling in Node.js-only modules
 * (fs, path, crypto, drizzle/db) that the Edge Runtime cannot execute.
 *
 * The full auth instance (with DB callbacks, Credentials provider, etc.)
 * lives in auth.ts and is only used by API routes running in Node.js.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl.pathname;

  // Create the base response using NextResponse.next() 
  // Auth.js middleware will handle the auth logic internally.
  const response = NextResponse.next();

  // Enforce cookie consent on all responses
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
