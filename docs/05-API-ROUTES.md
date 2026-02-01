# API Routes Documentation

## Table of Contents
- [Overview](#overview)
- [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
- [API Structure](#api-structure)
- [Authentication APIs](#authentication-apis)
- [RBAC APIs](#rbac-apis)
- [User APIs](#user-apis)
- [Payment APIs](#payment-apis)
- [Job APIs](#job-apis)
- [Response Patterns](#response-patterns)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

BookEase provides a comprehensive REST API built with Next.js API Routes. All APIs follow consistent patterns for authentication, authorization, error handling, and response formatting.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

### API Characteristics

- ✅ **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Protected**: RBAC-based authorization
- ✅ **Rate Limited**: DDoS protection on all routes
- ✅ **Consistent**: Standardized response patterns
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Validation**: Request/response validation with Zod

## Rate Limiting & DDoS Protection

> 📘 **Complete Guide**: See [09-DDOS-PROTECTION.md](./09-DDOS-PROTECTION.md) for comprehensive DDoS protection documentation.

All API routes are protected with token-bucket rate limiting to prevent abuse, brute force attacks, and DDoS attempts. Rate limits vary by endpoint sensitivity.

### Rate Limit Tiers

| Tier | Limit | Window | Use Case | Routes |
|------|-------|--------|----------|--------|
| **🔴 auth** | 5 requests | 15 minutes | Authentication, prevents brute force | `/api/auth/*` login, password reset, 2FA |
| **🟠 sensitive** | 3 requests | 1 hour | Critical operations | Account deletion, password changes |
| **🟡 api** | 60 requests | 1 minute | Standard API operations | Most `/api/*` endpoints |
| **🟢 readOnly** | 100 requests | 1 minute | Public read endpoints | `/api/subscription-plans` |

### Rate Limit Response Headers

All responses include these headers:

```http
X-RateLimit-Limit: 60              # Maximum requests allowed in window
X-RateLimit-Remaining: 45           # Requests remaining in current window
X-RateLimit-Reset: 2025-11-23T...   # ISO timestamp when limit resets
```

When rate limit is exceeded (HTTP 429):

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45                     # Seconds to wait before retrying
Content-Type: application/json

{
  "error": "Too many requests, please try again later.",
  "retryAfter": 45
}
```

### Implementation Examples

#### Standard Route Handler

```typescript
// src/app/api/user/profile/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get user profile
 * Rate Limited: 60 requests per minute (standard API tier)
 */
export const GET = rateLimiters.api(async (req: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ success: true, data: profile });
});
```

#### Authentication Route (Strict Limiting)

```typescript
// src/app/api/auth/login/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * User login
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) => {
  // Login logic
  return NextResponse.json({ success: true });
});
```

#### Sensitive Operations (Very Strict)

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

#### With `withApiHandler` Wrapper

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

### Route-Specific Rate Limits

#### 🔴 AUTH Tier (5 req/15min) - Brute Force Prevention

**Authentication & Security Routes:**
- `POST /api/auth/check-email` - Email validation
- `POST /api/auth/validate-credentials` - Credential verification
- `POST /api/auth/validate-password` - Password strength check
- `POST /api/auth/verify-password` - Password verification
- `POST /api/auth/forgot-password` - Password reset initiation
- `POST /api/auth/reset-password` - Password reset completion
- `POST /api/auth/send-otp` - OTP generation
- `POST /api/auth/verify-2fa` - 2FA verification
- `POST /api/auth/resend-2fa` - 2FA resend
- `POST /api/auth/check-2fa-status` - 2FA status check
- `POST /api/auth/verify-reset-code` - Reset code verification
- `POST /api/auth/check-suspension` - Account suspension check
- `POST /api/auth/generate-temp-token` - Temporary token generation
- `POST /api/auth/validate-user` - User validation
- `POST /api/auth/track-session` - Session tracking
- `POST /api/auth/validate-current-password` - Current password validation

#### 🟠 SENSITIVE Tier (3 req/hour) - Critical Operations

**Account & Security Changes:**
- `DELETE /api/user/delete-account` - Permanent account deletion
- `POST /api/user/set-password` - Set new password
- `POST /api/auth/change-password` - Change existing password
- `POST /api/auth/force-logout` - Force logout all sessions

#### 🟡 API Tier (60 req/min) - Standard Operations

**User Management:**
- `GET /api/user/data` - User profile data
- `GET /api/user/admin-status` - Admin status check
- `GET /api/user/subscription-status` - Subscription details
- `POST /api/user/subscription-status` - Update subscription
- `GET /api/user/subscription-history` - Subscription history
- `GET /api/user/password-status` - Password status
- `GET /api/user/sessions` - Active sessions list
- `POST /api/user/sessions` - Create session
- `DELETE /api/user/sessions` - Revoke sessions
- `GET /api/user/preferences` - User preferences
- `POST /api/user/preferences` - Update preferences

**RBAC Management:**
- `POST /api/rbac/check-permission` - Permission checks
- `GET /api/rbac/roles` - List roles
- `POST /api/rbac/roles/create` - Create role
- `PUT /api/rbac/roles/[roleId]` - Update role
- `DELETE /api/rbac/roles/[roleId]` - Delete role
- `GET /api/rbac/roles/[roleId]/policies` - Role policies
- `POST /api/rbac/roles/[roleId]/policies` - Assign policies
- `DELETE /api/rbac/roles/[roleId]/policies` - Remove policies
- `GET /api/rbac/policies` - List policies
- `POST /api/rbac/policies/create` - Create policy
- `PUT /api/rbac/policies/[policyId]` - Update policy
- `DELETE /api/rbac/policies/[policyId]` - Delete policy
- `GET /api/rbac/users/[userId]/roles` - User roles
- `POST /api/rbac/users/[userId]/roles` - Assign role
- `DELETE /api/rbac/users/[userId]/roles` - Remove role
- `GET /api/rbac/users/[userId]/policies` - User policies
- `GET /api/rbac/user/dashboard` - RBAC dashboard URL

**Payment Processing:**
- `POST /api/subscription-plans/purchase` - Purchase subscription
- `POST /api/payments/razorpay-create-order` - Create payment order
- `GET /api/payments/razorpay-subscriptions` - List subscriptions
- `POST /api/payments/razorpay-subscriptions` - Create subscription
- `PATCH /api/payments/razorpay-subscriptions` - Update subscription

**Admin Operations:**
- `GET /api/admin/sessions` - List all sessions
- `POST /api/admin/sessions` - Manage sessions
- `GET /api/admin/dashboard-stats` - Dashboard statistics
- `GET /api/admin/subscription-plans/[planId]/active-user-count` - Active users

#### 🟢 READ-ONLY Tier (100 req/min) - Public Access

**Public Endpoints:**
- `GET /api/subscription-plans` - List available plans
- `GET /api/health/newrelic` - Health check endpoint

### Testing Rate Limits

#### Using Test Script

```bash
# Test specific endpoint (sends 30 requests)
node scripts/test-rate-limit.js /api/auth/check-email 30

# Expected output:
# Request 1: HTTP 200
# Request 2: HTTP 200
# ...
# Request 5: HTTP 200
# Request 6: HTTP 429 (Rate limit exceeded)
```

#### Manual Testing with curl

```bash
# Test auth endpoint (should block after 5 requests)
for i in {1..10}; do 
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/check-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

#### Load Testing

```bash
# Light load test (10 connections, 10 seconds)
node scripts/load-test.js low

# Medium load test (50 connections, 30 seconds)
node scripts/load-test.js medium

# High load test (100 connections, 60 seconds)
node scripts/load-test.js high

# Extreme load test - DDoS simulation (500 connections, 120 seconds)
node scripts/load-test.js extreme
```

### Best Practices for Rate Limiting

#### 1. Choose Appropriate Tier

```typescript
// ❌ DON'T: Use auth tier for read operations
export const GET = rateLimiters.auth(async (req) => {
  return NextResponse.json({ data: publicData });
});

// ✅ DO: Use readOnly tier for public reads
export const GET = rateLimiters.readOnly(async (req) => {
  return NextResponse.json({ data: publicData });
});
```

#### 2. Always Protect Authentication Endpoints

```typescript
// ❌ DON'T: Leave auth endpoints unprotected
export const POST = async (req: NextRequest) => {
  // Vulnerable to brute force!
  return NextResponse.json({ token });
};

// ✅ DO: Apply strict auth tier
export const POST = rateLimiters.auth(async (req: NextRequest) => {
  // Protected against brute force
  return NextResponse.json({ token });
});
```

#### 3. Document Rate Limits in Comments

```typescript
/**
 * Update user profile
 * 
 * Rate Limited: 60 requests per minute (standard API tier)
 * 
 * @requires Authentication
 * @requires Permission: user:update
 */
export const PUT = rateLimiters.api(
  withApiHandler(async (req, { user }) => {
    // Handler logic
  }, { requireAuth: true })
);
```

#### 4. Handle Rate Limit Errors in Client

```typescript
// Client-side error handling
async function makeApiCall() {
  const response = await fetch('/api/user/data');
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.error(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // Show user-friendly message
    toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);
    return;
  }
  
  return await response.json();
}
```

#### 5. Monitor Rate Limit Headers

```typescript
// Check remaining requests before critical operations
async function criticalOperation() {
  const response = await fetch('/api/sensitive/operation');
  
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  
  if (parseInt(remaining) < 2) {
    console.warn(`Low rate limit: ${remaining}/${limit} remaining`);
  }
}
```

### Production Considerations

#### 1. Redis for Multi-Instance Deployments

For production with multiple server instances, use Redis:

```typescript
// src/lib/utils/rate-limiter.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class RateLimiter {
  async checkLimit(clientId: string, tier: string): Promise<boolean> {
    // Use Redis instead of in-memory Map
    const key = `rate-limit:${tier}:${clientId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return count <= maxRequests;
  }
}
```

#### 2. Client Identification

Current implementation uses IP address. Enhance for production:

```typescript
function getClientIdentifier(req: NextRequest): string {
  // Check for authenticated user first
  const userId = req.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  // Check for API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) return `api:${apiKey}`;
  
  // Fallback to IP (handle proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}
```

#### 3. Logging and Monitoring

```typescript
// Add logging for rate limit violations
if (!allowed) {
  console.warn('[Rate Limit] Blocked request', {
    clientId,
    tier,
    path: req.nextUrl.pathname,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
  });
  
  // Send to monitoring system
  // metrics.increment('rate_limit.violations', { tier, path });
}
```

#### 4. Graceful Degradation

```typescript
// Fallback if rate limiter fails
try {
  const allowed = await rateLimiter.checkLimit(clientId, tier);
  if (!allowed) {
    return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
    });
  }
} catch (error) {
  console.error('[Rate Limit] Error checking limit:', error);
  // Allow request to proceed if rate limiter is down (fail open)
  // OR reject for security (fail closed) - choose based on requirements
}
```

### Troubleshooting

#### Rate Limits Not Working

1. **Check middleware is applied:**
   ```typescript
   // Ensure rateLimiters.* wrapper is present
   export const POST = rateLimiters.auth(handler); // ✅
   export const POST = handler; // ❌
   ```

2. **Verify tier configuration:**
   ```typescript
   // Check src/lib/utils/rate-limiter.ts
   console.log(RATE_LIMIT_CONFIGS.auth); // Should show { windowMs: 900000, maxRequests: 5 }
   ```

3. **Check client identification:**
   ```typescript
   // Add logging to see client IDs
   console.log('Client ID:', getClientIdentifier(req));
   ```

#### Legitimate Users Getting Blocked

1. **Adjust limits for specific routes:**
   ```typescript
   // Create custom tier for high-traffic endpoints
   const customLimiter = createRateLimiter({
     windowMs: 60 * 1000,
     maxRequests: 200, // Increased limit
     message: 'Custom message',
   });
   ```

2. **Implement allowlists:**
   ```typescript
   const ALLOWLIST = new Set(['trusted-ip-1', 'trusted-ip-2']);
   
   if (ALLOWLIST.has(clientId)) {
     return handler(req); // Bypass rate limiting
   }
   ```

3. **Use per-user limits instead of IP:**
   ```typescript
   // Authenticate first, then use userId instead of IP
   const session = await auth();
   const clientId = session?.user?.id || getIpAddress(req);
   ```

## API Structure

```
src/app/api/
├── auth/                    # Authentication endpoints
│   ├── register/
│   ├── login/              # Handled by NextAuth
│   ├── verify/
│   ├── forgot-password/
│   └── reset-password/
│
├── rbac/                    # RBAC management (Admin only)
│   ├── roles/
│   │   ├── route.ts        # List/create roles
│   │   ├── [roleId]/
│   │   │   ├── route.ts    # Get/update/delete role
│   │   │   └── policies/   # Manage role policies
│   ├── policies/
│   │   ├── route.ts        # List/create policies
│   │   └── [policyId]/     # Manage specific policy
│   └── users/
│       └── [userId]/
│           ├── roles/      # Manage user roles
│           └── policies/   # View user policies
│
├── admin/                   # Admin-only endpoints
│   ├── users/
│   ├── dashboard/
│   └── analytics/
│
├── user/                    # User-specific endpoints
│   ├── profile/
│   ├── settings/
│   └── dashboard/
│
└── payments/                # Payment processing
    ├── create-order/
    ├── verify/
    ├── webhook/
    └── history/ 
```

## Authentication APIs

### Register User

**Endpoint**: `POST /api/auth/register`  
**Auth Required**: No

**Request Body**:
```typescript
{
  email: string;         // Valid email
  password: string;      // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  name: string;          // Full name
}
```

**Response**: 
```typescript
// Success (201)
{
  success: true,
  message: "Registration successful. Please verify your email.",
  userId: string
}

// Error (400/409)
{
  error: "Email already registered" | "Invalid input"
}
```

**Example**:
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe'
  })
});

const data = await response.json();
```

**Implementation**: `src/app/api/auth/register/route.ts`

### Verify Email

**Endpoint**: `GET /api/auth/verify?token={token}`  
**Auth Required**: No

**Query Parameters**:
- `token`: Email verification token (UUID)

**Response**: Redirects to login or error page

**Implementation**: `src/app/api/auth/verify/route.ts`

### Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`  
**Auth Required**: No

**Request Body**:
```typescript
{
  email: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "If email exists, reset link has been sent"
}
```

**Security Note**: Always returns success to prevent email enumeration

**Implementation**: `src/app/api/auth/forgot-password/route.ts`

### Reset Password

**Endpoint**: `POST /api/auth/reset-password`  
**Auth Required**: No

**Request Body**:
```typescript
{
  token: string;        // Reset token from email
  password: string;     // New password
}
```

**Response**:
```typescript
// Success (200)
{
  success: true,
  message: "Password reset successful"
}

// Error (400)
{
  error: "Invalid or expired token"
}
```

**Implementation**: `src/app/api/auth/reset-password/route.ts`

## RBAC APIs

All RBAC APIs require **admin access** unless otherwise noted.

### Role Management

#### List All Roles

**Endpoint**: `GET /api/rbac/roles`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  roles: [
    {
      id: string;
      name: string;
      description: string;
      isDefault: boolean;
      isSystemManaged: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ]
}
```

#### Create Role

**Endpoint**: `POST /api/rbac/roles/create`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name: string;              // Unique role name
  description?: string;
  isDefault?: boolean;       // Auto-assign to new users
  isSystemManaged?: boolean; // Prevent deletion
}
```

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
    // ... other fields
  }
}
```

#### Get Role

**Endpoint**: `GET /api/rbac/roles/[roleId]`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
    description: string;
    // ... with permissions
    permissions: [
      {
        id: string;
        name: string;
        description: string;
      }
    ]
  }
}
```

#### Update Role

**Endpoint**: `PUT /api/rbac/roles/[roleId]`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name?: string;
  description?: string;
  isDefault?: boolean;
}
```

**Response**:
```typescript
{
  success: true,
  role: { /* updated role */ }
}
```

#### Delete Role

**Endpoint**: `DELETE /api/admin/roles/[roleId]`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Response**:
```typescript
{
  success: true,
  message: "Role deleted successfully"
}

