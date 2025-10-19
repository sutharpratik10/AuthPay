# API Routes Documentation

## Table of Contents
- [Overview](#overview)
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

AuthPay provides a comprehensive REST API built with Next.js API Routes. All APIs follow consistent patterns for authentication, authorization, error handling, and response formatting.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

### API Characteristics

- ✅ **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Protected**: RBAC-based authorization
- ✅ **Consistent**: Standardized response patterns
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Validation**: Request/response validation with Zod

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

**Endpoint**: `DELETE /api/rbac/roles/[roleId]`  
**Auth Required**: Yes (Admin)

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

### Policy Management

#### List All Policies

**Endpoint**: `GET /api/rbac/policies`  
**Auth Required**: Yes (Admin)

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

### Create Payment Order

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

### Verify Payment

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

### Payment History

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

### Payment Webhook

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
