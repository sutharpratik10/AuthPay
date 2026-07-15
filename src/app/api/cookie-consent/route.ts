import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import { userPreferences } from "@/server/db/schema/auth";/**
 * Cookie Consent API Route
 * 
 * Mirrors the client-side localStorage consent to a server-side HttpOnly cookie
 * so that middleware, API routes, and SSR can read consent state.
 * 
 * Also optionally persists consent to the user's DB preferences when authenticated.
 */

interface CookieConsentPayload {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: string;
}

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * GET /api/cookie-consent
 * Returns the current consent state from the server-side cookie.
 * Used for SSR hydration when localStorage is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const consentCookie = request.cookies.get(COOKIE_NAME);

    if (!consentCookie?.value) {
      return NextResponse.json({ consent: null }, { status: 200 });
    }

    const consent: CookieConsentPayload = JSON.parse(consentCookie.value);
    return NextResponse.json({ consent }, { status: 200 });
  } catch (error) {
    console.error('[Cookie Consent API] Error reading consent:', error);
    return NextResponse.json({ consent: null }, { status: 200 });
  }
}

/**
 * POST /api/cookie-consent
 * Saves consent preferences to a server-side HttpOnly cookie.
 * Body: { essential, analytics, marketing, preferences, timestamp, version }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CookieConsentPayload = await request.json();

    // Validate required fields
    if (typeof body.essential !== 'boolean' ||
        typeof body.analytics !== 'boolean' ||
        typeof body.marketing !== 'boolean' ||
        typeof body.preferences !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid consent payload. All categories must be boolean.' },
        { status: 400 }
      );
    }

    // Essential cookies are always required
    const consentData: CookieConsentPayload = {
      essential: true, // Always true
      analytics: body.analytics,
      marketing: body.marketing,
      preferences: body.preferences,
      timestamp: body.timestamp || new Date().toISOString(),
      version: body.version || '1.0',
    };

    const response = NextResponse.json(
      { success: true, consent: consentData },
      { status: 200 }
    );

    // Sync to DB if authenticated
    try {
      const session = await auth();
      if (session?.user?.id) {
        await db.insert(userPreferences)
          .values({
            userId: session.user.id,
            cookieConsent: consentData,
          })
          .onConflictDoUpdate({
            target: userPreferences.userId,
            set: { cookieConsent: consentData }
          });
      }
    } catch (dbError) {
      console.error('[Cookie Consent API] DB Sync error:', dbError);
      // Non-critical, continue with cookie setting
    }

    // Set the server-side consent cookie
    response.cookies.set(COOKIE_NAME, JSON.stringify(consentData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    // If analytics consent is denied, clear analytics cookies
    if (!consentData.analytics) {
      const analyticsCookies = ['_ga', '_gid', '_gat', 'analytics_consent'];
      analyticsCookies.forEach(name => {
        response.cookies.set(name, '', { maxAge: 0, path: '/' });
      });
    }

    // If marketing consent is denied, clear marketing cookies
    if (!consentData.marketing) {
      const marketingCookies = ['_fbp', '_fbc', 'marketing_consent'];
      marketingCookies.forEach(name => {
        response.cookies.set(name, '', { maxAge: 0, path: '/' });
      });
    }

    // If preferences consent is denied, clear preference cookies
    if (!consentData.preferences) {
      const prefCookies = ['pref_theme', 'pref_language', 'pref_sidebar_state', 'preferences_consent'];
      prefCookies.forEach(name => {
        response.cookies.set(name, '', { maxAge: 0, path: '/' });
      });
    }

    return response;
  } catch (error) {
    console.error('[Cookie Consent API] Error saving consent:', error);
    return NextResponse.json(
      { error: 'Failed to save cookie consent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cookie-consent
 * Withdraws consent by clearing the consent cookie and all non-essential cookies.
 */
export async function DELETE() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Consent withdrawn' },
      { status: 200 }
    );

    // Clear the consent cookie
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });

    // Clear all non-essential cookies
    const cookiesToClear = [
      '_ga', '_gid', '_gat',
      '_fbp', '_fbc',
      'analytics_consent', 'marketing_consent', 'preferences_consent',
      'pref_theme', 'pref_language', 'pref_sidebar_state',
    ];

    cookiesToClear.forEach(name => {
      response.cookies.set(name, '', { maxAge: 0, path: '/' });
    });

    return response;
  } catch (error) {
    console.error('[Cookie Consent API] Error withdrawing consent:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent' },
      { status: 500 }
    );
  }
}