// Error if system-managed
{
  error: "Cannot delete system-managed role"
}
```

### User Management

#### List All Users

**Endpoint**: `GET /api/admin/users`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Response**:
```typescript
{
  success: true,
  users: User[]
}
```

#### Create User

**Endpoint**: `POST /api/admin/users/create`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  email: string;
  password: string;
  name: string;
  roleId?: string;
}
```

**Response**:
```typescript
{
  success: true,
  user: User
}
```

#### Update User

**Endpoint**: `PUT /api/admin/users/[userId]`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  name?: string;
  email?: string;
  isSuspended?: boolean;
}
```

#### Delete User

**Endpoint**: `DELETE /api/admin/users/[userId]`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

#### Suspend/Unsuspend User

**Endpoint**: `PUT /api/admin/users/[userId]/suspend`  
**Auth Required**: Yes  
**Required Policy**: `user:manage`

**Request Body**:
```typescript
{
  isSuspended: boolean;
}
```

### User-Role Management

#### Get User Roles

**Endpoint**: `GET /api/admin/user-roles?userId={userId}`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

#### Assign Role to User

**Endpoint**: `POST /api/admin/user-roles`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Request Body**:
```typescript
{
  userId: string;
  roleId: string;
}
```

#### Remove Role from User

**Endpoint**: `DELETE /api/admin/user-roles`  
**Auth Required**: Yes  
**Required Policy**: `role:manage`

**Request Body**:
```typescript
{
  userId: string;
  roleId: string;
}
```

### Subscription Plan Management

#### List Subscription Plans

**Endpoint**: `GET /api/admin/subscription-plans`  
**Auth Required**: Yes  
**Required Policy**: `subscription:manage`

**Query Parameters** (Optional):
- `category`: Filter by category

**Response**:
```typescript
{
  success: true,
  policies: [
    {
      id: string;
      name: string;           // Format: resource:action
      description: string;
      category: string;
      createdAt: string;
    }
  ]
}
```

#### Create Policy

**Endpoint**: `POST /api/rbac/policies/create`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  name: string;           // Format: resource:action
  description?: string;
  category?: string;
}
```

