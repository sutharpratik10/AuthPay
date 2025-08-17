import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userPreferences, sessions, roles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Validate user exists in database and session is valid
 */
type DatabaseUser = {
  id: string;
  email: string;
  isEmailVerified: boolean;
  roleId: string;
  isActive?: boolean;
};

async function validateUserAndSession(userId: string, sessionToken?: string): Promise<{
  userExists: boolean;
  sessionValid: boolean;
  user?: DatabaseUser;
}> {
  try {
    // Check if user exists in database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        id: true, 
        email: true, 
        isEmailVerified: true, 
        roleId: true,
        isActive: true // Add this if you have user status
      }
    });

    if (!user) {
      console.log(`[MIDDLEWARE] ❌ User ${userId} not found in database`);
      return { userExists: false, sessionValid: false };
    }

    // Check if user is active (if you have this field)
    if ('isActive' in user && !user.isActive) {
      console.log(`[MIDDLEWARE] ❌ User ${userId} is deactivated`);
      return { userExists: false, sessionValid: false };
    }

    // Validate session token if provided
    let sessionValid = true;
    if (sessionToken) {
      const sessionRecord = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.token, sessionToken),
          eq(sessions.userId, userId)
        ),
        columns: { expiresAt: true, userId: true }
      });

      if (!sessionRecord) {
        console.log(`[MIDDLEWARE] ❌ Session not found for user ${userId}`);
        sessionValid = false;
      } else if (new Date() > new Date(sessionRecord.expiresAt)) {
        console.log(`[MIDDLEWARE] ❌ Session expired for user ${userId}`);
        sessionValid = false;
        
        // Clean up expired session
        await db.delete(sessions).where(eq(sessions.token, sessionToken));
      }
    }

    return { 
      userExists: true, 
      sessionValid, 
      user: user
        ? {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified ?? false,
            roleId: user.roleId ?? "",
            isActive: user.isActive ?? true
          }
        : undefined
    };

  } catch (error) {
    console.error('[MIDDLEWARE] Error validating user and session:', error);
    return { userExists: false, sessionValid: false };
  }
}

/**
 * Clear authentication cookies and redirect to login
 */
