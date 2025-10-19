# 📋 RBAC Implementation Checklist

Use this checklist to ensure your RBAC system is properly set up and working.

---

## ✅ Phase 1: Database Setup

- [ ] **Run the migration script**
  ```bash
  npx tsx scripts/migrate-rbac.ts
  ```
  - Creates `user_roles` table
  - Adds `resource` and `action` columns to `permissions`
  - Creates performance indexes
  - Migrates existing `users.roleId` to `user_roles`

- [ ] **Verify migration**
  ```sql
  -- Check if user_roles table exists
  SELECT * FROM user_roles LIMIT 1;
  
  -- Check if permissions table has new columns
  SELECT resource, action FROM permissions LIMIT 1;
  ```

---

## ✅ Phase 2: Seed Default Data

- [ ] **Run the seeding script**
  ```bash
  npx tsx scripts/seed-rbac.ts
  ```
  - Creates 3 default roles (Admin, Author, User)
  - Creates 30+ common policies
  - Links policies to appropriate roles

- [ ] **Verify seeding**
  ```sql
  -- Should show Admin, Author, User
  SELECT name FROM roles;
  
  -- Should show 30+ policies
  SELECT COUNT(*) FROM permissions;
  ```

---

## ✅ Phase 3: Assign Admin Access

- [ ] **Find your user ID**
  ```sql
  SELECT id, email FROM users WHERE email = 'your-email@example.com';
  ```

- [ ] **Find Admin role ID**
  ```sql
  SELECT id FROM roles WHERE name = 'Admin';
  ```

- [ ] **Assign Admin role to yourself**
  ```sql
  INSERT INTO user_roles (user_id, role_id)
  VALUES ('your-user-id', 'admin-role-id');
  ```

- [ ] **Verify admin access**
  ```bash
  # Should return list of roles
  curl -X GET http://localhost:3000/api/rbac/roles \
    -H "Authorization: Bearer your-token"
  ```

---

## ✅ Phase 4: Test Basic Functionality

- [ ] **Test fetching roles**
  ```bash
  GET /api/rbac/roles
  # Should return: Admin, Author, User
  ```

- [ ] **Test fetching policies**
  ```bash
  GET /api/rbac/policies
  # Should return: content:view, content:create, etc.
  ```

- [ ] **Test permission check**
  ```bash
  POST /api/rbac/check-permission
  { "policy": "user:manage" }
  # Should return: { "hasAccess": true }
  ```

---

## ✅ Phase 5: Create Custom Policy

- [ ] **Create a custom policy**
  ```bash
  POST /api/rbac/policies/create
  {
    "name": "blog:publish",
    "description": "Ability to publish blog posts",
    "category": "blog",
    "displayName": "Publish Blog Posts"
  }
  ```

- [ ] **Verify policy created**
  ```bash
  GET /api/rbac/policies
  # Should include blog:publish
  ```

---

## ✅ Phase 6: Assign Policy to Role

- [ ] **Get Author role ID**
  ```bash
  GET /api/rbac/roles
  # Copy the ID of "Author" role
  ```

- [ ] **Get policy ID**
  ```bash
  GET /api/rbac/policies
  # Copy the ID of "blog:publish" policy
  ```

- [ ] **Assign policy to role**
  ```bash
  POST /api/rbac/roles/{authorRoleId}/policies
  { "policyId": "{blogPublishPolicyId}" }
  ```

- [ ] **Verify assignment**
  ```bash
  GET /api/rbac/roles/{authorRoleId}/policies
  # Should include blog:publish
  ```

---

## ✅ Phase 7: Assign Role to User

- [ ] **Create or get test user ID**
  ```sql
  SELECT id FROM users WHERE email = 'testuser@example.com';
  ```

- [ ] **Assign Author role to test user**
  ```bash
  POST /api/rbac/users/{userId}/roles
  { "roleId": "{authorRoleId}" }
  ```

- [ ] **Verify role assignment**
  ```bash
  GET /api/rbac/users/{userId}/roles
  # Should show Author role
  ```