**Validation**:
- Name must follow `resource:action` format
- Name must be unique

**Response**:
```typescript
{
  success: true,
  policy: {
    id: string;
    name: string;
    // ... other fields
  }
}
```

#### Update Policy

**Endpoint**: `PUT /api/rbac/policies/[policyId]`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  description?: string;
  category?: string;
}
```

**Note**: Cannot update `name` to maintain referential integrity

#### Delete Policy

**Endpoint**: `DELETE /api/rbac/policies/[policyId]`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  message: "Policy deleted successfully"
}
```

### Role-Policy Assignment

#### Get Role's Policies

**Endpoint**: `GET /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  role: {
    id: string;
    name: string;
  },
  policies: [
    {
      id: string;
      name: string;
      description: string;
    }
  ]
}
```

#### Assign Policy to Role

**Endpoint**: `POST /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  policyId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Policy assigned to role successfully"
}
```

#### Remove Policy from Role

**Endpoint**: `DELETE /api/rbac/roles/[roleId]/policies`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  policyId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Policy removed from role successfully"
}
```

### User-Role Assignment

#### Get User's Roles

**Endpoint**: `GET /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
    name: string;
  },
  roles: [
    {
      id: string;
      name: string;
      description: string;
      assignedAt: string;
    }
  ]
}
```

#### Assign Role to User

**Endpoint**: `POST /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  roleId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Role assigned to user successfully"
}
```

**Side Effects**:
- Clears user's permission cache

#### Remove Role from User

**Endpoint**: `DELETE /api/rbac/users/[userId]/roles`  
**Auth Required**: Yes (Admin)

**Request Body**:
```typescript
{
  roleId: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Role removed from user successfully"
}
```

**Side Effects**:
- Clears user's permission cache

#### Get User's Computed Policies

**Endpoint**: `GET /api/rbac/users/[userId]/policies`  
**Auth Required**: Yes (Admin)

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
  },
  policies: [
    "content:view",
    "content:create",
    "profile:edit",
    // ... aggregated from all roles
  ]
}
```

