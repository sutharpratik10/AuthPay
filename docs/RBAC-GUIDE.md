# Policy-Based Role-Based Access Control (RBAC)

## Overview

This is a lightweight and efficient policy-based RBAC system that allows admins to dynamically manage access control without modifying code. The system supports:

- ✅ **Multiple roles per user**
- ✅ **Dynamic policy creation**
- ✅ **Admin override access**
- ✅ **Simple policy format**: `resource:action` (e.g., `content:create`)
- ✅ **Performance optimized** with caching
- ✅ **No tenant/department complexity** - simple single-tenant system

---

## 🏗️ Architecture

### Core Entities

1. **Roles** - Groups of policies (e.g., Admin, Author, User)
2. **Policies (Permissions)** - Define what can be accessed (e.g., `content:create`, `user:manage`)
3. **Users** - Can have one or more roles
4. **UserRoles** - Many-to-many relationship between users and roles
5. **RolePermissions** - Many-to-many relationship between roles and policies

### Database Schema

```
users
├── id (legacy roleId kept for backward compatibility)
├── email
└── ...

user_roles (NEW)
├── userId → users.id
├── roleId → roles.id
├── assignedAt
└── assignedBy → users.id

roles
├── id
├── name
├── description
└── isSystemManaged

permissions (policies)
├── id
├── name (e.g., "content:create")
├── resource (e.g., "content")
├── action (e.g., "create")
└── category

role_permissions
├── roleId → roles.id
└── permissionId → permissions.id
```

---

## 🚀 Usage

### 1. Protecting API Routes

Use the policy middleware to protect your API endpoints:

```typescript
import { requirePolicy, POLICIES } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Check if user has required policy
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    return authCheck.response; // Returns 401 or 403 error
  }

  // User is authorized! userId is available
  const userId = authCheck.userId;

  // Your protected logic here
  return NextResponse.json({ success: true });
}
```

### 2. Multiple Policy Options

```typescript
import { requireAnyPolicy, requireAllPolicies, POLICIES } from "@/lib/rbac";

// Require ANY of the policies
const authCheck = await requireAnyPolicy(req, [
  POLICIES.CONTENT_VIEW,
  POLICIES.CONTENT_MANAGE
]);

// Require ALL of the policies
const authCheck = await requireAllPolicies(req, [
  POLICIES.USER_VIEW,
  POLICIES.USER_UPDATE
]);
```

### 3. Admin-Only Routes

```typescript
import { requireAdmin } from "@/lib/rbac";

export async function DELETE(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // Only admins can reach this
  // ...
}
```

### 4. Custom Policies

You don't have to use the predefined `POLICIES` constants. Use any policy name:

```typescript
const authCheck = await requirePolicy(req, "blog:publish");
```

Just make sure the policy exists in the database and is assigned to the appropriate roles.

---

## 📋 Admin APIs

All admin APIs require admin access.

### Role Management

```bash
# Get all roles
GET /api/rbac/roles

# Create a role
POST /api/rbac/roles/create
{
  "name": "Author",
  "description": "Can create and edit content",
  "isDefault": false
}

# Update a role
PUT /api/rbac/roles/{roleId}
{
  "name": "Content Editor",
  "description": "Updated description"
}

# Delete a role
DELETE /api/rbac/roles/{roleId}
```

### Policy Management

```bash
# Get all policies
GET /api/rbac/policies

# Create a policy
POST /api/rbac/policies/create
{
  "name": "content:create",
  "description": "Ability to create content",
  "category": "content",
  "displayName": "Create Content"
}

# Update a policy
PUT /api/rbac/policies/{policyId}
{
  "description": "Updated description"
}

# Delete a policy
DELETE /api/rbac/policies/{policyId}
```

### Assign Policies to Roles

```bash
# Get all policies for a role
GET /api/rbac/roles/{roleId}/policies

# Assign policy to role
POST /api/rbac/roles/{roleId}/policies
{
  "policyId": "uuid-of-policy"
}

# Remove policy from role
DELETE /api/rbac/roles/{roleId}/policies
{
  "policyId": "uuid-of-policy"
}
```

### Assign Roles to Users

```bash
# Get all roles for a user
GET /api/rbac/users/{userId}/roles

# Assign role to user
POST /api/rbac/users/{userId}/roles
{
  "roleId": "uuid-of-role"
}

# Remove role from user
DELETE /api/rbac/users/{userId}/roles
{
  "roleId": "uuid-of-role"
}

# Get all policies for a user (computed from their roles)
GET /api/rbac/users/{userId}/policies
```

