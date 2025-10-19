# API Routes Migration - Legacy roleId Removed

## Summary
All admin API routes have been updated to use the `user_roles` many-to-many table instead of the legacy `users.roleId` column.

## Files Updated

### 1. **`src/app/api/admin/roles/route.ts`**
**Changes:**
- User count query now uses `userRoles` table instead of `users.roleId`
- Changed JOIN from `users` to `userRoles` for counting users per role

**Before:**
```typescript
.leftJoin(users, eq(roles.id, users.roleId))
```

**After:**
```typescript
.leftJoin(userRoles, eq(roles.id, userRoles.roleId))
```

---

### 2. **`src/app/api/admin/user-roles/route.ts`**
**Changes:**
- Complete rewrite to use `user_roles` table
- GET: Lists all user-role assignments via JOIN
- POST: Inserts into `user_roles` table (not `users.roleId`)
- DELETE: Deletes from `user_roles` table

**Before:**
```typescript
// Updated users.roleId directly
await db.update(users)
  .set({ roleId, updatedAt: new Date().toISOString() })
  .where(eq(users.id, userId));
```

**After:**
```typescript
// Inserts into user_roles table
await db.insert(userRoles).values({
  userId,
  roleId,
  assignedBy: session.user.id,
});
```

---

### 3. **`src/app/api/admin/users/route.ts`**
**Changes:**
- GET: User list now JOINs `userRoles` and `roles` tables
- PATCH: Updates role via `user_roles` table
- Removed `roleId` from user columns (doesn't exist anymore)

**Before:**
```typescript
.select({
  roleId: users.roleId,
  role: roles.name
})
.leftJoin(roles, eq(users.roleId, roles.id))
```

**After:**
```typescript
.select({
  roleId: roles.id,
  role: roles.name
})
.leftJoin(userRoles, eq(users.id, userRoles.userId))
.leftJoin(roles, eq(userRoles.roleId, roles.id))
```

**PATCH endpoint:**
- Deletes existing role assignments from `user_roles`
- Inserts new role assignment into `user_roles`
- Tracks `assignedBy` field

---

### 4. **`src/app/api/admin/users/create/route.ts`**
**Changes:**
- User creation no longer sets `users.roleId`
- Role assigned via INSERT into `user_roles` table
- Parameter renamed from `role` to `roleName` for clarity
- Finds role by name, then inserts into `user_roles`

**Before:**
```typescript
await db.insert(users).values({
  roleId: role || 'user',
  // ...
});
```

**After:**
```typescript
// Create user (no roleId)
await db.insert(users).values({ /* ... */ });

// Assign role via user_roles
await db.insert(userRoles).values({
  userId: newUser.id,
  roleId: roleToAssign.id,
});
```

---

### 5. **`src/app/api/admin/roles/[roleId]/route.ts`**
**Changes:**
- DELETE validation now checks `user_roles` table
- Prevents deleting roles that are assigned to users

**Before:**
```typescript
const assignedUsers = await db.select()
  .from(users)
  .where(eq(users.roleId, roleId));
```

**After:**
```typescript
const { userRoles } = await import('@/server/db/schema');
const assignedUsers = await db.select()
  .from(userRoles)
  .where(eq(userRoles.roleId, roleId));
```

---

## API Endpoint Changes

### Affected Endpoints

| Endpoint | Method | Change Summary |
|----------|--------|----------------|
| `/api/admin/roles` | GET | Uses `userRoles` for user count |
| `/api/admin/user-roles` | GET | Returns user-role assignments from `user_roles` table |
| `/api/admin/user-roles` | POST | Inserts into `user_roles` table |
| `/api/admin/user-roles` | DELETE | Deletes from `user_roles` table |
| `/api/admin/users` | GET | JOINs through `user_roles` table |
| `/api/admin/users` | PATCH | Updates via `user_roles` table |
| `/api/admin/users/create` | POST | Assigns role via `user_roles` insert |
| `/api/admin/roles/[roleId]` | DELETE | Checks `user_roles` before deleting |

---

## Request/Response Changes

### POST `/api/admin/user-roles`
**Before:**
```json
{
  "userId": "uuid",
  "roleId": "uuid"
}
```

**After:** (same, but now inserts into `user_roles` table)
```json
{
  "userId": "uuid",
  "roleId": "uuid"
}
```

**Response includes:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "uuid",
      "userId": "uuid",
      "roleId": "uuid",
      "assignedBy": "admin-uuid",
      "assignedAt": "2025-10-19T..."
    }
  }
}
```

---

### POST `/api/admin/users/create`
**Parameter Change:**
- `role` → `roleName` (for clarity)

**Before:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "role": "user"
}
```

**After:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "roleName": "User"  // Changed parameter name, case-sensitive
}
```

---

### PATCH `/api/admin/users`
**Parameter Change:**
- `role` → `roleName`

**Before:**
```json
{
  "userId": "uuid",
  "role": "admin"
}
```

**After:**
```json
{
  "userId": "uuid",
  "roleName": "Admin"  // Case-sensitive role name
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated to Admin",
  "data": {
    "userId": "uuid",
    "oldRoles": ["User"],  // Array of old role names
    "newRole": "Admin"     // New role name
  }
}
```

---

## Database Query Patterns

### Pattern 1: Get User's Roles
**Before:**
```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { role: true }
});
```

**After:**
```typescript
const userRolesRecords = await db.query.userRoles.findMany({
  where: eq(userRoles.userId, userId),
  with: { role: true }
});
```

---

### Pattern 2: Count Users per Role
**Before:**
```typescript
db.select({ roleId: roles.id, count: count() })
  .from(roles)
  .leftJoin(users, eq(roles.id, users.roleId))
  .groupBy(roles.id)
```

**After:**
```typescript
db.select({ roleId: roles.id, count: count() })
  .from(roles)
  .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
  .groupBy(roles.id)
```

---

### Pattern 3: Assign Role to User
**Before:**
```typescript
await db.update(users)
  .set({ roleId: newRoleId })
  .where(eq(users.id, userId));
```

**After:**
```typescript
// Remove old assignments
await db.delete(userRoles)
  .where(eq(userRoles.userId, userId));

// Add new assignment
await db.insert(userRoles).values({
  userId,
  roleId: newRoleId,
  assignedBy: adminId
});
```

---

## Testing Checklist

- [x] GET `/api/admin/roles` - Returns roles with user counts
- [ ] GET `/api/admin/user-roles` - Returns user-role assignments
- [ ] POST `/api/admin/user-roles` - Assigns role to user
- [ ] DELETE `/api/admin/user-roles` - Removes role from user
- [ ] GET `/api/admin/users` - Returns users with their roles
- [ ] PATCH `/api/admin/users` - Updates user's role
- [ ] POST `/api/admin/users/create` - Creates user with role
- [ ] DELETE `/api/admin/roles/[roleId]` - Prevents deleting assigned roles

---

## Migration Notes

1. **Case Sensitivity**: Role names are now case-sensitive ('User' vs 'user')
2. **Multiple Roles**: Users can now have multiple roles (though UI may show only first)
3. **Assignment Tracking**: `user_roles.assignedBy` tracks who assigned the role
4. **Timestamps**: `user_roles.assignedAt` tracks when role was assigned

---

## Rollback Plan

If needed to rollback:
1. Re-add `roleId` column to `users` table
2. Migrate data from `user_roles` back to `users.roleId` (take first role)
3. Revert all API route files from git history
4. Update schema and relations

---

**Status:** ✅ All API routes updated and lint-error free
**Date:** October 19, 2025
**Migration:** Complete - ready for testing