### Permission Check

**Endpoint**: `POST /api/rbac/check-permission`  
**Auth Required**: Yes (Authenticated user)

**Request Body**:
```typescript
{
  userId?: string;      // Optional, defaults to current user
  policy: string;       // Policy to check
}
```

**Response**:
```typescript
{
  success: true,
  hasPermission: boolean
}
```

**Use Case**: Frontend can check if user has specific permission

## User APIs

### Get Current User Profile

**Endpoint**: `GET /api/user/profile`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: string | null;
    createdAt: string;
    roles: string[];
    policies: string[];
  }
}
```

### Update Profile

**Endpoint**: `PUT /api/user/profile`  
**Auth Required**: Yes  
**Policy Required**: `profile:edit`

**Request Body**:
```typescript
{
  name?: string;
  image?: string;
}
```

**Response**:
```typescript
{
  success: true,
  user: { /* updated user */ }
}
```

### Get Dashboard URL

**Endpoint**: `GET /api/rbac/user/dashboard`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  dashboardUrl: string,  // '/protected/admin/dashboard' or '/protected/user/dashboard'
  isAdmin: boolean
}
```

**Use Case**: Navigate user to appropriate dashboard based on policies

## Payment APIs

> **⚠️ Security:** All payment APIs now require authentication and implement role-based authorization. See [Authorization Model](#payment-authorization-model) below.

### Payment Authorization Model

**Two-Layer Security:**

1. **Authentication** (Layer 1) - All payment APIs require valid user session
2. **Authorization** (Layer 2) - Role-based access control:
   - **Admin users** → Full access to ALL users' payment data
   - **Regular users** → Access ONLY to their OWN payment data

**Authorization Rules:**

| Resource Type | Admin Access | User Access |
|--------------|--------------|-------------|
| **Subscriptions** | All subscriptions | Only subscriptions owned by user (matched by `razorpaySubscriptionId`) |
| **Payments** | All payments | Only payments matching user's `email` or `customer_id` |
| **Invoices** | All invoices | Only invoices matching user's `subscription_id` or `customer_id` |
| **Plans** | Read all, Create new | Read all (public pricing) |

**Response Format:**
All list endpoints include an `isAdmin` flag:
```typescript
{
  "entity": "collection",
  "count": 5,
  "items": [...],
  "isAdmin": false  // Indicates if user has admin privileges
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User doesn't own the resource and is not admin

---

### Razorpay Plans

#### List All Plans

**Endpoint**: `GET /api/payments/razorpay-plans`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users (public pricing information)

**Query Parameters**:
- `from` (number, optional) - Unix timestamp for start date filter
- `to` (number, optional) - Unix timestamp for end date filter
- `count` (number, optional) - Number of items to return
- `skip` (number, optional) - Number of items to skip for pagination

**Response**:
```typescript
{
  "success": true,
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "plan_xxx",
      "entity": "plan",
      "interval": 1,
      "period": "monthly",
      "item": {
        "id": "item_xxx",
        "name": "Premium Plan",
        "amount": 99900,  // Amount in paise (999.00 INR)
        "currency": "INR",
        "description": "Premium features"
      },
      "notes": {},
      "created_at": 1640000000
    }
  ]
}
```

**Example**:
```typescript
const response = await fetch('/api/payments/razorpay-plans', {
  credentials: 'include'
});
const data = await response.json();
```

---

#### Get Plan by ID

**Endpoint**: `GET /api/payments/razorpay-plans/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users

