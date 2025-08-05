import { db } from '../src/db/index';
import { roles, permissions, rolePermissions, tenants } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

const defaultPermissions = [
  { name: 'user.view', description: 'View users', category: 'user_management', displayName: 'View Users' },
  { name: 'user.create', description: 'Create users', category: 'user_management', displayName: 'Create Users' },
  { name: 'user.edit', description: 'Edit users', category: 'user_management', displayName: 'Edit Users' },
  { name: 'user.delete', description: 'Delete users', category: 'user_management', displayName: 'Delete Users' },
  { name: 'user.manage', description: 'Manage users', category: 'user_management', displayName: 'Manage Users' },
  { name: 'tenant.view', description: 'View tenants', category: 'tenant_management', displayName: 'View Tenants' },
  { name: 'tenant.create', description: 'Create tenants', category: 'tenant_management', displayName: 'Create Tenants' },
  { name: 'tenant.edit', description: 'Edit tenants', category: 'tenant_management', displayName: 'Edit Tenants' },
  { name: 'tenant.delete', description: 'Delete tenants', category: 'tenant_management', displayName: 'Delete Tenants' },
  { name: 'tenant.manage', description: 'Manage tenants', category: 'tenant_management', displayName: 'Manage Tenants' },
  { name: 'subscription.view', description: 'View subscriptions', category: 'subscription', displayName: 'View Subscriptions' },
  { name: 'subscription.create', description: 'Create subscriptions', category: 'subscription', displayName: 'Create Subscriptions' },
  { name: 'subscription.edit', description: 'Edit subscriptions', category: 'subscription', displayName: 'Edit Subscriptions' },
  { name: 'subscription.delete', description: 'Delete subscriptions', category: 'subscription', displayName: 'Delete Subscriptions' },
  { name: 'subscription.manage', description: 'Manage subscriptions', category: 'subscription', displayName: 'Manage Subscriptions' },
  { name: 'subscription.purchase', description: 'Purchase subscriptions', category: 'subscription', displayName: 'Purchase Subscriptions' },
  { name: 'subscription.cancel', description: 'Cancel subscriptions', category: 'subscription', displayName: 'Cancel Subscriptions' },
  { name: 'content.view', description: 'View content', category: 'content', displayName: 'View Content' },
  { name: 'content.create', description: 'Create content', category: 'content', displayName: 'Create Content' },
  { name: 'content.edit', description: 'Edit content', category: 'content', displayName: 'Edit Content' },
  { name: 'content.delete', description: 'Delete content', category: 'content', displayName: 'Delete Content' },
  { name: 'content.manage', description: 'Manage content', category: 'content', displayName: 'Manage Content' },
  { name: 'system.manage', description: 'Manage system', category: 'system', displayName: 'Manage System' },
  { name: 'analytics.view', description: 'View analytics', category: 'system', displayName: 'View Analytics' },
  { name: 'logs.view', description: 'View logs', category: 'system', displayName: 'View Logs' },
  { name: 'settings.manage', description: 'Manage settings', category: 'system', displayName: 'Manage Settings' },
  { name: 'profile.view', description: 'View profile', category: 'profile', displayName: 'View Profile' },
  { name: 'profile.edit', description: 'Edit profile', category: 'profile', displayName: 'Edit Profile' }
];

const defaultRoles = [
  {
    name: 'Administrator',
    description: 'Full administrative access to all features',
    isDefault: false,
    permissions: defaultPermissions.map(p => p.name) // All permissions
  },
  {
    name: 'Manager',
    description: 'Management access with user and content management capabilities',
    isDefault: false,
    permissions: [
      'user.view', 'user.create', 'user.edit', 'user.manage',
      'tenant.view', 'tenant.edit',
      'subscription.view', 'subscription.purchase', 'subscription.cancel',
      'content.view', 'content.create', 'content.edit', 'content.delete', 'content.manage',
      'profile.view', 'profile.edit'
    ]
  },
  {
    name: 'Editor',
    description: 'Content creation and editing capabilities',
    isDefault: false,
    permissions: [
      'tenant.view', 'tenant.edit',
      'subscription.view', 'subscription.purchase', 'subscription.cancel',
      'content.view', 'content.create', 'content.edit', 'content.delete',
      'profile.view', 'profile.edit'
    ]
  },
  {
    name: 'Member',
    description: 'Standard member with basic access',
    isDefault: true,
    permissions: [
      'tenant.view',
      'subscription.view', 'subscription.purchase', 'subscription.cancel',
      'content.view', 'content.create',
      'profile.view', 'profile.edit'
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to content',
    isDefault: false,
    permissions: [
      'tenant.view',
      'subscription.view',
      'content.view',
      'profile.view'
    ]
  }
];

async function seedDefaultRoles() {
  try {
    console.log('🌱 Starting default roles seeding...');

    // First, create permissions if they don't exist
    console.log('📝 Creating permissions...');
    for (const perm of defaultPermissions) {
      try {
        await db.insert(permissions).values({
          name: perm.name,
          description: perm.description,
          category: perm.category,
          displayName: perm.displayName,
          isSystemManaged: true,
        }).onConflictDoNothing();
      } catch (error) {
        // Permission might already exist, continue
        console.log(`Permission ${perm.name} already exists or error occurred`);
      }
    }

    // Get all tenants
    const allTenants = await db.query.tenants.findMany();
    console.log(`🏢 Found ${allTenants.length} tenants`);

    if (allTenants.length === 0) {
      console.log('⚠️  No tenants found. Please run tenant seeding first.');
      return;
    }

    // Create default roles for each tenant
    for (const tenant of allTenants) {
      console.log(`🔐 Creating roles for tenant: ${tenant.name} (${tenant.slug})`);

      for (const roleConfig of defaultRoles) {
        // Check if role already exists
        const existingRole = await db.query.roles.findFirst({
          where: and(
            eq(roles.tenantId, tenant.id),
            eq(roles.name, roleConfig.name)
          ),
        });

        if (existingRole) {
          console.log(`  ✅ Role ${roleConfig.name} already exists for ${tenant.name}`);
          continue;
        }

        // Create the role
        const newRole = await db.insert(roles).values({
          tenantId: tenant.id,
          name: roleConfig.name,
          description: roleConfig.description,
          isDefault: roleConfig.isDefault,
          isSystemManaged: true,
        }).returning();

        console.log(`  ➕ Created role: ${roleConfig.name}`);

        // Assign permissions to this role
        const permissionList = await db.query.permissions.findMany({
          where: (perms, { inArray }) => inArray(perms.name, roleConfig.permissions),
        });

        for (const permission of permissionList) {
          try {
            await db.insert(rolePermissions).values({
              roleId: newRole[0].id,
              permissionId: permission.id,
            });
          } catch (error) {
            // Permission might already be assigned
            console.log(`    Permission ${permission.name} already assigned or error occurred`);
          }
        }

        console.log(`  🔑 Assigned ${permissionList.length} permissions to ${roleConfig.name}`);
      }
    }

    // Display summary
    const totalRoles = await db.query.roles.findMany();
    const totalPermissions = await db.query.permissions.findMany();
    const totalRolePermissions = await db.query.rolePermissions.findMany();

    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`✅ Total Permissions: ${totalPermissions.length}`);
    console.log(`✅ Total Roles: ${totalRoles.length}`);
    console.log(`✅ Total Tenants: ${allTenants.length}`);
    console.log(`✅ Role-Permission Assignments: ${totalRolePermissions.length}`);

    console.log('\n🎉 DEFAULT ROLES SEEDING COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Error seeding default roles:', error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedDefaultRoles()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDefaultRoles };
