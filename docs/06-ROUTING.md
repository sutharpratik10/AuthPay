# Routing System Documentation

## Table of Contents
- [Overview](#overview)
- [Centralized Routing](#centralized-routing)
- [Route Configuration](#route-configuration)
- [Dynamic Routing](#dynamic-routing)
- [Middleware Protection](#middleware-protection)
- [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
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
- ✅ **Rate Limited**: DDoS protection on all API routes
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

### Rate Limiting & DDoS Protection

> 📘 **Complete Guide**: See [09-DDOS-PROTECTION.md](./09-DDOS-PROTECTION.md) for comprehensive DDoS protection documentation.

All API routes in AuthPay are protected with token-bucket rate limiting to prevent abuse, brute force attacks, and DDoS attempts. The rate limiting system integrates seamlessly with the routing and middleware architecture.

#### Rate Limiting Architecture

**Core Components:**

1. **Rate Limiter** (`src/lib/utils/rate-limiter.ts`)
   - Token bucket algorithm implementation
   - In-memory storage (development)
   - Redis-compatible interface (production)
   - Configurable tiers with different limits

2. **Middleware Wrappers** (`src/lib/middleware/rate-limit.ts`)
   - Pre-configured limiters: `auth`, `sensitive`, `api`, `readOnly`
   - Automatic header injection
   - Client identification (IP/user-based)
   - Error response formatting

3. **Route Protection** (Applied per-route)
   - Wraps Next.js route handlers
   - Returns 429 when limit exceeded
   - Includes retry-after timing

#### Rate Limit Tiers for Routes

| Tier | Limit | Window | Routes | Purpose |
|------|-------|--------|--------|---------|
| **🔴 auth** | 5 req | 15 min | `/api/auth/*` | Brute force prevention |
| **🟠 sensitive** | 3 req | 1 hour | Delete account, password changes | Critical operation protection |
| **🟡 api** | 60 req | 1 min | `/api/user/*`, `/api/rbac/*`, `/api/payments/*` | Standard protection |
| **🟢 readOnly** | 100 req | 1 min | `/api/subscription-plans` | Public access |

#### Implementation in Routes

**Standard API Route:**

```typescript
// src/app/api/user/data/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get user data
 * Rate Limited: 60 requests per minute (standard API tier)
 */
export const GET = rateLimiters.api(async (req: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ success: true, data: userData });
});
```

**Authentication Route (Strict):**

```typescript
// src/app/api/auth/login/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * User login
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) => {
  // Login logic
  return NextResponse.json({ success: true, token });
});
```

**Sensitive Operation (Very Strict):**

```typescript
// src/app/api/user/delete-account/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Delete user account
 * Rate Limited: 3 requests per hour (VERY STRICT - critical operation)
 */
export const DELETE = rateLimiters.sensitive(async (req: NextRequest) => {
  // Account deletion logic
  return NextResponse.json({ success: true });
});
```

**With `withApiHandler` Wrapper:**

```typescript
// src/app/api/rbac/check-permission/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { withApiHandler } from '@/lib/api/helpers';

/**
 * Check user permissions
 * Rate Limited: 60 requests per minute (standard API tier)
 */
export const POST = rateLimiters.api(
  withApiHandler(
    async (request: NextRequest, { user }) => {
      // Permission check logic
      return { hasPermission: true };
    },
    { requireAuth: true }
  )
);
```

#### Client Identification Strategy

The rate limiter identifies clients using a multi-layered approach:

```typescript
// src/lib/middleware/rate-limit.ts
function getClientIdentifier(req: NextRequest): string {
  // 1. Authenticated user (most accurate)
  const session = await auth();
  if (session?.user?.id) {
    return `user:${session.user.id}`;
  }
  
  // 2. API key (for API clients)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  // 3. IP address (fallback)
  // Handle proxies and load balancers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || 
             realIp || 
             req.ip || 
             'unknown';
  
  return `ip:${ip}`;
}
```

**Benefits:**
- ✅ Per-user limits for authenticated requests
- ✅ Per-IP limits for anonymous requests
- ✅ API key support for programmatic access
- ✅ Proxy-aware IP detection

#### Rate Limit Response Headers

All protected routes return these headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60              # Maximum requests allowed
X-RateLimit-Remaining: 45           # Requests remaining in window
X-RateLimit-Reset: 2025-11-23T...   # When limit resets (ISO 8601)
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45                     # Seconds until reset
Content-Type: application/json

{
  "error": "Too many requests, please try again later.",
  "retryAfter": 45
}
```

#### Integration with RBAC Middleware

Rate limiting works alongside RBAC policy checks:

```typescript
// Execution order:
// 1. Rate limiter checks limit
// 2. If allowed, passes to handler
// 3. Handler checks RBAC policies
// 4. Handler executes business logic

export const POST = rateLimiters.api(  // 1. Rate limit check
  withApiHandler(                       // 2. Wrapper
    async (request, { user }) => {      // 3. Handler with RBAC check
      // Business logic here              4. Execution
    },
    { requireAuth: true }
  )
);
```

**Flow Diagram:**

```
Request
  ↓
Rate Limiter
  ├─ Exceeded? → 429 Response
  ↓
Authentication Check (if required)
  ├─ Not authenticated? → 401 Response
  ↓
RBAC Policy Check
  ├─ No permission? → 403 Response
  ↓
Business Logic
  ↓
Response
```

#### Testing Rate Limits on Routes

**Single Route Test:**

```bash
# Test authentication endpoint (should block after 5 requests)
node scripts/test-rate-limit.js /api/auth/check-email 10

# Expected output:
# ✓ Request 1: HTTP 200
# ✓ Request 2: HTTP 200
# ✓ Request 3: HTTP 200
# ✓ Request 4: HTTP 200
# ✓ Request 5: HTTP 200
# ✗ Request 6: HTTP 429 (Rate limit exceeded)
# ✗ Request 7: HTTP 429 (Rate limit exceeded)
```

**Manual Testing:**

```bash
# Test with curl
for i in {1..10}; do 
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/check-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -i | grep -E "HTTP|X-RateLimit|Retry-After"
  sleep 1
done
```

**Load Testing All Routes:**

```bash
# Medium load test (50 connections, 30 seconds)
node scripts/load-test.js medium

# Tests these critical routes:
# - /api/auth/check-email (auth tier)
# - /api/user/data (api tier)
# - /api/subscription-plans (readOnly tier)
# - /api/rbac/check-permission (api tier)
```

#### Production Deployment Considerations

**1. Use Redis for Multi-Instance Deployments**

For production with multiple server instances, replace in-memory storage with Redis:

```typescript
// src/lib/utils/rate-limiter.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class RateLimiter {
  private async getCount(key: string): Promise<number> {
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  }
  
  private async incrementCount(key: string, ttl: number): Promise<number> {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }
    return count;
  }
  
  async checkLimit(
    clientId: string,
    tier: RateLimitTier
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const config = RATE_LIMIT_CONFIGS[tier];
    const key = `rate-limit:${tier}:${clientId}`;
    
    const count = await this.incrementCount(
      key,
      Math.floor(config.windowMs / 1000)
    );
    
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = new Date(Date.now() + config.windowMs);
    
    return { allowed, remaining, resetAt };
  }
}
```

**2. CDN/Proxy Integration**

For additional protection, use CDN-level rate limiting:

- **Cloudflare Rate Limiting**: Blocks requests before they hit your server
- **AWS CloudFront**: Custom rate limiting with Lambda@Edge
- **Fastly**: Edge rate limiting with VCL

**3. Monitoring and Alerts**

Add logging for rate limit violations:

```typescript
// src/lib/middleware/rate-limit.ts
if (!result.allowed) {
  console.warn('[Rate Limit] Violation detected', {
    clientId,
    tier,
    path: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Send to monitoring system
  // await sendToDatadog({ metric: 'rate_limit.violation', tags: { tier, path } });
  // await sendToNewRelic({ eventType: 'RateLimitViolation', tier, path });
}
```

**4. Graceful Degradation**

Implement fallback behavior if rate limiter fails:

```typescript
try {
  const result = await rateLimiter.checkLimit(clientId, tier);
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429 }
    );
  }
} catch (error) {
  console.error('[Rate Limit] Error:', error);
  
  // Choose strategy:
  // Option A: Fail open (allow request) - prioritize availability
  // return handler(req);
  
  // Option B: Fail closed (block request) - prioritize security
  return new NextResponse(
    JSON.stringify({ error: 'Service temporarily unavailable' }),
    { status: 503 }
  );
}
```

#### Route-Specific Customization

**Custom Rate Limit for Specific Route:**

```typescript
// src/app/api/special/endpoint/route.ts
import { createRateLimiter } from '@/lib/middleware/rate-limit';

// Create custom limiter for this route
const customLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 20,           // 20 requests
  message: 'Special endpoint rate limit exceeded',
});

export const POST = customLimiter(async (req: NextRequest) => {
  // Handler logic
});
```

**Allowlist for Trusted IPs:**

```typescript
// src/lib/middleware/rate-limit.ts
const TRUSTED_IPS = new Set([
  '192.168.1.100',     // Office IP
  '10.0.0.50',         // CI/CD server
  // Add trusted IPs
]);

function shouldBypassRateLimit(clientId: string): boolean {
  // Check if client is in allowlist
  if (clientId.startsWith('ip:')) {
    const ip = clientId.substring(3);
    return TRUSTED_IPS.has(ip);
  }
  
  // Check for admin users
  if (clientId.startsWith('user:')) {
    const userId = clientId.substring(5);
    // return await isAdminUser(userId);
  }
  
  return false;
}
```

**Dynamic Limits Based on User Tier:**

```typescript
// src/lib/middleware/rate-limit.ts
async function getRateLimitForUser(userId: string): Promise<RateLimitConfig> {
  const subscription = await getUserSubscription(userId);
  
  switch (subscription.tier) {
    case 'premium':
      return { windowMs: 60000, maxRequests: 200 }; // Higher limit
    case 'enterprise':
      return { windowMs: 60000, maxRequests: 1000 }; // Much higher
    default:
      return RATE_LIMIT_CONFIGS.api; // Standard limit
  }
}
```

#### Best Practices for Route Protection

**1. Always protect authentication endpoints:**

```typescript
// ❌ DON'T: Leave auth endpoints unprotected
export const POST = async (req: NextRequest) => {
  // Vulnerable to brute force attacks
};

// ✅ DO: Apply strict auth tier
export const POST = rateLimiters.auth(async (req: NextRequest) => {
  // Protected against brute force
});
```

**2. Choose appropriate tier for each route:**

```typescript
// ❌ DON'T: Use auth tier for read operations
export const GET = rateLimiters.auth(async (req) => {
  return NextResponse.json({ publicData });
});

// ✅ DO: Use readOnly tier for public reads
export const GET = rateLimiters.readOnly(async (req) => {
  return NextResponse.json({ publicData });
});
```

**3. Document rate limits in route comments:**

```typescript
/**
 * Update user profile
 * 
 * @route POST /api/user/profile
 * @access Private
 * @rateLimit 60 requests per minute (api tier)
 * @requires Authentication
 * @requires Permission: user:update
 */
export const POST = rateLimiters.api(
  withApiHandler(async (req, { user }) => {
    // Handler logic
  }, { requireAuth: true })
);
```

**4. Handle rate limit errors gracefully in client:**

```typescript
// Client-side error handling
async function makeApiRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    
    throw new RateLimitError(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      parseInt(retryAfter || '60')
    );
  }
  
  return response.json();
}