**URL Parameters**:
- `id` - Razorpay Plan ID (e.g., `plan_xxx`)

**Response**:
```typescript
{
  "success": true,
  "data": {
    "id": "plan_xxx",
    "entity": "plan",
    "interval": 1,
    "period": "monthly",
    "item": {
      "id": "item_xxx",
      "name": "Premium Plan",
      "amount": 99900,
      "currency": "INR"
    }
  }
}
```

---

#### Create Plan (Admin Only)

**Endpoint**: `POST /api/payments/razorpay-plans`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 **Admin Only**

**Request Body**:
```typescript
{
  "period": "monthly" | "yearly" | "weekly" | "daily",
  "interval": 1,  // Number of billing cycles
  "item": {
    "name": "Premium Plan",
    "amount": 99900,  // Amount in paise
    "currency": "INR",
    "description": "Premium features with advanced analytics"
  },
  "notes": {
    "feature_tier": "premium",
    "custom_key": "custom_value"
  }
}
```

**Response**:
```typescript
// Success (201)
{
  "success": true,
  "plan": { /* created plan object */ }
}

// Error - Not Admin (403)
{
  "success": false,
  "error": "Admin access required"
}
```

---

### Razorpay Subscriptions

#### List All Subscriptions

**Endpoint**: `GET /api/payments/razorpay-subscriptions`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all subscriptions
- **User**: Returns only user's own subscriptions

**Query Parameters**:
- `plan_id` (string, optional) - Filter by Razorpay plan ID
- `from` (number, optional) - Unix timestamp
- `to` (number, optional) - Unix timestamp
- `count` (number, optional) - Number of items
- `skip` (number, optional) - Skip items for pagination

**Response**:
```typescript
{
  "success": true,
  "subscriptions": [
    {
      "id": "sub_xxx",
      "entity": "subscription",
      "plan_id": "plan_xxx",
      "customer_id": "cust_xxx",
      "status": "active" | "paused" | "cancelled" | "completed",
      "current_start": 1640000000,
      "current_end": 1642678400,
      "charge_at": 1642678400,
      "total_count": 12,
      "paid_count": 3,
      "remaining_count": 9,
      "created_at": 1640000000
    }
  ],
  "count": 5,
  "isAdmin": false  // Indicates if requesting user is admin
}
```

