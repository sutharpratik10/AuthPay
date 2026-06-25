import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';


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
import { roles, users, userRoles, subscriptionPlans, subscriptionStatuses, subscriptionRenewalTypes } from '../src/server/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const defaultRoles = [
  {
    name: 'admin',
    description: 'Full administrative access to all features',
    isDefault: false,
    isSystemManaged: true,
  },
  {
    name: 'user',
    description: 'Standard user with limited access',
    isDefault: true,
    isSystemManaged: true,
  }
];

const defaultPlans = [
  {
    name: 'Free',
    description: 'Basic access with limited features',
    price: '0',
    billingCycle: 'monthly',
    features: JSON.stringify(['Basic Support', 'Limited Usage']),
    isActive: true,
  },
  {
    name: 'Pro',
    description: 'Pro access with more features',
    price: '9.99',
    billingCycle: 'monthly',
    features: JSON.stringify(['Priority Support', 'Unlimited Usage']),
    isActive: true,
  },
  {
    name: 'Enterprise',
    description: 'Enterprise access with all features',
    price: '99.99',
    billingCycle: 'yearly',
    features: JSON.stringify(['Dedicated Support', 'Custom Integrations']),
    isActive: true,
  }
];

const defaultStatuses = [
  {
    name: 'active',
    description: 'Subscription is active',
  },
  {
    name: 'inactive',
    description: 'Subscription is inactive',
  },
  {
    name: 'cancelled',
    description: 'Subscription has been cancelled',
  },
  {
    name: 'expired',
    description: 'Subscription has expired',
  },
  {
    name: 'free-trial',
    description: 'User is on a free trial',
  }
];

const defaultSubscriptionRenewal = [
  {
    name: 'auto',
    description: 'Renew subscription automatically',
  },
  {
    name: 'manual',
    description: 'Renew subscription manually',
  }
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('');
    
    // ============================================
    // 1. Seed Roles
    // ============================================
    console.log('🔐 Seeding roles...');
    for (const role of defaultRoles) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }
    console.log('✅ Roles seeded successfully');
    console.log('');

    // Get admin role id
    const adminRole = await db.query.roles.findFirst({ where: eq(roles.name, 'admin') });
    if (!adminRole) throw new Error('Admin role not found after insert!');

    // Get user role id
    const userRole = await db.query.roles.findFirst({ where: eq(roles.name, 'user') });
    if (!userRole) throw new Error('User role not found after insert!');

    // ============================================
    // 2. Seed Users and Assign Roles
    // ============================================
    console.log('👥 Seeding users and assigning roles...');
    
    // Hash passwords
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    const hashedUserPassword = await bcrypt.hash('user', 10);

    // Insert admin user if not exist
    const adminEmail = 'admin@example.com';
    const existingAdmin = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
    if (!existingAdmin) {
      const [newAdmin] = await db.insert(users).values({
        email: adminEmail,
        password: hashedAdminPassword,
        name: 'Admin',
        isEmailVerified: true,
        isActive: true,
      }).returning();
      
      // Assign admin role using user_roles junction table
      await db.insert(userRoles).values({
        userId: newAdmin.id,
        roleId: adminRole.id,
      });
      console.log('  ✅ Admin user created (admin@example.com) with admin role');
    } else {
      console.log('  ℹ️  Admin user already exists (admin@example.com)');
      // Check if admin has admin role, if not assign it
      const hasAdminRole = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, existingAdmin.id),
          eq(userRoles.roleId, adminRole.id)
        )
      });
      if (!hasAdminRole) {
        await db.insert(userRoles).values({
          userId: existingAdmin.id,
          roleId: adminRole.id,
        });
        console.log('  ✅ Assigned admin role to existing admin user');
      } else {
        console.log('  ✅ Admin role already assigned');
      }
    }

    // Insert regular user if not exist
    const userEmail = 'user@example.com';
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, userEmail) });
    if (!existingUser) {
      const [newUser] = await db.insert(users).values({
        email: userEmail,
        password: hashedUserPassword,
        name: 'User',
        isEmailVerified: true,
        isActive: true,
      }).returning();
      
      // Assign user role using user_roles junction table
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: userRole.id,
      });
      console.log('  ✅ Regular user created (user@example.com) with user role');
    } else {
      console.log('  ℹ️  Regular user already exists (user@example.com)');
      // Check if user has user role, if not assign it
      const hasUserRole = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, existingUser.id),
          eq(userRoles.roleId, userRole.id)
        )
      });
      if (!hasUserRole) {
        await db.insert(userRoles).values({
          userId: existingUser.id,
          roleId: userRole.id,
        });
        console.log('  ✅ Assigned user role to existing user');
      } else {
        console.log('  ✅ User role already assigned');
      }
    }
    console.log('✅ Users and role assignments completed');
    console.log('');

    // ============================================
    // 3. Seed Subscription Renewal Types
    // ============================================
    console.log('🔄 Seeding subscription renewal types...');
    for (const renewal of defaultSubscriptionRenewal) {
      await db.insert(subscriptionRenewalTypes).values(renewal).onConflictDoNothing();
    }
    console.log('✅ Subscription renewal types seeded');
    console.log('');

    // ============================================
    // 4. Seed Subscription Statuses
    // ============================================
    console.log('📊 Seeding subscription statuses...');
    for (const status of defaultStatuses) {
      await db.insert(subscriptionStatuses).values(status).onConflictDoNothing();
    }
    console.log('✅ Subscription statuses seeded');
    console.log('');
    
    // ============================================
    // 5. Seed Subscription Plans
    // ============================================
    console.log('💳 Seeding subscription plans...');
    for (const plan of defaultPlans) {
      await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
    }
    console.log('✅ Subscription plans seeded');
    console.log('');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📝 Default credentials:');
    console.log('   Admin: admin@example.com / admin');
    console.log('   User:  user@example.com / user');
    console.log('');
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