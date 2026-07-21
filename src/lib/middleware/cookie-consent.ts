/**
 * Cookie Consent Middleware Utility
 * 
 * Reads the server-side `cookie_consent` cookie and enforces consent
 * by stripping non-consented cookies from requests/responses.
 * 
 * Usage: Call `enforceCookieConsent(request, response)` from Next.js middleware
 * or import `getServerConsent(request)` in API routes / server components.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ServerCookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CURRENT_CONSENT_VERSION = '1.0';

// Cookies belonging to each category — extend as you add new integrations
const ANALYTICS_COOKIES = ['_ga', '_gid', '_gat', 'analytics_consent'];
const MARKETING_COOKIES = ['_fbp', '_fbc', 'marketing_consent'];
const PREFERENCE_COOKIES = ['pref_theme', 'pref_language', 'pref_sidebar_state', 'preferences_consent'];

// Essential cookies that must never be stripped
const ESSENTIAL_COOKIES = new Set([
  'next-auth.session-token',
  'next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.session-token',
  '__Secure-next-auth.csrf-token',
  '__Secure-next-auth.callback-url',
  '__Host-next-auth.csrf-token',
  CONSENT_COOKIE_NAME,
  'essential_consent',
]);

/**
 * Read the consent state from the server-side cookie.
 * Returns null if no consent has been given yet.
 */
export function getServerConsent(request: NextRequest): ServerCookieConsent | null {
  try {
    const consentCookie = request.cookies.get(CONSENT_COOKIE_NAME);
    if (!consentCookie?.value) return null;

    return JSON.parse(consentCookie.value) as ServerCookieConsent;
  } catch {
    return null;
  }
}

/**
 * Check if the consent version requires the user to re-consent.
 * Returns true if consent is outdated and the banner should be re-shown.
 */
export function isConsentOutdated(consent: ServerCookieConsent): boolean {
  return consent.version !== CURRENT_CONSENT_VERSION;
}

/**
 * Check if a specific cookie category is consented to.
 * Falls back to false if no consent is found.
 */
export function hasServerConsent(
  request: NextRequest,
  category: keyof Omit<ServerCookieConsent, 'timestamp' | 'version'>
): boolean {
  const consent = getServerConsent(request);
  if (!consent) return category === 'essential'; // Essential is always allowed
  return consent[category] ?? false;
}

/**
 * Enforce cookie consent by stripping non-consented cookies from the response.
 * Call this from your Next.js middleware.
 * 
 * @param request - The incoming request
 * @param response - The response to modify
 * @returns The modified response with non-consented cookies stripped
 */
export function enforceCookieConsent(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const consent = getServerConsent(request);

  // If no consent given, strip all non-essential cookies
  if (!consent) {
    stripCookiesByCategory(response, ANALYTICS_COOKIES);
    stripCookiesByCategory(response, MARKETING_COOKIES);
    stripCookiesByCategory(response, PREFERENCE_COOKIES);
    return response;
  }

  // Strip cookies for denied categories
  if (!consent.analytics) {
    stripCookiesByCategory(response, ANALYTICS_COOKIES);
  }

  if (!consent.marketing) {
    stripCookiesByCategory(response, MARKETING_COOKIES);
  }

  if (!consent.preferences) {
    stripCookiesByCategory(response, PREFERENCE_COOKIES);
  }

  return response;
}

/**
 * Strip cookies matching the given names by setting them to expire immediately.
 */
function stripCookiesByCategory(response: NextResponse, cookieNames: string[]): void {
  for (const name of cookieNames) {
    // Don't strip essential cookies
    if (ESSENTIAL_COOKIES.has(name)) continue;

    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
    });
  }
}

/**
 * Get a summary of current consent for logging/debugging.
 */
export function getConsentSummary(request: NextRequest): string {
  const consent = getServerConsent(request);
  if (!consent) return 'No consent given';

  return [
    `essential=${consent.essential}`,
    `analytics=${consent.analytics}`,
    `marketing=${consent.marketing}`,
    `preferences=${consent.preferences}`,
    `version=${consent.version}`,
  ].join(', ');
}