**Behavior**:
- Admins see ALL subscriptions from all users
- Regular users see ONLY their own subscriptions (filtered by `razorpaySubscriptionId` in database)

---

#### Get Subscription by ID

**Endpoint**: `GET /api/payments/razorpay-subscriptions/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any subscription
- **User**: Can only access subscriptions they own

**URL Parameters**:
- `id` - Razorpay Subscription ID (e.g., `sub_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "sub_xxx",
  "entity": "subscription",
  "plan_id": "plan_xxx",
  "status": "active",
  "customer_notify": 1,
  // ... all subscription fields
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this subscription"
}
```

---

#### Create Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/create`  
**Auth Required**: ✅ Yes  
**Authorization**: All authenticated users can create subscriptions for themselves

**Request Body** (Option 1 - Using Local Plan ID):
```typescript
{
  "planId": "local-plan-uuid",  // UUID from your database
  "customer_notify": true,
  "total_count": 12,  // Number of billing cycles
  "quantity": 1,
  "notes": {
    "user_note": "Annual subscription"
  }
}
```

**Request Body** (Option 2 - Using Razorpay Plan ID):
```typescript
{
  "razorpayPlanId": "plan_xxx",  // Direct Razorpay plan ID
  "customer_notify": true,
  "end_at": 1735689600,  // Unix timestamp for end date
  "notes": {}
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "entity": "subscription",
    "status": "created",
    "plan_id": "plan_xxx",
    // ... subscription details
  }
}
```

---

#### Pause Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/pause`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required (user must own subscription or be admin)

**URL Parameters**:
- `id` - Subscription ID to pause

**Request Body**:
```typescript
{
  "pause_at": "now" | number  // "now" or Unix timestamp
}
```

**Response**:
```typescript
// Success (200)
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "paused",
    "paused_at": 1640000000
  }
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this subscription"
}
```

---

#### Resume Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/resume`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required

**URL Parameters**:
- `id` - Subscription ID to resume

**Request Body**:
```typescript
{
  "resume_at": "now" | number  // "now" or Unix timestamp
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "active"
  }
}
```

---

#### Cancel Subscription

**Endpoint**: `POST /api/payments/razorpay-subscriptions/[id]/cancel`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required

**URL Parameters**:
- `id` - Subscription ID to cancel

**Request Body**:
```typescript
{
  "cancel_at_cycle_end": boolean  // If true, cancels at end of current billing cycle
}
```

**Response**:
```typescript
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "cancelled",
    "ended_at": 1640000000
  }
}
```

---

### Razorpay Payments

#### List All Payments

**Endpoint**: `GET /api/payments/razorpay-payments`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all payments from all users
- **User**: Returns only payments matching user's email or customer_id

**Query Parameters**:
- `count` (number, optional, default: 10, max: 10) - Items per page
- `skip` (number, optional, default: 0) - Items to skip
- `from` (number, optional) - Unix timestamp for start date
- `to` (number, optional) - Unix timestamp for end date
- `q` (string, optional) - Search query (searches payment ID, order ID, email)
- `fetchAll` (boolean, optional) - Fetch all payments across multiple pages

**Special Features**:
- **Pagination**: Use `count` and `skip` for standard pagination
- **Search**: Use `q` parameter to filter by payment ID, order ID, or email
- **Fetch All**: Set `fetchAll=true` to automatically paginate through ALL results (admin useful)

**Response**:
```typescript
{
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "pay_xxx",
      "entity": "payment",
      "amount": 99900,  // Amount in paise
      "currency": "INR",
      "status": "captured" | "failed" | "refunded",
      "order_id": "order_xxx",
      "method": "card" | "netbanking" | "wallet" | "upi",
      "email": "user@example.com",
      "contact": "+919876543210",
      "fee": 2360,  // Payment gateway fee
      "tax": 360,
      "captured": true,
      "created_at": 1640000000
    }
  ],
  "isAdmin": false
}
```

**Behavior**:
- Admins see payments from ALL users
- Regular users see ONLY payments matching their email or customer_id
- Search filter is applied AFTER authorization filtering

**Example - Fetch User's Payments**:
```typescript
const response = await fetch('/api/payments/razorpay-payments?count=20&skip=0', {
  credentials: 'include'
});
const data = await response.json();
console.log(`Found ${data.count} payments (Admin: ${data.isAdmin})`);
```

**Example - Search Payments**:
```typescript
const response = await fetch('/api/payments/razorpay-payments?q=user@example.com', {
  credentials: 'include'
});
```

**Example - Fetch All (Admin)**:
```typescript
// Automatically paginates through all payments
const response = await fetch('/api/payments/razorpay-payments?fetchAll=true', {
  credentials: 'include'
});
```

---

#### Get Payment by ID

