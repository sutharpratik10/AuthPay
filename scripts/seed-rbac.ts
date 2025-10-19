/**
 * Seed Default RBAC Roles and Policies
 * 
 * This script creates default roles (Admin, Author, User) and common policies.
 * Run this after the migration script.
 */

import { db } from "@/server/db";
import { roles, permissions, rolePermissions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface Role {
  name: string;
  description: string;
  isSystemManaged: boolean;
  policies: string[];
}

interface Policy {
  name: string;
  description: string;
  category: string;
  displayName: string;
}

async function seedRBAC() {
  console.log("🌱 Seeding RBAC system...\n");

  try {
    // Define default policies
    const defaultPolicies: Policy[] = [
      // Content policies
      { name: "content:view", description: "View content", category: "content", displayName: "View Content" },
      { name: "content:create", description: "Create new content", category: "content", displayName: "Create Content" },
      { name: "content:update", description: "Update existing content", category: "content", displayName: "Update Content" },
      { name: "content:delete", description: "Delete content", category: "content", displayName: "Delete Content" },
      { name: "content:manage", description: "Full content management", category: "content", displayName: "Manage Content" },

      // User policies
      { name: "user:view", description: "View users", category: "user", displayName: "View Users" },
      { name: "user:create", description: "Create new users", category: "user", displayName: "Create Users" },
      { name: "user:update", description: "Update user details", category: "user", displayName: "Update Users" },
      { name: "user:delete", description: "Delete users", category: "user", displayName: "Delete Users" },
      { name: "user:manage", description: "Full user management", category: "user", displayName: "Manage Users" },

      // Role policies
      { name: "role:view", description: "View roles", category: "role", displayName: "View Roles" },
      { name: "role:create", description: "Create new roles", category: "role", displayName: "Create Roles" },
      { name: "role:update", description: "Update role details", category: "role", displayName: "Update Roles" },
      { name: "role:delete", description: "Delete roles", category: "role", displayName: "Delete Roles" },
      { name: "role:manage", description: "Full role management", category: "role", displayName: "Manage Roles" },

      // Policy policies
      { name: "policy:view", description: "View policies", category: "policy", displayName: "View Policies" },
      { name: "policy:create", description: "Create new policies", category: "policy", displayName: "Create Policies" },
      { name: "policy:update", description: "Update policy details", category: "policy", displayName: "Update Policies" },
      { name: "policy:delete", description: "Delete policies", category: "policy", displayName: "Delete Policies" },
      { name: "policy:manage", description: "Full policy management", category: "policy", displayName: "Manage Policies" },

      // Billing policies
      { name: "billing:view", description: "View billing information", category: "billing", displayName: "View Billing" },
      { name: "billing:create", description: "Create billing records", category: "billing", displayName: "Create Billing" },
      { name: "billing:update", description: "Update billing information", category: "billing", displayName: "Update Billing" },
      { name: "billing:manage", description: "Full billing management", category: "billing", displayName: "Manage Billing" },

      // Analytics policies
      { name: "analytics:view", description: "View analytics", category: "analytics", displayName: "View Analytics" },
      { name: "analytics:manage", description: "Manage analytics", category: "analytics", displayName: "Manage Analytics" },

      // Settings policies
      { name: "settings:view", description: "View settings", category: "settings", displayName: "View Settings" },
      { name: "settings:update", description: "Update settings", category: "settings", displayName: "Update Settings" },
      { name: "settings:manage", description: "Full settings management", category: "settings", displayName: "Manage Settings" },
    ];

    // Step 1: Create policies
    console.log("📋 Creating default policies...");
    const createdPolicies: Record<string, string> = {};

    for (const policy of defaultPolicies) {
      const [resource, action] = policy.name.split(':');
      
      // Check if policy exists
      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.name, policy.name)
      });

      if (!existing) {
        const [created] = await db.insert(permissions).values({
          name: policy.name,
          description: policy.description,
          category: policy.category,
          displayName: policy.displayName,
          resource,
          action,
          isSystemManaged: true
        }).returning();
        
        createdPolicies[policy.name] = created.id;
        console.log(`  ✓ Created policy: ${policy.name}`);
      } else {
        createdPolicies[policy.name] = existing.id;
        console.log(`  ⊙ Policy exists: ${policy.name}`);
      }
    }
    console.log(`✅ ${defaultPolicies.length} policies processed\n`);

    // Step 2: Create default roles with their policies
    const defaultRoles: Role[] = [
      {
        name: "Admin",
        description: "Full system access - can manage everything",
        isSystemManaged: true,
        policies: [] // Admin has override access, doesn't need explicit policies
      },
      {
        name: "Author",
        description: "Can create and manage content",
        isSystemManaged: false,
        policies: [
          "content:view",
          "content:create",
          "content:update",
          "content:delete",
        ]
      },
      {
        name: "User",
        description: "Basic user - can only view content",
        isSystemManaged: false,
        policies: [
          "content:view",
        ]
      }
    ];

    console.log("📋 Creating default roles...");
    for (const roleData of defaultRoles) {
      // Check if role exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.name, roleData.name)
      });

      let roleId: string;

      if (!existingRole) {
        const [created] = await db.insert(roles).values({
          name: roleData.name,
          description: roleData.description,
          isSystemManaged: roleData.isSystemManaged,
          isDefault: roleData.name === "User" // User role is default
        }).returning();
        
        roleId = created.id;
        console.log(`  ✓ Created role: ${roleData.name}`);
      } else {
        roleId = existingRole.id;
        console.log(`  ⊙ Role exists: ${roleData.name}`);
      }

      // Assign policies to role
      if (roleData.policies.length > 0) {
        console.log(`    Assigning ${roleData.policies.length} policies...`);
        for (const policyName of roleData.policies) {
          const policyId = createdPolicies[policyName];
          if (!policyId) {
            console.warn(`    ⚠️  Policy not found: ${policyName}`);
            continue;
          }

          // Check if already assigned
          const existing = await db.query.rolePermissions.findFirst({
            where: (rp, { and, eq }) => and(
              eq(rp.roleId, roleId),
              eq(rp.permissionId, policyId)
            )
          });

          if (!existing) {
            await db.insert(rolePermissions).values({
              roleId,
              permissionId: policyId
            });
            console.log(`      ✓ Assigned: ${policyName}`);
          }
        }
      }
    }
    console.log(`✅ ${defaultRoles.length} roles processed\n`);

    console.log("🎉 RBAC seeding completed successfully!\n");
    console.log("📝 Summary:");
    console.log(`  ✓ ${defaultPolicies.length} policies created`);
    console.log(`  ✓ ${defaultRoles.length} roles created`);
    console.log("  ✓ Admin role: Full access");
    console.log("  ✓ Author role: Can create/edit content");
    console.log("  ✓ User role: Can view content");
    console.log("\n✨ You can now assign roles to users via the API!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run seeding
if (require.main === module) {
  seedRBAC()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedRBAC };
