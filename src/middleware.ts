import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { enforceCookieConsent } from "@/lib/middleware/cookie-consent";

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
