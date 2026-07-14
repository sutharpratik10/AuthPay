import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// project root (one level up from /scripts)
const root = path.resolve(__dirname, '../');

const envLocal = path.join(root, '.env.local');
const envDefault = path.join(root, '.env');

// load .env.local if present, else .env
const chosenEnv = fs.existsSync(envLocal) ? envLocal : envDefault;

config({ path: chosenEnv, override: true });

console.log('cwd:', process.cwd());
console.log('.env path:', chosenEnv, 'exists:', fs.existsSync(chosenEnv));
console.log('DATABASE_URL:', process.env.DATABASE_URL);

import { db } from '../src/server/db/index';
import { roles, users, userRoles, subscriptionPlans, subscriptionStatuses, subscriptionRenewalTypes, permissions, rolePermissions } from '../src/server/db/schema';
import { eq, and } from 'drizzle-orm';

// ─── Default Permissions ─────────────────────────────────────────────
const DEFAULT_PERMISSIONS = [
  // Content Management
  { name: "content:view", description: "View content", category: "Content", displayName: "View Content", resource: "content", action: "view", isSystemManaged: true },
  { name: "content:create", description: "Create content", category: "Content", displayName: "Create Content", resource: "content", action: "create", isSystemManaged: true },
  { name: "content:update", description: "Update content", category: "Content", displayName: "Update Content", resource: "content", action: "update", isSystemManaged: true },
  { name: "content:delete", description: "Delete content", category: "Content", displayName: "Delete Content", resource: "content", action: "delete", isSystemManaged: true },
  { name: "content:manage", description: "Full content management", category: "Content", displayName: "Manage Content", resource: "content", action: "manage", isSystemManaged: true },

  // User Management
  { name: "user:view", description: "View users", category: "User Management", displayName: "View Users", resource: "user", action: "view", isSystemManaged: true },
  { name: "user:create", description: "Create users", category: "User Management", displayName: "Create Users", resource: "user", action: "create", isSystemManaged: true },
  { name: "user:update", description: "Update users", category: "User Management", displayName: "Update Users", resource: "user", action: "update", isSystemManaged: true },
  { name: "user:delete", description: "Delete users", category: "User Management", displayName: "Delete Users", resource: "user", action: "delete", isSystemManaged: true },
  { name: "user:manage", description: "Full user management", category: "User Management", displayName: "Manage Users", resource: "user", action: "manage", isSystemManaged: true },

  // Role Management
  { name: "role:view", description: "View roles", category: "Role Management", displayName: "View Roles", resource: "role", action: "view", isSystemManaged: true },
  { name: "role:create", description: "Create roles", category: "Role Management", displayName: "Create Roles", resource: "role", action: "create", isSystemManaged: true },
  { name: "role:update", description: "Update roles", category: "Role Management", displayName: "Update Roles", resource: "role", action: "update", isSystemManaged: true },
  { name: "role:delete", description: "Delete roles", category: "Role Management", displayName: "Delete Roles", resource: "role", action: "delete", isSystemManaged: true },
  { name: "role:manage", description: "Full role management", category: "Role Management", displayName: "Manage Roles", resource: "role", action: "manage", isSystemManaged: true },

  // Permission/Policy Management
  { name: "policy:view", description: "View permissions", category: "Permission Management", displayName: "View Permissions", resource: "policy", action: "view", isSystemManaged: true },
  { name: "policy:create", description: "Create permissions", category: "Permission Management", displayName: "Create Permissions", resource: "policy", action: "create", isSystemManaged: true },
  { name: "policy:update", description: "Update permissions", category: "Permission Management", displayName: "Update Permissions", resource: "policy", action: "update", isSystemManaged: true },
  { name: "policy:delete", description: "Delete permissions", category: "Permission Management", displayName: "Delete Permissions", resource: "policy", action: "delete", isSystemManaged: true },
  { name: "policy:manage", description: "Full permission management", category: "Permission Management", displayName: "Manage Permissions", resource: "policy", action: "manage", isSystemManaged: true },

  // Billing
  { name: "billing:view", description: "View billing", category: "Billing", displayName: "View Billing", resource: "billing", action: "view", isSystemManaged: true },
  { name: "billing:create", description: "Create billing", category: "Billing", displayName: "Create Billing", resource: "billing", action: "create", isSystemManaged: true },
  { name: "billing:update", description: "Update billing", category: "Billing", displayName: "Update Billing", resource: "billing", action: "update", isSystemManaged: true },
  { name: "billing:manage", description: "Full billing management", category: "Billing", displayName: "Manage Billing", resource: "billing", action: "manage", isSystemManaged: true },

  // Analytics
  { name: "analytics:view", description: "View analytics", category: "Analytics", displayName: "View Analytics", resource: "analytics", action: "view", isSystemManaged: true },
  { name: "analytics:manage", description: "Manage analytics", category: "Analytics", displayName: "Manage Analytics", resource: "analytics", action: "manage", isSystemManaged: true },

  // Settings
  { name: "settings:view", description: "View settings", category: "Settings", displayName: "View Settings", resource: "settings", action: "view", isSystemManaged: true },
  { name: "settings:update", description: "Update settings", category: "Settings", displayName: "Update Settings", resource: "settings", action: "update", isSystemManaged: true },
  { name: "settings:manage", description: "Manage settings", category: "Settings", displayName: "Manage Settings", resource: "settings", action: "manage", isSystemManaged: true },

  // Profile & Account
  { name: "profile:view", description: "View profile", category: "Profile", displayName: "View Profile", resource: "profile", action: "view", isSystemManaged: true },
  { name: "profile:update", description: "Update profile", category: "Profile", displayName: "Update Profile", resource: "profile", action: "update", isSystemManaged: true },
  { name: "account:view", description: "View account", category: "Account", displayName: "View Account", resource: "account", action: "view", isSystemManaged: true },
  { name: "account:manage", description: "Manage account", category: "Account", displayName: "Manage Account", resource: "account", action: "manage", isSystemManaged: true },

  // Basic Access
  { name: "admin:access", description: "Admin Access", category: "Admin", displayName: "Admin Access", resource: "admin", action: "access", isSystemManaged: true },
  { name: "user:access", description: "User Access", category: "User", displayName: "User Access", resource: "user", action: "access", isSystemManaged: true },
];

// ─── Default Roles ───────────────────────────────────────────────────
const DEFAULT_ROLES = [
  {
    name: "Super Admin",
    description: "Super Administrator with full, unrestricted access.",
    isDefault: false,
    isSystemManaged: true,
    isSuperAdmin: true,
    priority: 100,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name),
  },
  {
    name: "admin",
    description: "Administrator with full access.",
    isDefault: false,
    isSystemManaged: true,
    isSuperAdmin: false,
    priority: 80,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name),
  },
  {
    name: "Moderator",
    description: "Moderator with user and content management.",
    isDefault: false,
    isSystemManaged: false,
    isSuperAdmin: false,
    priority: 50,
    permissions: ["user:view", "user:update", "content:view", "content:create", "content:update", "content:delete", "analytics:view", "profile:view", "profile:update", "account:view", "user:access"],
  },
  {
    name: "user",
    description: "Default role for authenticated users.",
    isDefault: true,
    isSystemManaged: true,
    isSuperAdmin: false,
    priority: 10,
    permissions: ["profile:view", "profile:update", "account:view", "user:access", "content:view"],
  },
];

// ─── Subscription Data ───────────────────────────────────────────────────
const defaultPlans = [
  { name: 'Free', description: 'Basic access with limited features', price: '0', billingCycle: 'monthly', features: JSON.stringify(['Basic Support', 'Limited Usage']), isActive: true },
  { name: 'Pro', description: 'Pro access with more features', price: '9.99', billingCycle: 'monthly', features: JSON.stringify(['Priority Support', 'Unlimited Usage']), isActive: true },
  { name: 'Enterprise', description: 'Enterprise access with all features', price: '99.99', billingCycle: 'yearly', features: JSON.stringify(['Dedicated Support', 'Custom Integrations']), isActive: true }
];

