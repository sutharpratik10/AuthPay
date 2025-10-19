# Admin Users Page Fix - Parameter Naming Issue

## Problem
The Admin Users page at `/protected/admin/users` was showing an error:
```
Error: User ID and role name are required
```

Users were unable to assign roles using the "Select role" dropdown in the "Role Edit" column.

## Root Cause
**Parameter mismatch between frontend and backend:**

### Frontend (AdminUsersPage.tsx)
Was sending:
```typescript
{ userId, role: newRole }
```

### Backend API (src/app/api/admin/users/route.ts)
Expected:
```typescript
{ userId, roleName: newRole }
```

This mismatch occurred because we recently updated all admin API routes to use the `user_roles` table and changed the parameter from `role` to `roleName` for clarity and consistency.

## Solution

### 1. Fixed `updateUserRole` function
**File:** `src/components/admin/AdminUsersPage.tsx` (Line ~251)

**Before:**
```typescript
body: JSON.stringify({ userId, role: newRole }),
```

**After:**
```typescript
body: JSON.stringify({ userId, roleName: newRole }),
```

### 2. Fixed `createUser` function
**File:** `src/components/admin/AdminUsersPage.tsx` (Line ~219)

**Before:**
```typescript
body: JSON.stringify(formData),  // formData.role
```

**After:**
```typescript
const payload = {
  email: formData.email,
  name: formData.name,
  password: formData.password,
  roleName: formData.role,  // Transform 'role' to 'roleName'
  isActive: formData.isActive,
  isEmailVerified: formData.isEmailVerified,
};
body: JSON.stringify(payload),
```

## Changes Summary

| Function | Parameter Changed | Impact |
|----------|------------------|--------|
| `updateUserRole()` | `role` → `roleName` | Fixes role assignment dropdown |
| `createUser()` | `formData` transformed to use `roleName` | Fixes user creation with role |

## API Endpoints Affected

### PATCH `/api/admin/users`
**Expected Request Body:**
```json
{
  "userId": "uuid",
  "roleName": "Admin"  // ← Changed from "role"
}
```

### POST `/api/admin/users/create`
**Expected Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "roleName": "User"  // ← Changed from "role"
}
```

## Testing Checklist

- [x] Role dropdown in "Role Edit" column works
- [x] Can assign "Admin" role to users
- [x] Can assign "User" role to users
- [x] Can assign custom roles (if any)
- [ ] Create new user with role selection works
- [ ] No console errors when selecting roles
- [ ] Toast notifications show success messages

## Related Changes

This fix is part of the larger migration from `users.roleId` to the `user_roles` many-to-many table. Related files updated:

1. **Backend API Routes:**
   - `src/app/api/admin/users/route.ts` - PATCH endpoint
   - `src/app/api/admin/users/create/route.ts` - POST endpoint

2. **Frontend Components:**
   - `src/components/admin/AdminUsersPage.tsx` - This file

## User Impact

**Before:** ❌ Error message appears, roles cannot be assigned
**After:** ✅ Roles can be assigned via dropdown, success message appears

## Additional Notes

- The parameter name change from `role` to `roleName` was intentional to distinguish between:
  - `role` (string value like "admin")
  - `roleName` (the actual role name from the roles table)
  - `roleId` (UUID of the role - used internally)

- This naming convention is now consistent across all admin API endpoints.

---

**Status:** ✅ Fixed
**Date:** October 19, 2025
**Impact:** Admin users page role assignment now working
