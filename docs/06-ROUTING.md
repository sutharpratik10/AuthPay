# Routing System Documentation

## Table of Contents
- [Overview](#overview)
- [Centralized Routing](#centralized-routing)
- [Route Configuration](#route-configuration)
- [Dynamic Routing](#dynamic-routing)
- [Middleware Protection](#middleware-protection)
- [Navigation Components](#navigation-components)
- [Route Utilities](#route-utilities)
- [Best Practices](#best-practices)

## Overview

AuthPay implements a **centralized routing system** that provides consistent navigation, type-safe route definitions, and policy-based access control throughout the application.

### Key Benefits

- ✅ **Single Source of Truth**: All routes defined in one place
- ✅ **Type-Safe**: TypeScript autocomplete for routes
- ✅ **Maintainable**: Easy to update and refactor
- ✅ **Policy-Based**: Automatic access control
- ✅ **Dynamic**: Routes adapt to user permissions
- ✅ **Consistent**: Same navigation patterns everywhere

## Centralized Routing

### Route Configuration

**Location**: `src/routes/routeUtils.ts`

```typescript
/**
 * Centralized route definitions
 * Single source of truth for all application routes
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  
  // Authentication routes
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ERROR: '/auth/error',
    LOGOUT: '/auth/logout',
  },
  
  // Protected routes - Admin
  PROTECTED: {
    ADMIN_DASHBOARD: '/protected/admin/dashboard',
    ADMIN_USERS: '/protected/admin/users',
    ADMIN_ROLES: '/protected/admin/roles',
    ADMIN_POLICIES: '/protected/admin/policies',
    ADMIN_ANALYTICS: '/protected/admin/analytics',
    ADMIN_SETTINGS: '/protected/admin/settings',
    
    // Protected routes - User
    USER_DASHBOARD: '/protected/user/dashboard',
    USER_PROFILE: '/protected/profile',
    USER_ACCOUNT: '/protected/account',
    USER_SETTINGS: '/protected/settings',
    
    // Feature routes
    JOBS: '/protected/jobs',
    JOB_DETAIL: '/protected/jobs/[id]',
    PAYMENTS: '/protected/payments',
    PAYMENT_HISTORY: '/protected/payments/history',
    SUBSCRIPTION: '/protected/subscription',
    
    // Other
    UNAUTHORIZED: '/protected/unauthorized',
  },
  
  // API routes
  API: {
    AUTH: {
      REGISTER: '/api/auth/register',
      VERIFY: '/api/auth/verify',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
    RBAC: {
      ROLES: '/api/rbac/roles',
      POLICIES: '/api/rbac/policies',
      CHECK_PERMISSION: '/api/rbac/check-permission',
      USER_DASHBOARD: '/api/rbac/user/dashboard',
    },
    USER: {
      PROFILE: '/api/user/profile',
      SETTINGS: '/api/user/settings',
    },
    PAYMENTS: {
      CREATE_ORDER: '/api/payments/create-order',
      VERIFY: '/api/payments/verify',
      HISTORY: '/api/payments/history',
    },
    JOBS: {
      LIST: '/api/jobs',
      SEARCH: '/api/jobs/search',
    },
  },
} as const;

/**
 * Helper functions to generate routes with parameters
 */
export const URL = {
  // Auth routes
  login: (callbackUrl?: string) => {
    const url = ROUTES.AUTH.LOGIN;
    return callbackUrl ? `${url}?callbackUrl=${encodeURIComponent(callbackUrl)}` : url;
  },
  
  signup: (callbackUrl?: string) => {
    const url = ROUTES.AUTH.SIGNUP;
    return callbackUrl ? `${url}?callbackUrl=${encodeURIComponent(callbackUrl)}` : url;
  },
  
  verify: (token: string) => `${ROUTES.AUTH.VERIFY}?token=${token}`,
  
  resetPassword: (token: string) => `${ROUTES.AUTH.RESET_PASSWORD}?token=${token}`,
  
  // Admin routes
  adminDashboard: () => ROUTES.PROTECTED.ADMIN_DASHBOARD,
  adminUsers: () => ROUTES.PROTECTED.ADMIN_USERS,
  adminRoles: () => ROUTES.PROTECTED.ADMIN_ROLES,
  
  // User routes
  userDashboard: () => ROUTES.PROTECTED.USER_DASHBOARD,
  profile: () => ROUTES.PROTECTED.USER_PROFILE,
  account: () => ROUTES.PROTECTED.USER_ACCOUNT,
  
  // Dynamic routes
  jobDetail: (id: string) => `/protected/jobs/${id}`,
  userProfile: (userId: string) => `/protected/admin/users/${userId}`,
  roleDetail: (roleId: string) => `/protected/admin/roles/${roleId}`,
  
  // API routes
  apiUserRoles: (userId: string) => `/api/rbac/users/${userId}/roles`,
  apiUserPolicies: (userId: string) => `/api/rbac/users/${userId}/policies`,
  apiRolePolicies: (roleId: string) => `/api/rbac/roles/${roleId}/policies`,
};

/**
 * Export type for type-safe route access
 */
export type RoutePath = typeof ROUTES;
export type RouteKey = keyof typeof ROUTES;
```

### Usage Examples

```typescript
// In components
import { ROUTES, URL } from '@/routes/routeUtils';
import { useRouter } from 'next/navigation';

function LoginButton() {
  const router = useRouter();
  
  return (
    <button onClick={() => router.push(ROUTES.AUTH.LOGIN)}>
      Login
    </button>
  );
}

// With parameters
function JobCard({ jobId }: { jobId: string }) {
  return (
    <Link href={URL.jobDetail(jobId)}>
      View Job
    </Link>
  );
}

// With callback URL
function ProtectedPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <button onClick={() => router.push(URL.login(pathname))}>
      Login to Continue
    </button>
  );
}
```

## Route Configuration

**Location**: `src/routes/routeConfig.ts`

```typescript
/**
 * Route access configuration
 */
export const ROUTE_CONFIG = {
  /**
   * Routes that require authentication
   */
  requiresAuth: [
    '/protected',
    '/api/user',
    '/api/admin',
    '/api/rbac',
    '/api/payments',
    '/api/jobs',
  ],
  
  /**
   * Public routes (no auth required)
   */
  public: [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/verify',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth/register',
    '/api/auth/verify',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ],
  
  /**
   * Routes that authenticated users should not access
   * (redirect to dashboard)
   */
  authRedirects: [
    '/auth/login',
    '/auth/signup',
  ],
  
  /**
   * Default redirect for authenticated users
   */
  defaultAuthRedirect: '/protected/user/dashboard',
  
  /**
   * Default redirect for unauthenticated users
   */
  defaultUnauthRedirect: '/auth/login',
};

/**
 * Check if route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  return ROUTE_CONFIG.requiresAuth.some(route => 
    pathname.startsWith(route)
  );
}

/**
 * Check if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.public.some(route => 
    pathname === route || pathname.startsWith(route)
  );
}

/**
 * Check if authenticated users should be redirected
 */
export function shouldRedirectAuth(pathname: string): boolean {
  return ROUTE_CONFIG.authRedirects.includes(pathname);
}
```

## Dynamic Routing

### Policy-Based Dashboard Routing

**Location**: `src/lib/rbac/routing-utils.ts`

```typescript
import { RBACService } from './rbac-service';
import { ROUTES } from '@/routes/routeUtils';

/**
 * Route to policy mapping
 */
export const ROUTE_POLICIES = {
  [ROUTES.PROTECTED.ADMIN_DASHBOARD]: 'admin:access',
  [ROUTES.PROTECTED.ADMIN_USERS]: 'user:manage',
  [ROUTES.PROTECTED.ADMIN_ROLES]: 'admin:access',
  [ROUTES.PROTECTED.USER_DASHBOARD]: 'user:access',
  [ROUTES.PROTECTED.USER_PROFILE]: 'profile:view',
  [ROUTES.PROTECTED.USER_ACCOUNT]: 'account:manage',
  [ROUTES.PROTECTED.PAYMENTS]: 'payment:view',
  [ROUTES.PROTECTED.SUBSCRIPTION]: 'subscription:view',
} as const;

/**
 * Get appropriate dashboard URL based on user's policies
 */
export async function getDashboardUrl(userId: string): Promise<string> {
  // Check if user has admin access
  const hasAdminAccess = await RBACService.hasPolicy(
    userId,
    'admin:access'
  );
  
  if (hasAdminAccess) {
    return ROUTES.PROTECTED.ADMIN_DASHBOARD;
  }
  
  // Default to user dashboard
  return ROUTES.PROTECTED.USER_DASHBOARD;
}

/**
 * Check if user has admin access
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  return await RBACService.isAdmin(userId);
}

/**
 * Get allowed routes for user
 */
export async function getAllowedRoutes(userId: string): Promise<string[]> {
  const policies = await RBACService.getUserPolicies(userId);
  const allowedRoutes: string[] = [];
  
  for (const [route, policy] of Object.entries(ROUTE_POLICIES)) {
    if (policies.includes(policy) || policies.includes('*:*')) {
      allowedRoutes.push(route);
    }
  }
  
  return allowedRoutes;
}

/**
 * Check if user can access route
 */
export async function canAccessRoute(
  userId: string,
  route: string
): Promise<boolean> {
  const requiredPolicy = ROUTE_POLICIES[route as keyof typeof ROUTE_POLICIES];
  
  if (!requiredPolicy) {
    return true; // No policy required
  }
  
  return await RBACService.hasPolicy(userId, requiredPolicy);
}
```

### API Endpoint: Get Dashboard URL

**Location**: `src/app/api/rbac/user/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { getDashboardUrl, isAdminUser } from '@/lib/rbac/routing-utils';

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const dashboardUrl = await getDashboardUrl(session.user.id);
  const isAdmin = await isAdminUser(session.user.id);
  
  return NextResponse.json({
    success: true,
    dashboardUrl,
    isAdmin,
  });
}
```

### Client-Side Usage

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function redirect() {
      try {
        const response = await fetch('/api/rbac/user/dashboard');
        const data = await response.json();
        
        if (data.success) {
          router.push(data.dashboardUrl);
        }
      } catch (error) {
        console.error('Failed to get dashboard URL:', error);
        router.push('/protected/user/dashboard'); // Fallback
      } finally {
        setLoading(false);
      }
    }
    
    redirect();
  }, [router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return null;
}
```

## Middleware Protection

**Location**: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/config/auth';
import { RBACService } from '@/lib/rbac/rbac-service';
import { requiresAuth, isPublicRoute, shouldRedirectAuth } from '@/routes/routeConfig';

/**
 * Route to required policy mapping
 */
const ROUTE_POLICY_MAP: Record<string, string> = {
  '/protected/admin': 'admin:access',
  '/protected/admin/users': 'user:manage',
  '/protected/admin/roles': 'admin:access',
  '/protected/admin/policies': 'admin:access',
  '/protected/profile': 'profile:view',
  '/protected/account': 'account:manage',
  '/protected/user': 'user:access',
  '/protected/user/dashboard': 'user:access',
  '/protected/payments': 'payment:view',
  '/protected/subscription': 'subscription:view',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/signin') ||
    pathname.startsWith('/api/auth/signout') ||
    pathname.startsWith('/api/auth/session') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Get session
  const session = await auth();
  
  // Handle public routes
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (session && shouldRedirectAuth(pathname)) {
      const dashboardUrl = await getDashboardUrl(session.user.id);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  if (requiresAuth(pathname)) {
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check policy for the route
    const requiredPolicy = getRequiredPolicy(pathname);
    
    if (requiredPolicy) {
      const hasAccess = await RBACService.hasPolicy(
        session.user.id,
        requiredPolicy
      );
      
      if (!hasAccess) {
        return NextResponse.redirect(
          new URL('/protected/unauthorized', request.url)
        );
      }
    }
  }
  
  return NextResponse.next();
}

/**
 * Get required policy for a route
 */
function getRequiredPolicy(pathname: string): string | null {
  // Exact match first
  if (ROUTE_POLICY_MAP[pathname]) {
    return ROUTE_POLICY_MAP[pathname];
  }
  
  // Check prefix matches (longest first)
  const routes = Object.keys(ROUTE_POLICY_MAP).sort((a, b) => b.length - a.length);
  
  for (const route of routes) {
    if (pathname.startsWith(route)) {
      return ROUTE_POLICY_MAP[route];
    }
  }
  
  return null;
}

/**
 * Get dashboard URL based on user policies
 */
async function getDashboardUrl(userId: string): Promise<string> {
  const hasAdminAccess = await RBACService.hasPolicy(userId, 'admin:access');
  return hasAdminAccess 
    ? '/protected/admin/dashboard' 
    : '/protected/user/dashboard';
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

## Navigation Components

### NavigationBar with Dynamic Links

**Location**: `src/components/layout/navigationbar.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ROUTES } from '@/routes/routeUtils';

export function NavigationBar() {
  const { data: session, status } = useSession();
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    async function fetchDashboard() {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/rbac/user/dashboard');
          const data = await response.json();
          
          if (data.success) {
            setDashboardUrl(data.dashboardUrl);
            setIsAdmin(data.isAdmin);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard URL:', error);
        }
      }
    }
    
    fetchDashboard();
  }, [status]);
  
  return (
    <nav>
      <Link href={ROUTES.HOME}>Home</Link>
      
      {status === 'authenticated' ? (
        <>
          {dashboardUrl && (
            <Link href={dashboardUrl}>
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Link>
          )}
          
          <Link href={ROUTES.PROTECTED.USER_PROFILE}>Profile</Link>
          <Link href={ROUTES.PROTECTED.JOBS}>Jobs</Link>
          
          {isAdmin && (
            <>
              <Link href={ROUTES.PROTECTED.ADMIN_USERS}>Users</Link>
              <Link href={ROUTES.PROTECTED.ADMIN_ROLES}>Roles</Link>
            </>
          )}
          
          <button onClick={() => signOut()}>Logout</button>
        </>
      ) : (
        <>
          <Link href={ROUTES.AUTH.LOGIN}>Login</Link>
          <Link href={ROUTES.AUTH.SIGNUP}>Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

### Breadcrumbs

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/routes/routeUtils';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => {
      const path = '/' + array.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      return { path, label };
    });
  
  return (
    <nav aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href={ROUTES.HOME}>Home</Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path}>
            {index === breadcrumbs.length - 1 ? (
              <span>{crumb.label}</span>
            ) : (
              <Link href={crumb.path}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## Route Utilities

### Base Route Handler

**Location**: `src/routes/BaseRouteHandler.ts`

```typescript
import { auth } from '@/config/auth';
import { RBACService } from '@/lib/rbac/rbac-service';

export abstract class BaseRouteHandler {
  /**
   * Get authenticated user or throw
   */
  protected static async getAuthenticatedUser() {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    return session.user;
  }
  
  /**
   * Check if user has required policy
   */
  protected static async requirePolicy(
    userId: string,
    policy: string
  ): Promise<void> {
    const hasAccess = await RBACService.hasPolicy(userId, policy);
    
    if (!hasAccess) {
      throw new Error('Forbidden - Insufficient permissions');
    }
  }
  
  /**
   * Check if user is admin
   */
  protected static async requireAdmin(userId: string): Promise<void> {
    const isAdmin = await RBACService.isAdmin(userId);
    
    if (!isAdmin) {
      throw new Error('Forbidden - Admin access required');
    }
  }
}
```

### User Route Handler

**Location**: `src/routes/UserRouteHandler.ts`

```typescript
import { BaseRouteHandler } from './BaseRouteHandler';
import { getDashboardUrl, getAllowedRoutes } from '@/lib/rbac/routing-utils';

export class UserRouteHandler extends BaseRouteHandler {
  /**
   * Get user's dashboard URL
   */
  static async getDashboardUrl(userId: string): Promise<string> {
    return await getDashboardUrl(userId);
  }
  
  /**
   * Get user's allowed routes
   */
  static async getAllowedRoutes(userId: string): Promise<string[]> {
    return await getAllowedRoutes(userId);
  }
}
```

## Best Practices

### 1. Always Use Route Constants

❌ **Don't**:
```typescript
router.push('/protected/admin/dashboard');
```

✅ **Do**:
```typescript
import { ROUTES } from '@/routes/routeUtils';
router.push(ROUTES.PROTECTED.ADMIN_DASHBOARD);
```

### 2. Use Helper Functions for Dynamic Routes

❌ **Don't**:
```typescript
const url = `/protected/jobs/${jobId}`;
```

✅ **Do**:
```typescript
import { URL } from '@/routes/routeUtils';
const url = URL.jobDetail(jobId);
```

### 3. Check Policies Before Navigation

```typescript
const canAccessAdmin = await RBACService.hasPolicy(userId, 'admin:access');

if (canAccessAdmin) {
  router.push(ROUTES.PROTECTED.ADMIN_DASHBOARD);
} else {
  router.push(ROUTES.PROTECTED.USER_DASHBOARD);
}
```

### 4. Use Middleware for Route Protection

```typescript
// Don't check auth in every component
// Let middleware handle it
```

### 5. Provide Fallbacks

```typescript
const dashboardUrl = await getDashboardUrl(userId).catch(() => 
  ROUTES.PROTECTED.USER_DASHBOARD
);
```

### 6. Use Type-Safe Routes

```typescript
// Routes are type-safe
const route: keyof typeof ROUTES.PROTECTED = 'ADMIN_DASHBOARD';
const url = ROUTES.PROTECTED[route]; // Type-safe
```

### 7. Document Route Policies

```typescript
/**
 * Admin users page
 * @requires admin:access OR user:manage
 */
export default async function AdminUsersPage() {
  // ...
}
```

## Troubleshooting

### Issue: Infinite Redirect Loop

**Cause**: Middleware redirecting to a protected route that also requires auth

**Solution**: Ensure redirect targets are public routes
```typescript
if (!session) {
  // ✅ Redirect to public route
  return NextResponse.redirect('/auth/login');
  
  // ❌ Don't redirect to protected route
  // return NextResponse.redirect('/protected/dashboard');
}
```

### Issue: Dashboard URL Not Loading

**Cause**: API call fails or session not ready

**Solution**: Add error handling and fallback
```typescript
const dashboardUrl = await fetch('/api/rbac/user/dashboard')
  .then(r => r.json())
  .then(d => d.dashboardUrl)
  .catch(() => ROUTES.PROTECTED.USER_DASHBOARD); // Fallback
```

### Issue: Wrong Dashboard for User

**Cause**: Policy check not working correctly

**Solution**: Clear cache and verify policies
```typescript
RBACService.clearUserCache(userId);
const policies = await RBACService.getUserPolicies(userId);
console.log('User policies:', policies);
```

## Next Steps

- Read [03-RBAC.md](./03-RBAC.md) for RBAC system details
- Check [07-COMPONENTS.md](./07-COMPONENTS.md) for navigation components
- Review [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) for auth flow