// Usage with retry logic
try {
  const data = await makeApiRequest('/api/user/data', { method: 'GET' });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Show user-friendly message
    toast.error(`Too many requests. Please wait ${error.retryAfter} seconds.`);
    
    // Optional: Auto-retry after delay
    setTimeout(() => {
      makeApiRequest('/api/user/data', { method: 'GET' });
    }, error.retryAfter * 1000);
  }
}
```

#### Troubleshooting

**Issue: Rate limits not working**

1. Verify middleware is applied:
   ```typescript
   // Check route file
   export const POST = rateLimiters.auth(handler); // ✅
   export const POST = handler; // ❌ Missing rate limiter
   ```

2. Check tier configuration:
   ```typescript
   // Verify in src/lib/utils/rate-limiter.ts
   console.log(RATE_LIMIT_CONFIGS.auth);
   // Should show: { windowMs: 900000, maxRequests: 5, ... }
   ```

3. Verify client identification:
   ```typescript
   // Add logging to see client IDs
   console.log('Rate limit client:', getClientIdentifier(req));
   ```

**Issue: Legitimate users getting blocked**

1. Increase limits for specific routes
2. Implement user-based limiting instead of IP-based
3. Add allowlist for trusted IPs/users
4. Consider implementing CAPTCHA after N failures instead of hard blocking

**Issue: Rate limits not syncing across instances**

1. Verify Redis connection:
   ```bash
   redis-cli ping
   ```

2. Check Redis keys:
   ```bash
   redis-cli keys "rate-limit:*"
   ```

3. Monitor Redis logs for errors

For complete details on testing, monitoring, and advanced configurations, see [09-DDOS-PROTECTION.md](./09-DDOS-PROTECTION.md) and [05-API-ROUTES.md](./05-API-ROUTES.md#rate-limiting--ddos-protection).

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