**Endpoint**: `GET /api/payments/razorpay-payments/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any payment
- **User**: Can only access payments matching their email or customer_id

**URL Parameters**:
- `id` - Razorpay Payment ID (e.g., `pay_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "pay_xxx",
  "entity": "payment",
  "amount": 99900,
  "currency": "INR",
  "status": "captured",
  "method": "card",
  "email": "user@example.com",
  "card": {
    "id": "card_xxx",
    "network": "Visa",
    "last4": "1234",
    "type": "credit"
  },
  "created_at": 1640000000,
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this payment"
}
```

---

### Razorpay Invoices

#### List All Invoices

**Endpoint**: `GET /api/payments/razorpay-invoices`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Role-based filtering
- **Admin**: Returns all invoices
- **User**: Returns only invoices matching user's subscription_id or customer_id

**Query Parameters**:
- `subscription_id` (string, optional) - Filter by subscription ID
- `count` (number, optional, default: 20) - Items per page
- `skip` (number, optional, default: 0) - Items to skip
- `status` (string, optional) - Filter by status (paid, issued, expired, cancelled)
- `customer_id` (string, optional) - Filter by customer ID
- `payment_id` (string, optional) - Filter by payment ID

**Response**:
```typescript
{
  "entity": "collection",
  "count": 10,
  "items": [
    {
      "id": "inv_xxx",
      "entity": "invoice",
      "type": "invoice",
      "status": "paid" | "issued" | "expired" | "cancelled",
      "amount": 99900,
      "amount_paid": 99900,
      "amount_due": 0,
      "currency": "INR",
      "customer_id": "cust_xxx",
      "subscription_id": "sub_xxx",
      "payment_id": "pay_xxx",
      "issued_at": 1640000000,
      "paid_at": 1640100000,
      "expire_by": 1640500000,
      "created_at": 1640000000
    }
  ],
  "isAdmin": false
}
```

---

#### Get Invoice by ID

**Endpoint**: `GET /api/payments/razorpay-invoices/[id]`  
**Auth Required**: ✅ Yes  
**Authorization**: 🔐 Ownership required
- **Admin**: Can access any invoice
- **User**: Can only access invoices matching their subscription_id or customer_id

**URL Parameters**:
- `id` - Razorpay Invoice ID (e.g., `inv_xxx`)

**Response**:
```typescript
// Success (200)
{
  "id": "inv_xxx",
  "entity": "invoice",
  "status": "paid",
  "amount": 99900,
  "currency": "INR",
  "customer_id": "cust_xxx",
  "subscription_id": "sub_xxx",
  "payment_id": "pay_xxx",
  "line_items": [
    {
      "item_id": "item_xxx",
      "name": "Premium Plan",
      "amount": 99900,
      "quantity": 1
    }
  ],
  "issued_at": 1640000000,
  "paid_at": 1640100000,
  "isAdmin": false
}

