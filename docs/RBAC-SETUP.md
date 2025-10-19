# Quick Setup Guide - Policy-Based RBAC

Follow these steps to set up the RBAC system in your application.

---

## 🚀 Step 1: Run Database Migration

This creates the `user_roles` table and updates the `permissions` table:

```bash
npx tsx scripts/migrate-rbac.ts
```

**OR** if you're using Drizzle ORM directly:

```bash
npx drizzle-kit push
```

---

## 🌱 Step 2: Seed Default Roles and Policies

This creates default roles (Admin, Author, User) and common policies:

```bash
npx tsx scripts/seed-rbac.ts
```

This will create:
- **Admin role**: Full system access
- **Author role**: Can create/edit content
- **User role**: Can view content
- **30+ default policies** for common operations

---

## 👤 Step 3: Assign Admin Role to Your User

You need to manually assign the Admin role to your first user. Run this in your database:

```sql
-- Get your user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Get Admin role ID
SELECT id FROM roles WHERE name = 'Admin';

-- Assign Admin role to your user
INSERT INTO user_roles (user_id, role_id)
VALUES ('your-user-id', 'admin-role-id');
```

**OR** use the API (if you already have an admin):

```bash
POST /api/rbac/users/{userId}/roles
{
  "roleId": "{adminRoleId}"
}
```

---

## ✅ Step 4: Verify Setup

Test that everything works:

```bash
# Check if you can access admin endpoint
GET /api/rbac/roles
# Should return list of roles

# Check your permissions
POST /api/rbac/check-permission
{
  "policy": "user:manage"
}
# Should return: { "hasAccess": true }
```

---

## 🎯 Step 5: Start Using It!

### Protect an API Route

```typescript
import { requirePolicy, POLICIES } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // Your protected code here
  return NextResponse.json({ success: true });
}
```

### Create Custom Policies

```bash
POST /api/rbac/policies/create
{
  "name": "blog:publish",
  "description": "Publish blog posts",
  "category": "blog",
  "displayName": "Publish Blog Posts"
}
```

### Assign Policies to Roles

```bash
POST /api/rbac/roles/{roleId}/policies
{
  "policyId": "{policyId}"
}
```

### Assign Roles to Users

```bash
POST /api/rbac/users/{userId}/roles
{
  "roleId": "{roleId}"
}
```

---

## 📚 Next Steps

- Read the full guide: `docs/RBAC-GUIDE.md`
- Check the example route: `src/app/api/examples/EXAMPLE-policy-protected-route.ts`
- Explore the API endpoints in `src/app/api/rbac/`

---

## 🔧 Troubleshooting

### Migration Fails?

Make sure your database connection is working:
```bash
npx tsx scripts/test-connection.ts
```

### Can't Access Admin APIs?

Make sure you've assigned the Admin role to your user (Step 3).

### Cache Issues?

Clear the RBAC cache:
```typescript
import { RBACService } from "@/lib/rbac";
RBACService.clearAllCache();
```

---

## 🎉 You're All Set!

Your policy-based RBAC system is now ready to use. Happy coding! 🚀