- [ ] **Check user's policies**
  ```bash
  GET /api/rbac/users/{userId}/policies
  # Should include all Author policies including blog:publish
  ```

---

## ✅ Phase 8: Protect an API Route

- [ ] **Create a protected route**
  ```typescript
  // src/app/api/blog/publish/route.ts
  import { requirePolicy, POLICIES } from "@/lib/rbac";
  import { NextRequest, NextResponse } from "next/server";

  export async function POST(req: NextRequest) {
    const authCheck = await requirePolicy(req, "blog:publish");
    if (!authCheck.authorized) return authCheck.response;
    
    // Your publish logic here
    return NextResponse.json({ success: true });
  }
  ```

- [ ] **Test as admin (should work)**
  ```bash
  POST /api/blog/publish
  # Should return: { "success": true }
  ```

- [ ] **Test as Author (should work)**
  ```bash
  POST /api/blog/publish
  # (as user with Author role)
  # Should return: { "success": true }
  ```

- [ ] **Test as regular User (should fail)**
  ```bash
  POST /api/blog/publish
  # (as user with only User role)
  # Should return: 403 Forbidden
  ```

---

## ✅ Phase 9: Test Multiple Roles

- [ ] **Assign multiple roles to a user**
  ```bash
  POST /api/rbac/users/{userId}/roles
  { "roleId": "{userRoleId}" }
  
  POST /api/rbac/users/{userId}/roles
  { "roleId": "{authorRoleId}" }
  ```

- [ ] **Verify user has combined policies**
  ```bash
  GET /api/rbac/users/{userId}/policies
  # Should show policies from both User and Author roles
  ```

---

## ✅ Phase 10: Production Readiness

- [ ] **Review all created policies**
  - Are they following `resource:action` format?
  - Are descriptions clear?
  - Are categories meaningful?

- [ ] **Review all created roles**
  - Do they have appropriate policies?
  - Are descriptions clear?
  - Is the default role set correctly?

- [ ] **Test caching**
  - Make a policy check
  - Change user's role
  - Verify cache is cleared (should reflect new permissions)

- [ ] **Test admin override**
  - Admin should have access to all policies
  - Even without explicit policy assignments

- [ ] **Security check**
  - System-managed roles cannot be deleted
  - System-managed policies cannot be deleted
  - Only admins can access RBAC APIs

---

## ✅ Phase 11: Documentation

- [ ] **Read the full guide**
  - Review `docs/RBAC-GUIDE.md`

- [ ] **Read the setup guide**
  - Review `docs/RBAC-SETUP.md`

- [ ] **Review the example**
  - Check `src/app/api/examples/EXAMPLE-policy-protected-route.ts`

- [ ] **Understand the types**
  - Review `src/lib/rbac/types.ts`

---

## ✅ Phase 12: Clean Up

- [ ] **Delete example file (optional)**
  ```bash
  rm src/app/api/examples/EXAMPLE-policy-protected-route.ts
  ```

- [ ] **Remove test policies/roles (if any)**
  ```bash
  DELETE /api/rbac/policies/{testPolicyId}
  DELETE /api/rbac/roles/{testRoleId}
  ```

---

## 🎉 Congratulations!

If you've completed all checkboxes, your RBAC system is fully set up and ready for production!

### Quick Reference

**Protect a route:**
```typescript
import { requirePolicy, POLICIES } from "@/lib/rbac";

const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
if (!authCheck.authorized) return authCheck.response;
```

**Check permissions in code:**
```typescript
import { RBACService } from "@/lib/rbac";

const hasAccess = await RBACService.hasPolicy(userId, "content:create");
```

**Admin APIs:**
- Roles: `/api/rbac/roles`
- Policies: `/api/rbac/policies`
- User Roles: `/api/rbac/users/{userId}/roles`

---

## 📞 Need Help?

- Check `docs/RBAC-GUIDE.md` for detailed documentation
- Review `docs/RBAC-SUMMARY.md` for implementation details
- Look at example routes for usage patterns

**Happy Coding!** 🚀
