# Policy-Based RBAC Migration - Complete Update Summary

## Overview
Successfully converted the system from a legacy hybrid RBAC (with `users.roleId`) to a **pure policy-based RBAC system** using the `user_roles` many-to-many table.

## Migration Date
$(date)

---

## 🔄 Changes Made

### 1. Database Schema Updates

#### Removed from `users` table:
- ❌ `roleId` column (integer foreign key)
- ❌ Foreign key constraint `users_role_id_roles_id_fk`

#### Using exclusively:
- ✅ `user_roles` table (many-to-many relationship)
  - `userId` (references users)
  - `roleId` (references roles)
  - `assignedAt` timestamp

### 2. Core Service Updates

#### `src/lib/rbac/rbac-service.ts`
**Changes:**
- Removed all `users.roleId` references
- `getUserRoles()` now queries only `user_roles` table
- `getUserPolicies()` uses `user_roles` JOIN instead of direct `users.roleId`
- Removed unused `users` import

**Example (Before → After):**
```typescript
// BEFORE: Mixed approach
const userWithRole = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { role: { with: { policies: true } } }
});

// AFTER: Pure user_roles approach  
const userRolesRecords = await db.query.userRoles.findMany({
  where: eq(userRoles.userId, userId),
  with: { role: { with: { policies: true } } }
});
```

#### `src/server/services/permissions.ts`
**Changes:**
- Updated `getUserPermissions()` to use `user_roles` table
- Updated `setUserRole()` to insert into `user_roles` (removed `users.roleId` update)
- Updated `hasPermission()` to query via `user_roles`
- Removed unused `users` import

#### `src/server/services/auth.ts`
**Changes:**
- `registerUser()` now assigns default role via `user_roles` table insert
- Removed `roleId: userRole.id` from user creation
- Added case-insensitive role lookup with fallback to `isDefault` flag

**Example:**
```typescript
// Create user (without roleId)
const [newUser] = await db.insert(users).values({
  id: uuidv4(),
  email: email.toLowerCase(),
  password: hashedPassword,
  // roleId: userRole.id, ← REMOVED
});

// Assign role via user_roles table
const { userRoles } = await import("@/server/db/schema");
await db.insert(userRoles).values({
  userId: newUser.id,
  roleId: defaultRole.id,
});
```

#### `src/config/auth.ts` (NextAuth JWT Callback)
**Changes:**
- JWT callback now uses `RBACService.getUserRoles(userId)` to fetch roles
- Stores first role in `token.role` (for backward compatibility)
- Removed direct `users.roleId` query

**Example:**
```typescript
// Get user's roles from user_roles table
const { RBACService } = await import("@/lib/rbac");
const userRoles = await RBACService.getUserRoles(token.sub as string);

// Set role to first role or 'user' if no roles
token.role = userRoles.length > 0 ? userRoles[0] : 'user';
```

### 3. Middleware Updates

#### `middleware.ts` - **Policy-Based Access Control**
**Major Changes:**
- Added `ROUTE_POLICY_MAP` for route → policy mapping
- Implemented `hasRequiredPolicy()` function using `RBACService`
- Replaced role-name checking with policy checking
- Updated user object to use `token.role` instead of `token.roleId`

**Policy Mapping:**
```typescript
const ROUTE_POLICY_MAP: Record<string, string> = {
  '/protected/admin': 'admin:access',
  '/protected/profile': 'profile:view',
  '/protected/account': 'account:manage',
  '/protected/settings': 'settings:manage',
  '/protected/user': 'user:access',
};
```

**Access Control Flow:**
1. User hits protected route → middleware extracts JWT token
2. Middleware calls `hasRequiredPolicy(userId, path)`
3. `RBACService.hasPolicy()` checks if user has required policy
4. Access granted/denied based on policy check result
5. Failed access → redirect to `/protected/user/dashboard?error=Forbidden`

**Before vs After:**
```typescript
// BEFORE: Role-name based (simplified)
if (path.startsWith('/protected/admin') && getUserRole() !== 'admin') {
  return redirect('/forbidden');
}

// AFTER: Policy-based
const hasAccess = await hasRequiredPolicy(user.id, path);
if (!hasAccess) {
  return redirect('/protected/user/dashboard?error=Forbidden');
}
```

---

## 🗂️ File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| `src/server/db/schema/schema.ts` | ✅ Updated | Removed `roleId` from users table |
| `src/lib/rbac/rbac-service.ts` | ✅ Updated | Removed legacy roleId logic |
| `src/server/services/permissions.ts` | ✅ Updated | Uses user_roles table exclusively |
| `src/server/services/auth.ts` | ✅ Updated | Registration assigns role via user_roles |
| `src/config/auth.ts` | ✅ Updated | JWT callback uses RBACService |
| `middleware.ts` | ✅ Updated | Policy-based access control |
| `scripts/drop-roleid-column.ts` | ✅ Created | Database migration script |

---

## 📋 Migration Checklist

### Completed ✅
- [x] Remove `roleId` from schema definition
- [x] Update RBACService to use user_roles table
- [x] Update PermissionService to use user_roles table  
- [x] Update AuthService registration logic
- [x] Update NextAuth JWT callback
- [x] Convert middleware to policy-based access control
- [x] Create database migration script