const defaultStatuses = [
  { name: 'active', description: 'Subscription is active' },
  { name: 'inactive', description: 'Subscription is inactive' },
  { name: 'cancelled', description: 'Subscription has been cancelled' },
  { name: 'expired', description: 'Subscription has expired' },
  { name: 'free-trial', description: 'User is on a free trial' }
];

const defaultSubscriptionRenewal = [
  { name: 'auto', description: 'Renew subscription automatically' },
  { name: 'manual', description: 'Renew subscription manually' }
];

async function seed() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');
    
    // 1. Seed Permissions
    console.log('🛡️  Seeding permissions...');
    const permissionMap = new Map<string, string>();
    for (const perm of DEFAULT_PERMISSIONS) {
      let existing = await db.query.permissions.findFirst({ where: eq(permissions.name, perm.name) });
      if (!existing) {
        const [created] = await db.insert(permissions).values(perm).returning();
        existing = created;
      }
      permissionMap.set(perm.name, existing.id);
    }
    console.log(`✅ Seeded ${permissionMap.size} permissions.\n`);

    // 2. Seed Roles & Map Permissions
    console.log('🔐 Seeding roles and assigning permissions...');
    for (const roleDef of DEFAULT_ROLES) {
      let role = await db.query.roles.findFirst({ where: eq(roles.name, roleDef.name) });
      if (role) {
        await db.update(roles).set({
          description: roleDef.description, isSystemManaged: roleDef.isSystemManaged,
          isSuperAdmin: roleDef.isSuperAdmin, priority: roleDef.priority, updatedAt: new Date()
        }).where(eq(roles.id, role.id));
      } else {
        const [created] = await db.insert(roles).values({
          name: roleDef.name, description: roleDef.description, isDefault: roleDef.isDefault,
          isSystemManaged: roleDef.isSystemManaged, isSuperAdmin: roleDef.isSuperAdmin, priority: roleDef.priority
        }).returning();
        role = created;
      }

      for (const permName of roleDef.permissions) {
        const permId = permissionMap.get(permName);
        if (permId) {
          const existingAssignment = await db.query.rolePermissions.findFirst({
            where: and(eq(rolePermissions.roleId, role.id), eq(rolePermissions.permissionId, permId))
          });
          if (!existingAssignment) {
            await db.insert(rolePermissions).values({ roleId: role.id, permissionId: permId });
          }
        }
      }
    }
    console.log('✅ Roles and permissions linked.\n');

    const adminRole = await db.query.roles.findFirst({ where: eq(roles.name, 'admin') });
    const userRole = await db.query.roles.findFirst({ where: eq(roles.name, 'user') });
    if (!adminRole || !userRole) throw new Error('Missing core roles after seed.');

    // 3. Seed Users
    console.log('👥 Seeding base users...');
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    const hashedUserPassword = await bcrypt.hash('user', 10);

    const adminEmail = 'admin@example.com';
    let admin = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
    if (!admin) {
      const [newAdmin] = await db.insert(users).values({ email: adminEmail, password: hashedAdminPassword, name: 'Admin', isEmailVerified: true, isActive: true }).returning();
      await db.insert(userRoles).values({ userId: newAdmin.id, roleId: adminRole.id });
    }

    const userEmail = 'user@example.com';
    let user = await db.query.users.findFirst({ where: eq(users.email, userEmail) });
    if (!user) {
      const [newUser] = await db.insert(users).values({ email: userEmail, password: hashedUserPassword, name: 'User', isEmailVerified: true, isActive: true }).returning();
      await db.insert(userRoles).values({ userId: newUser.id, roleId: userRole.id });
    }
    console.log('✅ Users created and assigned roles.\n');

    // 4. Seed Subscriptions
    console.log('💳 Seeding subscription dependencies...');
    for (const renewal of defaultSubscriptionRenewal) await db.insert(subscriptionRenewalTypes).values(renewal).onConflictDoNothing();
    for (const status of defaultStatuses) await db.insert(subscriptionStatuses).values(status).onConflictDoNothing();
    for (const plan of defaultPlans) await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
    console.log('✅ Subscriptions seeded.\n');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📝 Default credentials:');
    console.log('   Admin: admin@example.com / admin');
    console.log('   User:  user@example.com / user\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

export { seed };