# Policy-Based RBAC System

This folder contains the core implementation of the policy-based Role-Based Access Control system.

## 📁 Files

- **`rbac-service.ts`** - Core RBAC logic with caching
- **`policy-middleware.ts`** - API route protection helpers
- **`types.ts`** - TypeScript type definitions
- **`index.ts`** - Main exports

## 🚀 Quick Start

### Protect an API Route

```typescript
import { requirePolicy, POLICIES } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Check if user has required policy
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    return authCheck.response; // Returns 401 or 403
  }

  // User is authorized!
  const userId = authCheck.userId;
  
  // Your protected logic here
  return NextResponse.json({ success: true });
}
```

### Server-Side Policy Check

```typescript
import { RBACService } from "@/lib/rbac";

// Check if user has a policy
const hasAccess = await RBACService.hasPolicy(userId, "content:create");

// Check if user is admin
const isAdmin = await RBACService.isAdmin(userId);

// Get all user's policies
const policies = await RBACService.getUserPolicies(userId);

// Get all user's roles
const roles = await RBACService.getUserRoles(userId);
```

## 🎯 Available Functions

### Middleware Functions

- `requirePolicy(req, policy)` - Require a specific policy
- `requireAnyPolicy(req, policies)` - Require any of the policies
- `requireAllPolicies(req, policies)` - Require all of the policies
- `requireAdmin(req)` - Require admin access
- `getAuthenticatedUser(req)` - Get authenticated user (no policy check)

### RBACService Methods

- `hasPolicy(userId, policy)` - Check if user has a policy
- `hasAnyPolicy(userId, policies)` - Check if user has any policy
- `hasAllPolicies(userId, policies)` - Check if user has all policies
- `isAdmin(userId)` - Check if user is admin
- `getUserPolicies(userId)` - Get all user's policies
- `getUserRoles(userId)` - Get all user's role names
- `assignRole(adminUserId, targetUserId, roleId)` - Assign role to user
- `removeRole(adminUserId, targetUserId, roleId)` - Remove role from user
- `clearCache(userId)` - Clear cache for specific user
- `clearAllCache()` - Clear all cache

## 📋 Predefined Policies

Use the `POLICIES` constant for predefined policy names:

```typescript
import { POLICIES } from "@/lib/rbac";

// Content
POLICIES.CONTENT_VIEW
POLICIES.CONTENT_CREATE
POLICIES.CONTENT_UPDATE
POLICIES.CONTENT_DELETE
POLICIES.CONTENT_MANAGE

// User
POLICIES.USER_VIEW
POLICIES.USER_CREATE
POLICIES.USER_UPDATE
POLICIES.USER_DELETE
POLICIES.USER_MANAGE

// Role
POLICIES.ROLE_VIEW
POLICIES.ROLE_CREATE
POLICIES.ROLE_UPDATE
POLICIES.ROLE_DELETE
POLICIES.ROLE_MANAGE

// ... and more (see index.ts)
```

## 🔐 Security Features

- ✅ Admin role has override access to everything
- ✅ System-managed roles/policies cannot be deleted
- ✅ All admin operations require admin authentication
- ✅ Caching for performance (5-minute TTL)
- ✅ Automatic cache invalidation on role changes

## 📚 Documentation

For complete documentation, see:
- `docs/RBAC-GUIDE.md` - Full usage guide
- `docs/RBAC-SETUP.md` - Setup instructions
- `docs/RBAC-SUMMARY.md` - Implementation summary
- `docs/RBAC-CHECKLIST.md` - Testing checklist

## 🎯 Example Usage Patterns

### Basic Policy Check
```typescript
const authCheck = await requirePolicy(req, "content:create");
```

### Multiple Policy Options
```typescript
const authCheck = await requireAnyPolicy(req, [
  POLICIES.CONTENT_VIEW,
  POLICIES.CONTENT_MANAGE
]);
```

### Custom Policy Names
```typescript
const authCheck = await requirePolicy(req, "blog:publish");
```

### Admin-Only Endpoint
```typescript
const authCheck = await requireAdmin(req);
```

---

**Need help?** Check the documentation in the `docs/` folder!
