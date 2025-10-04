import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/server/services/session';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionValidationOptions {
  extendSession?: boolean; // Whether to extend session on activity
  requireVerifiedEmail?: boolean; // Whether to require verified email
  requireActiveUser?: boolean; // Whether to require active user status
}

export interface SessionValidationResult {
  isValid: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    isEmailVerified: boolean;
    isActive?: boolean;
    roleId: string;
  };
  sessionDetails?: {
    sessionId: string;
    expiresAt: Date;
    browserName?: string;
    ipAddress?: string;
    lastActiveAt: Date;
  };
  error?: string;
}

/**
 * Enhanced session validation with comprehensive user data
 */
export async function validateSessionFromRequest(
  request: NextRequest,
  options: SessionValidationOptions = {}
): Promise<SessionValidationResult> {
  const {
    extendSession = true,
    requireVerifiedEmail = true,
    requireActiveUser = true,
  } = options;

  try {
    // Extract session token from different possible sources
    const sessionToken = extractSessionToken(request);
    
    if (!sessionToken) {
      return {
        isValid: false,
        error: 'No session token found',
      };
    }

    // Validate session with the SessionService
    const sessionValidation = await SessionService.validateSession(sessionToken);
    
    if (!sessionValidation.isValid || !sessionValidation.userId) {
      return {
        isValid: false,
        error: 'Invalid or expired session',
      };
    }

    // Fetch complete user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, sessionValidation.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        isActive: true,
        roleId: true,
      }
    });

    if (!user) {
      // User was deleted - invalidate session
      await SessionService.invalidateSession(sessionToken);
      return {
        isValid: false,
        error: 'User not found',
      };
    }

    // Check if user is active
    if (requireActiveUser && 'isActive' in user && !user.isActive) {
      return {
        isValid: false,
        error: 'User account is deactivated',
      };
    }

    // Check if email verification is required
    if (requireVerifiedEmail && !user.isEmailVerified) {
      return {
        isValid: false,
        error: 'Email verification required',
      };
    }

    // Extend session if requested and needed
    if (extendSession) {
      const shouldExtend = await SessionService.shouldExtendSession(sessionToken);
      if (shouldExtend) {
        await SessionService.extendSession(sessionToken);
      }
    }

    return {
      isValid: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isEmailVerified: user.isEmailVerified ?? false,
        isActive: user.isActive ?? true,
        roleId: user.roleId ?? "",
      },
      sessionDetails: sessionValidation.sessionId ? {
        sessionId: sessionValidation.sessionId,
        expiresAt: sessionValidation.expiresAt!,
        browserName: sessionValidation.browserName,
        ipAddress: sessionValidation.ipAddress,
        lastActiveAt: sessionValidation.lastActiveAt!,
      } : undefined,
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      error: 'Session validation failed',
    };
  }
}

/**
 * Extract session token from various sources in the request
 */
function extractSessionToken(request: NextRequest): string | null {
  // Check Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check custom session header
  const sessionHeader = request.headers.get('x-session-token');
  if (sessionHeader) {
    return sessionHeader;
  }

  // Check cookies
  const cookieSessionToken = request.cookies.get('session-token')?.value ||
                            request.cookies.get('next-auth.session-token')?.value ||
                            request.cookies.get('__Secure-next-auth.session-token')?.value;
  
  if (cookieSessionToken) {
    return cookieSessionToken;
  }

  return null;
}

/**
 * Create a standardized unauthorized response
 */
export function createUnauthorizedResponse(
  request: NextRequest,
  error: string = 'Unauthorized',
  redirectTo: string = '/auth/login'
): NextResponse {
  // For API routes, return JSON error
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { 
        error, 
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString(),
      }, 
      { status: 401 }
    );
  }

  // For regular routes, redirect to login
  const loginUrl = new URL(redirectTo, request.url);
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  loginUrl.searchParams.set('error', error);

  const response = NextResponse.redirect(loginUrl);
  
  // Clear potentially invalid session cookies
  clearSessionCookies(response);
  
  return response;
}

/**
 * Clear all session-related cookies
 */
function clearSessionCookies(response: NextResponse): void {
  const cookiesToClear = [
    'session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
  });
}

/**
 * Middleware helper for API routes
 */
export async function withSessionValidation(
  request: NextRequest,
  handler: (request: NextRequest, sessionData: SessionValidationResult) => Promise<NextResponse>,
  options: SessionValidationOptions = {}
): Promise<NextResponse> {
  const sessionValidation = await validateSessionFromRequest(request, options);
  
  if (!sessionValidation.isValid) {
    return createUnauthorizedResponse(
      request, 
      sessionValidation.error || 'Invalid session'
    );
  }
  
  return handler(request, sessionValidation);
}

/**
 * Session activity tracker - call this for any user action
 */
export async function trackSessionActivity(request: NextRequest): Promise<void> {
  try {
    const sessionToken = extractSessionToken(request);
    if (sessionToken) {
      await SessionService.updateSessionActivity(sessionToken);
    }
  } catch (error) {
    console.error('Error tracking session activity:', error);
    // Don't throw - this is non-critical
  }
}