function clearAuthAndRedirect(request: NextRequest, redirectPath: string = '/auth/login') {
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  
  // Clear all possible auth-related cookies
  const cookiesToClear = [
    'next-auth.session-token',
    'session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token'
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.delete(cookieName);
    // Also set expired cookie to ensure clearing
    response.cookies.set(cookieName, '', { 
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
  });

  return response;
}

/**
 * Check if user requires 2FA verification for this session
 */
async function checkSessionRequires2FA(userId: string): Promise<{ requires2FA: boolean; isVerified: boolean }> {
  try {
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
      columns: { twoFactorAuth: true }
    });

    const has2FA = preferences?.twoFactorAuth === true;
    
    if (!has2FA) {
      return { requires2FA: false, isVerified: true };
    }

    return { requires2FA: true, isVerified: true };
  } catch (error) {
    console.error('Error checking 2FA requirements:', error);
    return { requires2FA: false, isVerified: true };
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for static assets and API routes (except auth)
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') && !path.startsWith('/api/auth') ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  console.log(`[MIDDLEWARE] ⚡ RUNNING: ${request.method} ${path}`);
  
  // Define route categories
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ];
  
  const authRoutes = [
    '/auth/login',
    '/auth/signup', 
    '/auth/forgot-password'
  ];
  
  const protectedRoutes = [
    '/protected/profile',
    '/protected/account',
    '/protected/settings',
    '/protected/admin',
    '/protected/user'
  ];
  
  const verificationRoute = '/auth/verify';
  
  // Allow public routes for everyone without auth check
  if (publicRoutes.includes(path)) {
    console.log(`[MIDDLEWARE] ✅ Public route allowed: ${path}`);
    return NextResponse.next();
  }

  // Get session and validate user existence
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const sessionToken = request.cookies.get('session-token')?.value || 
                      request.cookies.get('next-auth.session-token')?.value;

  // If we have a session, validate the user exists in database
  if (isAuthenticated && session?.user?.id) {
    const { userExists, sessionValid, user } = await validateUserAndSession(
      session.user.id, 
      sessionToken
    );

    // If user doesn't exist or session is invalid, clear auth and redirect
    if (!userExists || !sessionValid) {
      console.log(`[MIDDLEWARE] 🚫 User validation failed - clearing auth and redirecting`);
      return clearAuthAndRedirect(request, '/auth/login');
    }

    // Update session user data with fresh database data
    if (user) {
      // You might want to update the session here or let the client handle it
      console.log(`[MIDDLEWARE] ✅ User validation successful: ${user.email}`);
    }
  }

  const isEmailVerified = session?.user?.isEmailVerified === true;
  
  // Helper to get role name from userId
  async function getUserRoleName(userId: string): Promise<string> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { roleId: true }
      });
      if (!user?.roleId) return "user";
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, user.roleId),
        columns: { name: true }
      });
      return role?.name || "user";
    } catch (e) {
      console.error("Error fetching user role:", e);
      return "user";
    }
  }

  // Handle verification page access
  if (path === verificationRoute) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] 🔒 Unauthenticated user trying to access verify page, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (isEmailVerified) {
      const userId = session?.user?.id;
      let userRole = 'user';
      if (userId) {
        userRole = await getUserRoleName(userId);
      }
      if (userRole === 'admin') {
        console.log(`[MIDDLEWARE] ✅ Email verified and user is admin, redirecting to admin dashboard`);
        return NextResponse.redirect(new URL('/protected/admin/dashboard', request.url));
      } else {
        console.log(`[MIDDLEWARE] ✅ Email verified and user is not admin, redirecting to user dashboard`);
        return NextResponse.redirect(new URL('/protected/user/dashboard', request.url));
      }
    }
    console.log(`[MIDDLEWARE] ✅ Authenticated unverified user accessing verify page`);
    return NextResponse.next();
  }
  
  // Handle auth pages (login, signup, forgot-password)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      if (isEmailVerified) {
        console.log(`[MIDDLEWARE] ✅ Authenticated verified user, redirecting to role-based dashboard`);
        const userRole = (session?.user as { role?: string })?.role || 'user';
        const dashboardUrl = userRole === 'admin' 
          ? '/protected/admin/dashboard' 
          : '/protected/user/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      } else {
        console.log(`[MIDDLEWARE] ⚠️ Authenticated unverified user, redirecting to verify`);
        return NextResponse.redirect(new URL('/auth/verify', request.url));
      }
    }
    console.log(`[MIDDLEWARE] ✅ Unauthenticated user accessing auth page: ${path}`);
    return NextResponse.next();
  }
  
  // Handle protected routes
  const needsProtection = protectedRoutes.some(route => 
    path.startsWith(route) || path === route
  );

  if (needsProtection) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] 🔒 Redirecting unauthenticated user from ${path} to login`);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', path);
      return NextResponse.redirect(loginUrl);
    }

    if (!isEmailVerified) {
      console.log(`[MIDDLEWARE] ⚠️ Authenticated but unverified user, redirecting to verify page`);
      return NextResponse.redirect(new URL('/auth/verify', request.url));
    }

    // Check if session requires 2FA verification
    if (session?.user?.id) {
      const { requires2FA, isVerified } = await checkSessionRequires2FA(session.user.id);
      if (requires2FA && !isVerified) {
        console.log(`[MIDDLEWARE] 🔒 User requires 2FA verification, redirecting to 2FA page`);
        return NextResponse.redirect(new URL('/auth/2fa-verify', request.url));
      }
    }

    console.log(`[MIDDLEWARE] ✅ Authenticated verified user accessing: ${path}`);
    return NextResponse.next();
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