# Role-Based Access Control (RBAC) System

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Database Schema](#database-schema)
- [RBAC Service](#rbac-service)
- [Middleware Protection](#middleware-protection)
- [API Protection](#api-protection)
- [Admin APIs](#admin-apis)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

AuthPay implements a sophisticated **policy-based RBAC system** that provides fine-grained access control throughout the application. Unlike traditional role-based systems, our approach uses policies (permissions) to define what users can do, making the system more flexible and maintainable.

### Why Policy-Based?

**Traditional RBAC**:
```typescript
if (user.role === 'admin') {
  // Allow access
}
```
❌ Hardcoded roles  
❌ Difficult to extend  
❌ Role explosion problem

**Policy-Based RBAC**:
```typescript
if (await hasPolicy(userId, 'content:create')) {
  // Allow access
}
```
✅ Flexible permissions  
✅ Easy to extend  
✅ Reusable policies  
✅ Multi-role support

### Key Features

- ✅ **Policy-Based**: Fine-grained permissions using `resource:action` format
- ✅ **Multi-Role Support**: Users can have multiple roles simultaneously
- ✅ **Caching**: 5-minute cache for performance optimization
- ✅ **Admin Override**: Admin role bypasses all policy checks
- ✅ **Dynamic Assignment**: Runtime role/policy assignment
- ✅ **Route Protection**: Automatic middleware-based protection
- ✅ **API Protection**: Helper functions for API route protection
- ✅ **System Protection**: Prevent deletion of critical roles/policies

## Architecture

### RBAC Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    User Authentication                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Load Roles & Policies
                         ▼
┌──────────────────────────────────────────────────────────┐
│                     RBACService                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  getUserPolicies(userId)                           │  │
│  │    ↓                                               │  │
│  │  1. Check cache (5min TTL)                         │  │
│  │  2. Query user_roles → roles                       │  │
│  │  3. Query role_permissions → policies              │  │
│  │  4. Admin check (bypass all)                       │  │
│  │  5. Return aggregated policies                     │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Policies cached in session
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   Request Processing                     │
│                                                          │
│  Middleware → Check Route Policy                         │
│       ↓                                                  │
│  API Route → requirePolicy()                             │
│       ↓                                                  │
│  hasPolicy(userId, 'resource:action')                    │
│       ↓                                                  │
│  ✅ Allow / ❌ Deny                                     │
└──────────────────────────────────────────────────────────┘
```

### System Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **RBACService** | `src/lib/rbac/rbac-service.ts` | Core permission logic |
| **Policy Middleware** | `src/lib/api/permissions.ts` | API route protection (`withPolicy`) |
| **Routing Utils** | `src/lib/rbac/routing-utils.ts` | Dynamic dashboard routing |
| **Policies Constants** | `src/lib/rbac/index.ts` | Policy definitions |
| **Route Middleware** | `middleware.ts` | Route-level protection |
| **Admin APIs** | `src/app/api/admin/` | RBAC management endpoints |

## Core Concepts

### 1. Policies (Permissions)

Policies define **what** a user can do. They follow a `resource:action` naming convention.

**Format**: `resource:action`

**Examples**:
```typescript
// Content management
"content:view"      // View content
"content:create"    // Create content
"content:edit"      // Edit content
"content:delete"    // Delete content

// User management
"user:view"         // View users
"user:manage"       // Manage users
"user:delete"       // Delete users

// Admin
"admin:access"      // Access admin panel
"admin:full"        // Full admin privileges

// Account
"account:manage"    // Manage own account
"profile:view"      // View own profile
"profile:edit"      // Edit own profile
```

**Policy Categories**:
```typescript
export const POLICY_CATEGORIES = {
  CONTENT: 'content',
  USER: 'user',
  ADMIN: 'admin',
  ACCOUNT: 'account',
  PROFILE: 'profile',
  PAYMENT: 'payment',
  SUBSCRIPTION: 'subscription',
};
```

### 2. Roles

Roles are **collections of policies** assigned to users.

**Default Roles**:
```typescript
{
  name: "Admin",
  description: "Full system access",
  isDefault: false,
  isSystemManaged: true,
  policies: ["admin:full", "admin:access", "*:*"]
}

{
  name: "User",
  description: "Standard user access",
  isDefault: true,      // Auto-assigned to new users
  isSystemManaged: true,
  policies: [
    "content:view",
    "profile:view",
    "profile:edit",
    "account:manage"
  ]
}

{
  name: "Author",
  description: "Content creator",
  isDefault: false,
  isSystemManaged: false,
  policies: [
    "content:view",
    "content:create",
    "content:edit:own",
    "profile:view",
    "profile:edit"
  ]
}

{
  name: "Moderator",
  description: "Content moderator",
  isDefault: false,
  isSystemManaged: false,
  policies: [
    "content:view",
    "content:edit",
    "content:delete",
    "user:view"
  ]
}
```

**Role Properties**:
- `isDefault`: Auto-assigned to new users during registration
- `isSystemManaged`: Cannot be deleted (critical system roles)
- `name`: Unique role identifier
- `description`: Human-readable description

### 3. User-Role Assignment

Users can have **multiple roles** simultaneously.

```typescript
// User can be both Author and Moderator
user.roles = ["Author", "Moderator"]

// Policies are aggregated from all roles
user.policies = [
  "content:view",
  "content:create",
  "content:edit",
  "content:edit:own",
  "content:delete",
  "user:view",
  "profile:view",
  "profile:edit"
]
```

### 4. Admin Override

Users with the **Admin role** or `admin:full` policy bypass all permission checks.

```typescript
// Admin check happens first
if (await RBACService.isAdmin(userId)) {
  return true; // Grant access to everything
}

// Then check specific policies
return await RBACService.hasPolicy(userId, policyName);
```

## Database Schema

### Tables Overview

```
users
  ├── id (UUID, PK)
  ├── email
  ├── name
  ├── password
  └── emailVerified

roles
  ├── id (UUID, PK)
  ├── name (unique)
  ├── description
  ├── isDefault (boolean)
  └── isSystemManaged (boolean)

permissions (stores policies)
  ├── id (UUID, PK)
  ├── name (unique, format: resource:action)
  ├── description
  └── category

user_roles (many-to-many)
  ├── userId (FK → users.id)
  └── roleId (FK → roles.id)

role_permissions (many-to-many)
  ├── roleId (FK → roles.id)
  └── permissionId (FK → permissions.id)
```

### Schema Definition

**Location**: `src/server/db/schema/schema.ts`

```typescript
// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isSystemManaged: boolean('is_system_managed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Permissions table (policies)
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User-Role junction table
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

// Role-Permission junction table
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));
```

### Relationships

```typescript
// User → Roles (many-to-many)
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

// Role → Permissions (many-to-many)
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

// Permission relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));
```

## RBAC Service

### Core Service

**Location**: `src/lib/rbac/rbac-service.ts`

```typescript
export class RBACService {
  private static cache = new Map<string, CachedPolicies>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all policies for a user (cached)
   */
  static async getUserPolicies(userId: string): Promise<string[]> {
    // Check cache
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.policies;
    }

    // Check if user is admin first
    const isAdmin = await this.isAdmin(userId);
    if (isAdmin) {
      const adminPolicies = ['*:*', 'admin:full', 'admin:access'];
      this.cacheUserPolicies(userId, adminPolicies);
      return adminPolicies;
    }

    // Query user's roles and permissions
    const userRolesData = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Aggregate all policies from all roles
    const policies = new Set<string>();
    
    for (const userRole of userRolesData) {
      for (const rolePerm of userRole.role.rolePermissions) {
        policies.add(rolePerm.permission.name);
      }
    }

    const policiesArray = Array.from(policies);
    this.cacheUserPolicies(userId, policiesArray);
    
    return policiesArray;
  }

  /**
   * Check if user has a specific policy
   */
  static async hasPolicy(
    userId: string,
    policyName: string
  ): Promise<boolean> {
    // Admin bypass
    if (await this.isAdmin(userId)) {
      return true;
    }

    const policies = await this.getUserPolicies(userId);
    
    // Check wildcard policies
    if (policies.includes('*:*')) {
      return true;
    }

    // Check exact match
    if (policies.includes(policyName)) {
      return true;
    }

    // Check resource wildcard (e.g., "content:*")
    const [resource] = policyName.split(':');
    if (policies.includes(`${resource}:*`)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of multiple policies
   */
  static async hasAnyPolicy(
    userId: string,
    policyNames: string[]
  ): Promise<boolean> {
    for (const policy of policyNames) {
      if (await this.hasPolicy(userId, policy)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of multiple policies
   */
  static async hasAllPolicies(
    userId: string,
    policyNames: string[]
  ): Promise<boolean> {
    for (const policy of policyNames) {
      if (!(await this.hasPolicy(userId, policy))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const userRolesData = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    return userRolesData.some(ur => ur.role.name === 'Admin');
  }

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Cache user policies
   */
  private static cacheUserPolicies(
    userId: string,
    policies: string[]
  ): void {
    this.cache.set(userId, {
      policies,
      timestamp: Date.now(),
    });
  }
}

interface CachedPolicies {
  policies: string[];
  timestamp: number;
}
```

### Policy Constants

**Location**: `src/lib/rbac/index.ts`

```typescript
export const POLICIES = {
  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_FULL: 'admin:full',
  
  // Content
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content:delete',
  
  // User Management
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  USER_DELETE: 'user:delete',
  
  // Profile
  PROFILE_VIEW: 'profile:view',
  PROFILE_EDIT: 'profile:edit',
  
  // Account
  ACCOUNT_MANAGE: 'account:manage',
  
  // Payment
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_MANAGE: 'payment:manage',
  
  // Subscription
  SUBSCRIPTION_VIEW: 'subscription:view',
  SUBSCRIPTION_MANAGE: 'subscription:manage',
} as const;

export type PolicyName = typeof POLICIES[keyof typeof POLICIES];
```

## Middleware Protection

### Route Protection

**Location**: `middleware.ts`

```typescript
import { auth } from "@/config/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RBACService } from "@/lib/rbac/rbac-service";

// Map routes to required policies
const ROUTE_POLICY_MAP: Record<string, string> = {
  '/protected/admin': 'admin:access',
  '/protected/admin/users': 'user:manage',
  '/protected/admin/roles': 'admin:access',
  '/protected/profile': 'profile:view',
  '/protected/account': 'account:manage',
  '/protected/user': 'user:access',
  '/protected/user/dashboard': 'user:access',
  '/protected/payments': 'payment:view',
  '/protected/subscription': 'subscription:view',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session
  const session = await auth();

  // Public routes
  const isPublicRoute = pathname.startsWith('/api/auth') ||
                        pathname === '/' ||
                        pathname.startsWith('/auth/');

  if (isPublicRoute) {
    // Redirect authenticated users away from auth pages
    if (session && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/protected/user/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check policy for protected routes
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

  return NextResponse.next();
}

function getRequiredPolicy(pathname: string): string | null {
  // Exact match first
  if (ROUTE_POLICY_MAP[pathname]) {
    return ROUTE_POLICY_MAP[pathname];
  }

  // Check prefix matches
  for (const [route, policy] of Object.entries(ROUTE_POLICY_MAP)) {
    if (pathname.startsWith(route)) {
      return policy;
    }
  }

  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

## API Protection

### Policy Middleware Helpers

**Location**: `src/lib/rbac/policy-middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { RBACService } from "./rbac-service";

export interface AuthCheckResult {
  authorized: boolean;
  userId?: string;
  response?: NextResponse;
}

/**
 * Require specific policy for API route
 */
export async function requirePolicy(
  req: NextRequest,
  policy: string
): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const hasAccess = await RBACService.hasPolicy(session.user.id, policy);

  if (!hasAccess) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}

/**
 * Require any of multiple policies
 */
export async function requireAnyPolicy(
  req: NextRequest,
  policies: string[]
): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const hasAccess = await RBACService.hasAnyPolicy(
    session.user.id,
    policies
  );

  if (!hasAccess) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}

/**
 * Require admin access
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const isAdmin = await RBACService.isAdmin(session.user.id);

  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}

/**
 * Get authenticated user ID
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}
```

### Example Protected API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requirePolicy, POLICIES } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  // Check if user has required policy
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);

  if (!authCheck.authorized) {
    return authCheck.response; // Returns 401 or 403
  }

  const userId = authCheck.userId;

  // User is authorized, proceed with logic
  const body = await req.json();
  
  // Create content...
  
  return NextResponse.json({
    success: true,
    message: "Content created",
  });
}
```

## Admin APIs

All RBAC management APIs require admin access.

**Base Path**: `/api/rbac/`

### Role Management

**List All Roles**

```typescript
GET /api/rbac/roles

Response:
{
  success: true,
  roles: [
    {
      id: "uuid",
      name: "Admin",
      description: "Full system access",
      isDefault: false,
      isSystemManaged: true,
      createdAt: "2024-01-01T00:00:00Z"
    },
    ...
  ]
}
```

**Create Role**

```typescript
POST /api/rbac/roles/create

Request:
{
  name: "Editor",
  description: "Content editor role",
  isDefault: false,
  isSystemManaged: false
}

Response:
{
  success: true,
  role: { id: "uuid", name: "Editor", ... }
}
```

**Update Role**

```typescript
PUT /api/rbac/roles/[roleId]

Request:
{
  name: "Senior Editor",
  description: "Updated description"
}

Response:
{
  success: true,
  role: { id: "uuid", name: "Senior Editor", ... }
}
```

**Delete Role**

```typescript
DELETE /api/rbac/roles/[roleId]

Response:
{
  success: true,
  message: "Role deleted successfully"
}

// Error if system-managed:
{
  error: "Cannot delete system-managed role"
}
```

### Policy Management

**List All Policies**

```typescript
GET /api/rbac/policies

Response:
{
  success: true,
  policies: [
    {
      id: "uuid",
      name: "content:create",
      description: "Create content",
      category: "content",
      createdAt: "2024-01-01T00:00:00Z"
    },
    ...
  ]
}
```

**Create Policy**

```typescript
POST /api/rbac/policies/create

Request:
{
  name: "resource:action",
  description: "Policy description",
  category: "resource"
}

Response:
{
  success: true,
  policy: { id: "uuid", name: "resource:action", ... }
}
```

**Update Policy**

```typescript
PUT /api/rbac/policies/[policyId]

Request:
{
  description: "Updated description",
  category: "new-category"
}

Response:
{
  success: true,
  policy: { id: "uuid", ... }
}
```

**Delete Policy**

```typescript
DELETE /api/rbac/policies/[policyId]

Response:
{
  success: true,
  message: "Policy deleted successfully"
}
```

### Role-Policy Assignment

**Get Role's Policies**

```typescript
GET /api/rbac/roles/[roleId]/policies

Response:
{
  success: true,
  policies: [
    { id: "uuid", name: "content:view", ... },
    { id: "uuid", name: "content:create", ... }
  ]
}
```

**Assign Policy to Role**

```typescript
POST /api/rbac/roles/[roleId]/policies

Request:
{
  policyId: "uuid"
}

Response:
{
  success: true,
  message: "Policy assigned to role"
}
```

**Remove Policy from Role**

```typescript
DELETE /api/rbac/roles/[roleId]/policies

Request:
{
  policyId: "uuid"
}

Response:
{
  success: true,
  message: "Policy removed from role"
}
```

### User-Role Assignment

**Get User's Roles**

```typescript
GET /api/rbac/users/[userId]/roles

Response:
{
  success: true,
  roles: [
    { id: "uuid", name: "User", ... },
    { id: "uuid", name: "Author", ... }
  ]
}
```

**Assign Role to User**

```typescript
POST /api/rbac/users/[userId]/roles

Request:
{
  roleId: "uuid"
}

Response:
{
  success: true,
  message: "Role assigned to user"
}

// Note: Clears user's policy cache automatically
```

**Remove Role from User**

```typescript
DELETE /api/rbac/users/[userId]/roles

Request:
{
  roleId: "uuid"
}

Response:
{
  success: true,
  message: "Role removed from user"
}

// Note: Clears user's policy cache automatically
```

**Get User's Computed Policies**

```typescript
GET /api/rbac/users/[userId]/policies

Response:
{
  success: true,
  policies: [
    "content:view",
    "content:create",
    "profile:view",
    "profile:edit",
    "account:manage"
  ]
}
```

### Permission Check

**Check User Permission**

```typescript
POST /api/rbac/check-permission

Request:
{
  userId: "uuid",
  policy: "content:create"
}

Response:
{
  success: true,
  hasPermission: true
}
```

## Usage Examples

### 1. Protect API Route

```typescript
// src/app/api/posts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePolicy, POLICIES } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);

  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // Create post logic
  return NextResponse.json({ success: true });
}
```

### 2. Check Multiple Policies

```typescript
// User needs either admin access OR content management
const authCheck = await requireAnyPolicy(req, [
  POLICIES.ADMIN_ACCESS,
  POLICIES.CONTENT_MANAGE
]);

if (!authCheck.authorized) {
  return authCheck.response;
}
```

### 3. Admin-Only Route

```typescript
import { requireAdmin } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);

  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // Admin logic
  return NextResponse.json({ success: true });
}
```

### 4. Server Component Policy Check

```typescript
import { auth } from "@/config/auth";
import { RBACService } from "@/lib/rbac/rbac-service";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const hasAdminAccess = await RBACService.hasPolicy(
    session.user.id,
    'admin:access'
  );

  if (!hasAdminAccess) {
    redirect('/protected/unauthorized');
  }

  return <div>Admin Content</div>;
}
```

### 5. Client Component Policy Check

```typescript
'use client';

import { useSession } from "next-auth/react";

export function CreateButton() {
  const { data: session } = useSession();

  // Check if user has create permission
  const canCreate = session?.user?.policies?.includes('content:create');

  if (!canCreate) {
    return null;
  }

  return <button>Create Content</button>;
}
```

### 6. Conditional UI Based on Policies

```typescript
'use client';

import { useSession } from "next-auth/react";

export function AdminPanel() {
  const { data: session } = useSession();
  const policies = session?.user?.policies || [];

  return (
    <div>
      {policies.includes('user:manage') && (
        <button>Manage Users</button>
      )}
      
      {policies.includes('content:delete') && (
        <button>Delete Content</button>
      )}
      
      {policies.includes('admin:access') && (
        <a href="/protected/admin">Admin Dashboard</a>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Use Policy Constants

❌ **Don't**:
```typescript
await hasPolicy(userId, 'content:create');
```

✅ **Do**:
```typescript
import { POLICIES } from '@/lib/rbac';
await hasPolicy(userId, POLICIES.CONTENT_CREATE);
```

### 2. Clear Cache After Role Changes

```typescript
// After assigning/removing roles
RBACService.clearUserCache(userId);

// After bulk operations
RBACService.clearAllCache();
```

### 3. Use Descriptive Policy Names

✅ **Good**:
- `content:create`
- `user:manage`
- `admin:access`

❌ **Bad**:
- `create`
- `manage`
- `access`

### 4. Group Related Policies

```typescript
const CONTENT_POLICIES = {
  VIEW: 'content:view',
  CREATE: 'content:create',
  EDIT: 'content:edit',
  DELETE: 'content:delete',
};
```

### 5. Document Policy Requirements

```typescript
/**
 * Create a new blog post
 * 
 * @requires content:create policy
 * @param req - NextRequest
 * @returns Post creation response
 */
export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  // ...
}
```

### 6. Use Admin Override Wisely

```typescript
// Admin can do everything
if (await RBACService.isAdmin(userId)) {
  return true;
}

// Regular permission check
return await RBACService.hasPolicy(userId, policy);
```

### 7. Validate System-Managed Roles

```typescript
// Prevent deletion of critical roles
if (role.isSystemManaged) {
  return NextResponse.json(
    { error: "Cannot delete system-managed role" },
    { status: 400 }
  );
}
```

### 8. Use Middleware for Routes

For page protection, use middleware instead of checking in every component:

```typescript
// middleware.ts handles route protection
// Components focus on functionality
```

### 9. Cache Efficiently

```typescript
// Cache is automatic, but clear when needed
await assignRoleToUser(userId, roleId);
RBACService.clearUserCache(userId); // Clear after changes
```

### 10. Test Permissions

```typescript
// scripts/test-rbac-system.ts
async function testPermissions() {
  const hasAccess = await RBACService.hasPolicy(userId, 'content:create');
  console.log('Has content:create:', hasAccess);
}
```

## Setup Guide

See [RBAC-SETUP.md](./RBAC-SETUP.md) for detailed setup instructions.

**Quick Setup**:

```bash
# 1. Run migration
npx tsx scripts/migrate-rbac.ts

# 2. Seed data
npx tsx scripts/seed-rbac.ts

# 3. Assign admin role (via database or API)
# 4. Test system
npx tsx scripts/test-rbac-system.ts
```

## Troubleshooting

### Common Issues

**1. Permission Denied but User Has Role**
- Clear cache: `RBACService.clearUserCache(userId)`
- Verify role has required policy
- Check policy name spelling

**2. Admin Can't Access Everything**
- Verify user has Admin role
- Check `isAdmin()` returns true
- Ensure Admin role has `admin:full` policy

**3. New Policies Not Working**
- Clear cache: `RBACService.clearAllCache()`
- Verify policy exists in database
- Check policy assignment to role

**4. Multiple Roles Not Working**
- Policies should aggregate from all roles
- Check database join queries
- Verify `getUserPolicies()` logic

## Next Steps

- Read [06-ROUTING.md](./06-ROUTING.md) for dynamic routing based on policies
- Check [05-API-ROUTES.md](./05-API-ROUTES.md) for complete API documentation
- Review [10-TESTING.md](./10-TESTING.md) for testing RBAC functionality