// Error - Not Owned (403)
{
  "success": false,
  "error": "You do not have permission to access this invoice"
}
```

---

### Legacy Payment Endpoints

#### Create Payment Order

**Endpoint**: `POST /api/payments/create-order`  
**Auth Required**: Yes  
**Policy Required**: `payment:create`

**Request Body**:
```typescript
{
  amount: number;       // Amount in INR
  planId: string;       // Subscription plan
  currency?: string;    // Default: 'INR'
}
```

**Response**:
```typescript
{
  success: true,
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
}
```

---

#### Verify Payment

**Endpoint**: `POST /api/payments/verify`  
**Auth Required**: Yes

**Request Body**:
```typescript
{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Payment verified successfully",
  subscriptionId: string;
}
```

---

#### Payment History

**Endpoint**: `GET /api/payments/history`  
**Auth Required**: Yes  
**Policy Required**: `payment:view`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```typescript
{
  success: true,
  payments: [
    {
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      completedAt: string | null;
    }
  ],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

#### Payment Webhook

**Endpoint**: `POST /api/payments/webhook`  
**Auth Required**: No (Validated via signature)

**Headers**:
- `x-razorpay-signature`: Webhook signature

**Request Body**: Razorpay webhook payload

**Response**:
```typescript
{
  success: true,
  message: "Webhook processed"
}
```

**Security**: Validates webhook signature before processing

---

### Payment API Security Summary

**Authentication & Authorization:**
- ✅ All payment APIs require authentication (Layer 1)
- ✅ Role-based authorization implemented (Layer 2)
- ✅ Admin users have full access to all data
- ✅ Regular users can only access their own data
- ✅ 403 Forbidden responses for unauthorized access

**Data Privacy:**
- ✅ Subscriptions matched by `razorpaySubscriptionId` ownership
- ✅ Payments matched by user's `email` or `customer_id`
- ✅ Invoices matched by user's `subscription_id` or `customer_id`

**Audit & Transparency:**
- ✅ All responses include `isAdmin` flag
- ✅ Console logging for all access attempts
- ✅ Clear error messages for denied access

**For Complete Details, See:**
- [Payment API Authorization Enhancement](./PAYMENT-API-AUTHORIZATION-ENHANCEMENT.md)
- [Payment API Security Refactor](./PAYMENT-API-SECURITY-REFACTOR.md)
- [Payment API Quick Reference](./PAYMENT-API-QUICK-REFERENCE.md)
- [Authorization Summary](./AUTHORIZATION-SUMMARY.md)

## Job APIs

### List Jobs

**Endpoint**: `GET /api/jobs`  
**Auth Required**: Yes

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `type`: Job type filter
- `location`: Location filter

**Response**:
```typescript
{
  success: true,
  jobs: [
    {
      id: string;
      title: string;
      company: string;
      location: string;
      type: string;
      description: string;
      salary?: string;
      createdAt: string;
    }
  ],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

### Create Job

**Endpoint**: `POST /api/jobs`  
**Auth Required**: Yes  
**Policy Required**: `content:create`

**Request Body**:
```typescript
{
  title: string;
  company: string;
  location?: string;
  type?: string;
  description: string;
  requirements?: string;
  salary?: string;
  applyUrl?: string;
}
```

**Response**:
```typescript
{
  success: true,
  job: { /* created job */ }
}
```

### Get Job

**Endpoint**: `GET /api/jobs/[jobId]`  
**Auth Required**: Yes

**Response**:
```typescript
{
  success: true,
  job: {
    id: string;
    title: string;
    company: string;
    // ... all job fields
  }
}
```

### Update Job

**Endpoint**: `PUT /api/jobs/[jobId]`  
**Auth Required**: Yes  
**Policy Required**: `content:edit` (or content:edit:own for own jobs)

**Request Body**: Same as Create Job

### Delete Job

**Endpoint**: `DELETE /api/jobs/[jobId]`  
**Auth Required**: Yes  
**Policy Required**: `content:delete`

**Response**:
```typescript
{
  success: true,
  message: "Job deleted successfully"
}
```

### Search Jobs

**Endpoint**: `POST /api/jobs/search`  
**Auth Required**: Yes

**Request Body**:
```typescript
{
  query: string;
  filters?: {
    type?: string[];
    location?: string[];
    salary?: { min?: number; max?: number };
  };
  page?: number;
  limit?: number;
}
```

**Response**: Same as List Jobs

## Response Patterns

### Success Response

```typescript
{
  success: true,
  data?: any,
  message?: string,
  metadata?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    // ... other metadata
  }
}
```

### Error Response

```typescript
{
  error: string,
  details?: any,
  code?: string
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Error Handling

### Standard Error Handler

```typescript
try {
  // API logic
} catch (error) {
  console.error('API Error:', error);
  
  return NextResponse.json(
    {
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    },
    { status: 500 }
  );
}
```

### Validation Errors

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

try {
  const validated = schema.parse(body);
} catch (error) {
  return NextResponse.json(
    { error: 'Validation failed', details: error.errors },
    { status: 400 }
  );
}
```

### Authentication Errors

```typescript
const session = await auth();

if (!session) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Authorization Errors

```typescript
const authCheck = await requirePolicy(req, POLICIES.ADMIN_ACCESS);

if (!authCheck.authorized) {
  return authCheck.response; // 403 Forbidden
}
```

## Best Practices

### 1. Use Policy Middleware

```typescript
import { requirePolicy, POLICIES } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }
  
  // Proceed with logic
}
```

### 2. Validate Input

```typescript
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1),
  description: z.string().min(10),
});

const validated = createJobSchema.parse(body);
```

### 3. Use Transactions

```typescript
import { db } from '@/server/db';

await db.transaction(async (tx) => {
  const user = await tx.insert(users).values(userData).returning();
  await tx.insert(userRoles).values({ userId: user.id, roleId });
});
```

### 4. Return Consistent Responses

```typescript
// ✅ Good
return NextResponse.json({
  success: true,
  data: result
});

// ❌ Bad
return NextResponse.json(result);
```

### 5. Log Errors

```typescript
try {
  // Logic
} catch (error) {
  console.error('[API Error]', {
    endpoint: '/api/jobs',
    error: error.message,
    userId: session?.user?.id,
  });
  
  throw error;
}
```

### 6. Rate Limiting

```typescript
// Implement rate limiting for sensitive endpoints
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

await limiter.check(req, 10); // 10 requests per minute
```

### 7. Cache Responses

```typescript
// Cache expensive queries
import { cache } from '@/lib/cache';

const cacheKey = `user:${userId}:policies`;
const cached = await cache.get(cacheKey);

if (cached) {
  return NextResponse.json(cached);
}

const policies = await RBACService.getUserPolicies(userId);
await cache.set(cacheKey, policies, 300); // 5 minutes
```

### 8. Use TypeScript

```typescript
// Define request/response types
interface CreateJobRequest {
  title: string;
  company: string;
  description: string;
}

interface CreateJobResponse {
  success: true;
  job: Job;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<CreateJobResponse>> {
  // Type-safe implementation
}
```

## Testing APIs

### Using fetch

```typescript
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great opportunity'
  })
});

const data = await response.json();
```

### Using Axios

```typescript
import axios from 'axios';

const { data } = await axios.post('/api/jobs', {
  title: 'Software Engineer',
  company: 'Tech Corp',
  description: 'Great opportunity'
});
```

### Testing with Jest

```typescript
import { POST } from '@/app/api/jobs/route';

describe('POST /api/jobs', () => {
  it('should create a job', async () => {
    const req = new Request('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Job',
        company: 'Test Company',
        description: 'Test description'
      })
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.job).toBeDefined();
  });
});
```

## Next Steps

- Read [10-TESTING.md](./10-TESTING.md) for comprehensive API testing
- Check [12-SECURITY.md](./12-SECURITY.md) for security best practices
- Review example implementations in `src/app/api/examples/`
