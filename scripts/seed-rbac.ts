/**
 * RBAC Seed Script
 * 
 * Bootstraps default permissions, roles, and role-permission assignments.
 * This script is idempotent — safe to run multiple times.
 * 
 * Usage: npx tsx scripts/seed-rbac.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../src/server/db";
import { permissions, roles, rolePermissions, userRoles } from "../src/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ─── Default Permissions ─────────────────────────────────────────────
// These are seeded into the DB. After seeding, the DB is the sole source of truth.
// Admins can create additional permissions via the admin panel.

interface PermissionSeed {
  name: string;
  description: string;
  category: string;
  displayName: string;
  resource: string;
  action: string;
  isSystemManaged: boolean;
}

const DEFAULT_PERMISSIONS: PermissionSeed[] = [
  // Content Management
  { name: "content:view", description: "View content", category: "Content", displayName: "View Content", resource: "content", action: "view", isSystemManaged: true },
  { name: "content:create", description: "Create content", category: "Content", displayName: "Create Content", resource: "content", action: "create", isSystemManaged: true },
  { name: "content:update", description: "Update content", category: "Content", displayName: "Update Content", resource: "content", action: "update", isSystemManaged: true },
  { name: "content:delete", description: "Delete content", category: "Content", displayName: "Delete Content", resource: "content", action: "delete", isSystemManaged: true },
  { name: "content:manage", description: "Full content management (implies view, create, update, delete)", category: "Content", displayName: "Manage Content", resource: "content", action: "manage", isSystemManaged: true },

  // User Management
  { name: "user:view", description: "View user accounts", category: "User Management", displayName: "View Users", resource: "user", action: "view", isSystemManaged: true },
  { name: "user:create", description: "Create user accounts", category: "User Management", displayName: "Create Users", resource: "user", action: "create", isSystemManaged: true },
  { name: "user:update", description: "Update user accounts", category: "User Management", displayName: "Update Users", resource: "user", action: "update", isSystemManaged: true },
  { name: "user:delete", description: "Delete user accounts", category: "User Management", displayName: "Delete Users", resource: "user", action: "delete", isSystemManaged: true },
  { name: "user:manage", description: "Full user management (implies view, create, update, delete)", category: "User Management", displayName: "Manage Users", resource: "user", action: "manage", isSystemManaged: true },

  // Role Management
  { name: "role:view", description: "View roles", category: "Role Management", displayName: "View Roles", resource: "role", action: "view", isSystemManaged: true },
  { name: "role:create", description: "Create roles", category: "Role Management", displayName: "Create Roles", resource: "role", action: "create", isSystemManaged: true },
  { name: "role:update", description: "Update roles", category: "Role Management", displayName: "Update Roles", resource: "role", action: "update", isSystemManaged: true },
  { name: "role:delete", description: "Delete roles", category: "Role Management", displayName: "Delete Roles", resource: "role", action: "delete", isSystemManaged: true },
  { name: "role:manage", description: "Full role management (implies view, create, update, delete)", category: "Role Management", displayName: "Manage Roles", resource: "role", action: "manage", isSystemManaged: true },

  // Permission/Policy Management
  { name: "policy:view", description: "View permissions/policies", category: "Permission Management", displayName: "View Permissions", resource: "policy", action: "view", isSystemManaged: true },
  { name: "policy:create", description: "Create permissions/policies", category: "Permission Management", displayName: "Create Permissions", resource: "policy", action: "create", isSystemManaged: true },
  { name: "policy:update", description: "Update permissions/policies", category: "Permission Management", displayName: "Update Permissions", resource: "policy", action: "update", isSystemManaged: true },
  { name: "policy:delete", description: "Delete permissions/policies", category: "Permission Management", displayName: "Delete Permissions", resource: "policy", action: "delete", isSystemManaged: true },
  { name: "policy:manage", description: "Full permission management (implies view, create, update, delete)", category: "Permission Management", displayName: "Manage Permissions", resource: "policy", action: "manage", isSystemManaged: true },

  // Billing Management
  { name: "billing:view", description: "View billing information", category: "Billing", displayName: "View Billing", resource: "billing", action: "view", isSystemManaged: true },
  { name: "billing:create", description: "Create billing records", category: "Billing", displayName: "Create Billing", resource: "billing", action: "create", isSystemManaged: true },
  { name: "billing:update", description: "Update billing records", category: "Billing", displayName: "Update Billing", resource: "billing", action: "update", isSystemManaged: true },
  { name: "billing:manage", description: "Full billing management (implies view, create, update)", category: "Billing", displayName: "Manage Billing", resource: "billing", action: "manage", isSystemManaged: true },

  // Analytics
  { name: "analytics:view", description: "View analytics dashboards", category: "Analytics", displayName: "View Analytics", resource: "analytics", action: "view", isSystemManaged: true },
  { name: "analytics:manage", description: "Full analytics management (implies view)", category: "Analytics", displayName: "Manage Analytics", resource: "analytics", action: "manage", isSystemManaged: true },

  // System Settings
  { name: "settings:view", description: "View system settings", category: "Settings", displayName: "View Settings", resource: "settings", action: "view", isSystemManaged: true },
  { name: "settings:update", description: "Update system settings", category: "Settings", displayName: "Update Settings", resource: "settings", action: "update", isSystemManaged: true },
  { name: "settings:manage", description: "Full settings management (implies view, update)", category: "Settings", displayName: "Manage Settings", resource: "settings", action: "manage", isSystemManaged: true },

  // Profile Management
  { name: "profile:view", description: "View own profile", category: "Profile", displayName: "View Profile", resource: "profile", action: "view", isSystemManaged: true },
  { name: "profile:update", description: "Update own profile", category: "Profile", displayName: "Update Profile", resource: "profile", action: "update", isSystemManaged: true },

  // Account Management
  { name: "account:view", description: "View own account details", category: "Account", displayName: "View Account", resource: "account", action: "view", isSystemManaged: true },
  { name: "account:manage", description: "Full account management", category: "Account", displayName: "Manage Account", resource: "account", action: "manage", isSystemManaged: true },

  // Admin Access
  { name: "admin:access", description: "Access admin panel and admin features", category: "Admin", displayName: "Admin Access", resource: "admin", action: "access", isSystemManaged: true },

  // User Access (default for all authenticated users)
  { name: "user:access", description: "Basic authenticated user access", category: "User", displayName: "User Access", resource: "user", action: "access", isSystemManaged: true },
];

// ─── Default Roles ───────────────────────────────────────────────────

interface RoleSeed {
  name: string;
  description: string;
  isDefault: boolean;
  isSystemManaged: boolean;
  isSuperAdmin: boolean;
  priority: number;
  permissions: string[]; // permission names to assign
}

const DEFAULT_ROLES: RoleSeed[] = [
  {
    name: "Super Admin",
    description: "Super Administrator with full, unrestricted access. Cannot be modified or deleted.",
    isDefault: false,
    isSystemManaged: true,
    isSuperAdmin: true,
    priority: 100,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name), // ALL permissions
  },
  {
    name: "Admin",
    description: "Administrator with full access to admin panel and management features.",
    isDefault: false,
    isSystemManaged: true,
    isSuperAdmin: false,
    priority: 80,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name), // ALL permissions (can be customized later)
  },
  {
    name: "Moderator",
    description: "Moderator with user and content management capabilities.",
    isDefault: false,
    isSystemManaged: false,
    isSuperAdmin: false,
    priority: 50,
    permissions: [
      "user:view", "user:update",
      "content:view", "content:create", "content:update", "content:delete",
      "analytics:view",
      "profile:view", "profile:update",
      "account:view",
      "user:access",
    ],
  },
  {
    name: "User",
    description: "Default role for authenticated users with basic access.",
    isDefault: true,
    isSystemManaged: true,
    isSuperAdmin: false,
    priority: 10,
    permissions: [
      "profile:view", "profile:update",
      "account:view",
      "user:access",
      "content:view",
    ],
  },
];

// ─── Main Seeder ─────────────────────────────────────────────────────

async function seedPermissions(): Promise<Map<string, string>> {
  console.log("\n📋 Seeding permissions...");
  const permissionMap = new Map<string, string>(); // name → id

  for (const perm of DEFAULT_PERMISSIONS) {
    // Check if permission already exists
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.name, perm.name),
    });

    if (existing) {
      permissionMap.set(perm.name, existing.id);
      console.log(`  ✅ Permission "${perm.name}" already exists (${existing.id})`);
    } else {
      const [created] = await db.insert(permissions).values({
        name: perm.name,
        description: perm.description,
        category: perm.category,
        displayName: perm.displayName,
        resource: perm.resource,
        action: perm.action,
        isSystemManaged: perm.isSystemManaged,
      }).returning();
      permissionMap.set(perm.name, created.id);
      console.log(`  ✨ Created permission "${perm.name}" (${created.id})`);
    }
  }

  console.log(`  📊 Total: ${permissionMap.size} permissions`);
  return permissionMap;
}

async function seedRoles(permissionMap: Map<string, string>): Promise<void> {
  console.log("\n🛡️  Seeding roles...");

  for (const roleDef of DEFAULT_ROLES) {
    // Check if role already exists
    let role = await db.query.roles.findFirst({
      where: eq(roles.name, roleDef.name),
    });

    if (role) {
      // Update existing role with new fields (priority, isSuperAdmin)
      await db.update(roles).set({
        description: roleDef.description,
        isSystemManaged: roleDef.isSystemManaged,
        isSuperAdmin: roleDef.isSuperAdmin,
        priority: roleDef.priority,
        updatedAt: new Date(),
      }).where(eq(roles.id, role.id));
      console.log(`  ✅ Role "${roleDef.name}" already exists, updated fields (priority: ${roleDef.priority}, isSuperAdmin: ${roleDef.isSuperAdmin})`);
    } else {
      const [created] = await db.insert(roles).values({
        name: roleDef.name,
        description: roleDef.description,
        isDefault: roleDef.isDefault,
        isSystemManaged: roleDef.isSystemManaged,
        isSuperAdmin: roleDef.isSuperAdmin,
        priority: roleDef.priority,
      }).returning();
      role = created;
      console.log(`  ✨ Created role "${roleDef.name}" (${created.id}, priority: ${roleDef.priority})`);
    }

    // Assign permissions to role
    let assignedCount = 0;
    for (const permName of roleDef.permissions) {
      const permId = permissionMap.get(permName);
      if (!permId) {
        console.warn(`  ⚠️  Permission "${permName}" not found in map, skipping`);
        continue;
      }

      // Check if assignment already exists
      const existing = await db.query.rolePermissions.findFirst({
        where: and(
          eq(rolePermissions.roleId, role.id),
          eq(rolePermissions.permissionId, permId)
        ),
      });

      if (!existing) {
        await db.insert(rolePermissions).values({
          roleId: role.id,
          permissionId: permId,
        });
        assignedCount++;
      }
    }

    if (assignedCount > 0) {
      console.log(`  📎 Assigned ${assignedCount} new permissions to "${roleDef.name}"`);
    } else {
      console.log(`  📎 All permissions already assigned to "${roleDef.name}"`);
    }
  }
}

async function upgradeExistingAdmins(): Promise<void> {
  console.log("\n🔄 Upgrading existing admin users...");

  // Find the "Admin" role
  const adminRole = await db.query.roles.findFirst({
    where: eq(roles.name, "Admin"),
  });

  if (!adminRole) {
    console.log("  ⚠️  No 'Admin' role found, skipping upgrade");
    return;
  }

  // Find users who have a role named "Admin", "admin", or "Administrator" 
  // but might not have the new Admin role assigned
  const existingAdminRoles = await db.execute(sql`
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE LOWER(r.name) IN ('admin', 'administrator')
  `);

  let upgradedCount = 0;
  for (const row of existingAdminRoles as unknown as any[]) {
    const userId = row.user_id;
    
    // Check if they already have the Admin role
    const hasAdminRole = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, adminRole.id)
      ),
    });

    if (!hasAdminRole) {
      await db.insert(userRoles).values({
        userId,
        roleId: adminRole.id,
      });
      upgradedCount++;
      console.log(`  ✨ Assigned Admin role to user ${userId}`);
    }
  }

  console.log(`  📊 Upgraded ${upgradedCount} existing admin users`);
}

async function ensureDefaultRoleForUsers(): Promise<void> {
  console.log("\n👤 Ensuring all users have at least the default role...");

  const userRole = await db.query.roles.findFirst({
    where: eq(roles.name, "User"),
  });

  if (!userRole) {
    console.log("  ⚠️  No 'User' role found, skipping");
    return;
  }

  // Find users with no roles at all
  const usersWithoutRoles = await db.execute(sql`
    SELECT u.id FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.id IS NULL
  `);

  let assignedCount = 0;
  for (const row of usersWithoutRoles as unknown as any[]) {
    const userId = row.id;
    await db.insert(userRoles).values({
      userId,
      roleId: userRole.id,
    });
    assignedCount++;
  }

  console.log(`  📊 Assigned default "User" role to ${assignedCount} users`);
}

async function main() {
  console.log("🚀 RBAC Seed Script Starting...");
  console.log("================================\n");

  try {
    // Step 1: Seed permissions
    const permissionMap = await seedPermissions();

    // Step 2: Seed roles with permission assignments
    await seedRoles(permissionMap);

    // Step 3: Upgrade existing admin users
    await upgradeExistingAdmins();

    // Step 4: Ensure all users have a default role
    await ensureDefaultRoleForUsers();

    console.log("\n================================");
    console.log("✅ RBAC Seed Script Complete!");
    console.log("================================\n");
  } catch (error) {
    console.error("\n❌ RBAC Seed Script Failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
