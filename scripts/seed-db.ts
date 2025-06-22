import { createDbConnection } from '../src/db/utils/connection';
import * as dotenv from 'dotenv';
import {
  tenants,
  subscriptionPlans,
  users,
  tenantUsers,
  roles,
  permissions,
  rolePermissions,
} from '../src/db/schema';

// Load environment variables
dotenv.config();

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('Starting database seeding...');
  
  const db = createDbConnection({ bypassRls: true });
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    console.log('Creating subscription plans...');
    
    // Create subscription plans individually for better error handling and validation
    console.log('Creating Free plan...');
    const [freePlan] = await db.insert(subscriptionPlans).values({
      name: 'Free',
      description: 'Basic features with limitations',
      price: '0',
      billingCycle: 'monthly',
      features: JSON.stringify(['Limited users (up to 3)', 'Basic features', 'Community support']),
      isActive: true,
    }).returning();
    console.log(`Created Free plan with ID: ${freePlan.id}`);
    
    console.log('Creating Pro plan...');
    const [proPlan] = await db.insert(subscriptionPlans).values({
      name: 'Pro',
      description: 'Advanced features for growing teams',
      price: '29',
      billingCycle: 'monthly',
      features: JSON.stringify(['Up to 10 users', 'All basic features', 'Advanced analytics', 'Priority support']),
      isActive: true,
    }).returning();
    console.log(`Created Pro plan with ID: ${proPlan.id}`);
    
    console.log('Creating Enterprise plan...');
    const [enterprisePlan] = await db.insert(subscriptionPlans).values({
      name: 'Enterprise',
      description: 'Full suite for large organizations',
      price: '99',
      billingCycle: 'monthly',
      features: JSON.stringify(['Unlimited users', 'All Pro features', 'Custom integrations', 'Dedicated support', 'SSO']),
      isActive: true,
    }).returning();
    console.log(`Created Enterprise plan with ID: ${enterprisePlan.id}`);

    console.log('Creating admin user...');
    const [adminUser] = await db.insert(users).values({
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: 'hashed_password', // In real app, hash this password
      name: 'System Administrator',
      isEmailVerified: true,
    }).returning();

    console.log('Creating admin tenant...');
    const [adminTenant] = await db.insert(tenants).values({
      name: 'Admin Tenant',
      slug: process.env.ADMIN_DEFAULT_TENANT || 'admin',
      planId: enterprisePlan.id,
    }).returning();

    console.log('Creating admin tenant user...');
    // Using _ for unused variable to prevent TypeScript warning
    const _ = await db.insert(tenantUsers).values({
      tenantId: adminTenant.id,
      userId: adminUser.id,
      isOwner: true,
      isPrimary: true,
      status: 'active',
      joinedAt: new Date(),
    }).returning();

    console.log('Creating roles and permissions...');
    // Create system permissions
    const systemPermissions = await db.insert(permissions).values([
      { name: 'users:create', displayName: 'Create Users', category: 'user_management' },
      { name: 'users:read', displayName: 'View Users', category: 'user_management' },
      { name: 'users:update', displayName: 'Update Users', category: 'user_management' },
      { name: 'users:delete', displayName: 'Delete Users', category: 'user_management' },
      { name: 'roles:manage', displayName: 'Manage Roles', category: 'user_management' },
      { name: 'billing:read', displayName: 'View Billing', category: 'billing' },
      { name: 'billing:update', displayName: 'Manage Billing', category: 'billing' },
      { name: 'analytics:read', displayName: 'View Analytics', category: 'analytics' },
      { name: 'tenant:settings', displayName: 'Manage Tenant Settings', category: 'administration' },
      { name: 'tenant:users', displayName: 'Manage Tenant Users', category: 'administration' },
    ]).returning();

    // Create admin role
    const [adminRole] = await db.insert(roles).values({
      tenantId: adminTenant.id,
      name: 'Admin',
      description: 'Full access to all features',
      isDefault: false,
      isSystemManaged: true,
    }).returning();

    // Assign all permissions to admin role
    await db.insert(rolePermissions).values(
      systemPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      }))
    );

    // Create default roles
    const [userRole] = await db.insert(roles).values({
      tenantId: adminTenant.id,
      name: 'User',
      description: 'Standard user with limited access',
      isDefault: true,
      isSystemManaged: true,
    }).returning();

    // Assign basic permissions to user role
    await db.insert(rolePermissions).values([
      {
        roleId: userRole.id,
        permissionId: systemPermissions.find(p => p.name === 'users:read')!.id,
      },
    ]);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unhandled error during seeding:', error);
  process.exit(1);
});