### Check Permissions

```bash
# Check if current user has a policy
POST /api/rbac/check-permission
{
  "policy": "content:create"
}

# Check multiple policies at once
POST /api/rbac/check-permission
{
  "policies": ["content:create", "content:update", "user:manage"]
}
```

---

## 🎯 Predefined Policies

The system includes these predefined policy constants (you can add more):

```typescript
POLICIES.CONTENT_VIEW      // "content:view"
POLICIES.CONTENT_CREATE    // "content:create"
POLICIES.CONTENT_UPDATE    // "content:update"
POLICIES.CONTENT_DELETE    // "content:delete"
POLICIES.CONTENT_MANAGE    // "content:manage"

POLICIES.USER_VIEW         // "user:view"
POLICIES.USER_CREATE       // "user:create"
POLICIES.USER_UPDATE       // "user:update"
POLICIES.USER_DELETE       // "user:delete"
POLICIES.USER_MANAGE       // "user:manage"

POLICIES.ROLE_VIEW         // "role:view"
POLICIES.ROLE_CREATE       // "role:create"
POLICIES.ROLE_UPDATE       // "role:update"
POLICIES.ROLE_DELETE       // "role:delete"
POLICIES.ROLE_MANAGE       // "role:manage"

// ... and more (see src/lib/rbac/index.ts)
```

---

## 🔄 Workflow Example

### Admin Creates a Role and Assigns Policies

1. Admin creates a new role "Author":
   ```bash
   POST /api/rbac/roles/create
   { "name": "Author", "description": "Content creators" }
   ```

2. Admin assigns policies to the "Author" role:
   ```bash
   POST /api/rbac/roles/{authorRoleId}/policies
   { "policyId": "{content:create-policy-id}" }
   
   POST /api/rbac/roles/{authorRoleId}/policies
   { "policyId": "{content:update-policy-id}" }
   ```

3. Admin assigns the "Author" role to a user:
   ```bash
   POST /api/rbac/users/{userId}/roles
   { "roleId": "{authorRoleId}" }
   ```

4. Now that user can access any API protected with `content:create` or `content:update` policies! ✅

---

## 🧠 Using the RBACService Directly

For server-side checks (not in API routes):

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

// Assign a role to user (admin only)
await RBACService.assignRole(adminUserId, targetUserId, roleId);

// Remove a role from user (admin only)
await RBACService.removeRole(adminUserId, targetUserId, roleId);

// Clear cache
RBACService.clearCache(userId);
RBACService.clearAllCache();
```

---

## ⚡ Performance

- **Caching**: User permissions are cached for 5 minutes to reduce database queries
- **Batch queries**: Uses efficient JOIN queries to fetch permissions
- **Admin bypass**: Admins skip permission checks entirely
- **Legacy support**: Backward compatible with old `users.roleId` field

---

## 🔐 Security

- Admin role has **override access** to everything
- System-managed roles/policies **cannot be modified or deleted**
- All admin operations require admin authentication
- Cache is automatically cleared when roles are assigned/removed

---

## 📝 Migration from Old System

The new system is **backward compatible**. The legacy `users.roleId` field still works, but users can now also have multiple roles via the `user_roles` table.

To fully migrate:
1. Run database migration to add `user_roles` table
2. Optionally migrate existing `users.roleId` to `user_roles` entries
3. Start using the new RBAC APIs

---

## 🧪 Testing Your Implementation

```bash
# 1. Create a policy
POST /api/rbac/policies/create
{ "name": "blog:publish", "description": "Publish blog posts" }

# 2. Create a role
POST /api/rbac/roles/create
{ "name": "Blogger" }

# 3. Assign policy to role
POST /api/rbac/roles/{bloggerId}/policies
{ "policyId": "{blog:publish-policy-id}" }

# 4. Assign role to user
POST /api/rbac/users/{userId}/roles
{ "roleId": "{bloggerId}" }

# 5. Test access
POST /api/rbac/check-permission
{ "policy": "blog:publish" }
# Should return: { "hasAccess": true }
```

---

## 📚 Example API Route

See `src/app/api/examples/EXAMPLE-policy-protected-route.ts` for a complete example.

---

## 🎉 Summary

You now have a powerful, flexible, and efficient policy-based RBAC system!

- Admins control everything via APIs
- Developers just define policy names on routes
- No hard-coded permissions in code
- Simple, maintainable, and scalable

Happy coding! 🚀