### To Execute 🔄
- [ ] Run database migration: `npx tsx scripts/drop-roleid-column.ts`
- [ ] Test user registration flow
- [ ] Test user login and JWT token generation
- [ ] Test middleware policy enforcement
- [ ] Test admin role access to protected routes
- [ ] Test regular user access restrictions
- [ ] Verify seed data created roles correctly

---

## 🚀 Next Steps

### 1. Run Database Migration
```bash
npx tsx scripts/drop-roleid-column.ts
```

This will:
- Check if `role_id` column exists
- Drop the foreign key constraint `users_role_id_roles_id_fk`
- Drop the `role_id` column from users table

### 2. Test Complete Flow

#### Test Registration:
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

**Expected Result:**
- User created in `users` table (without `roleId`)
- Default 'user' role assigned via `user_roles` table
- Verification email sent

#### Test Login:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Expected Result:**
- JWT token contains `role` field from RBACService
- Token includes first role from user_roles (e.g., "user")

#### Test Middleware:
1. **User Access Test:**
   - Login as regular user
   - Access `/protected/user/dashboard` → ✅ Allowed (policy: `user:access`)
   - Try `/protected/admin/dashboard` → 🚫 Denied (lacks `admin:access` policy)

2. **Admin Access Test:**
   - Login as admin user
   - Access `/protected/admin/dashboard` → ✅ Allowed (policy: `admin:access`)
   - Access `/protected/user/dashboard` → ✅ Allowed (admin has all policies)

### 3. Verify Policy Enforcement

Check logs in development mode:
```
[MIDDLEWARE] 🔐 Policy check: admin:access for /protected/admin = false
[MIDDLEWARE] 🚫 Policy check failed for /protected/admin
```

### 4. Update Documentation

Add note to RBAC documentation:
- Migration completed on [DATE]
- System now uses pure policy-based access control
- No legacy `users.roleId` references remain

---

## 🔧 Troubleshooting

### Issue: Users can't access protected routes
**Solution:**
1. Check if user has roles assigned in `user_roles` table
2. Check if role has policies assigned in `role_permissions` table
3. Verify JWT token contains `role` field
4. Check middleware logs for policy check results

### Issue: Migration script fails
**Solution:**
1. Ensure database connection is active
2. Check if column already dropped (script is idempotent)
3. Manually verify constraints: 
   ```sql
   SELECT constraint_name FROM information_schema.table_constraints 
   WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY';
   ```

### Issue: Registration fails
**Solution:**
1. Verify default 'user' role exists in `roles` table
2. Check if role has `isDefault = true` flag
3. Check database logs for insertion errors

---

## 📊 Policy System Overview

### Default Policies (30+ policies defined)
- **Content:** `content:view`, `content:create`, `content:update`, `content:delete`, `content:manage`
- **Users:** `user:view`, `user:create`, `user:update`, `user:delete`, `user:manage`
- **Roles:** `role:view`, `role:create`, `role:update`, `role:delete`, `role:manage`
- **Policies:** `policy:view`, `policy:create`, `policy:update`, `policy:delete`, `policy:manage`
- **Admin:** `admin:access`, `settings:manage`, `analytics:manage`

### Default Roles (from seed script)
1. **Admin** - All policies (30+ policies)
2. **Author** - Content policies + profile/account management
3. **User** - Basic policies (profile:view, account:manage, user:access)

---

## 💡 Best Practices

### Adding New Protected Routes
1. Add policy to `ROUTE_POLICY_MAP` in `middleware.ts`:
   ```typescript
   '/protected/billing': 'billing:view',
   ```

2. Ensure policy exists in `permissions` table (or add via RBAC API)

3. Assign policy to appropriate roles via:
   ```bash
   POST /api/rbac/roles/{roleId}/policies
   ```

### Granting User Access
Instead of updating `users.roleId` (which doesn't exist anymore):
```typescript
// Assign role to user via API
POST /api/rbac/users/{userId}/roles
{
  "roleId": "role-uuid-here"
}

// Or programmatically:
await RBACService.assignRole(userId, roleId);
```

---

## 🎯 Summary

**What Changed:**
- ❌ No more `users.roleId` column
- ✅ Pure many-to-many user_roles relationship
- ✅ Policy-based middleware access control
- ✅ RBACService as single source of truth

**Benefits:**
1. **Flexibility:** Users can have multiple roles
2. **Clarity:** Single pattern for role assignment (user_roles table)
3. **Security:** Policy-based access control with fail-secure defaults
4. **Scalability:** Easy to add new policies and roles without schema changes

**Migration Status:** ✅ Code Complete | 🔄 Database Migration Pending

---

## 📚 Related Documentation
- `docs/RBAC-GUIDE.md` - Complete RBAC usage guide
- `docs/RBAC-SETUP.md` - Initial setup instructions  
- `docs/RBAC-API.md` - API endpoints reference
- `docs/RBAC-CHECKLIST.md` - Implementation checklist
- `docs/RBAC-SUMMARY.md` - System overview

---

**Generated:** $(date)
**Author:** AI Assistant
**Status:** Complete - Ready for Database Migration
