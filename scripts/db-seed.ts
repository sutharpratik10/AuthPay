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
import { roles, users, subscriptionPlans, subscriptionStatuses, subscriptionRenewalTypes } from '../src/server/db/schema';
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
    console.log('🌱 Seeding roles...');
    // Insert roles if not exist
    for (const role of defaultRoles) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }


    // Get admin role id
    const adminRole = await db.query.roles.findFirst({ where: (roles, { eq }) => eq(roles.name, 'admin') });
    if (!adminRole) throw new Error('Admin role not found after insert!');

    // Get user role id
    const userRole = await db.query.roles.findFirst({ where: (roles, { eq }) => eq(roles.name, 'user') });
    if (!userRole) throw new Error('User role not found after insert!');

    // Hash admin password
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    // Hash user password
    const hashedUserPassword = await bcrypt.hash('user', 10);

    // Insert admin user if not exist
    const adminEmail = 'admin@example.com';
    const existingAdmin = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.email, adminEmail) });
    if (!existingAdmin) {
      await db.insert(users).values({
        email: adminEmail,
        password: hashedAdminPassword,
        name: 'Admin',
        isEmailVerified: true,
        isActive: true,
        roleId: adminRole.id,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Insert regular user if not exist
    const userEmail = 'user@example.com';
    const existingUser = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.email, userEmail) });
    if (!existingUser) {
      await db.insert(users).values({
        email: userEmail,
        password: hashedUserPassword,
        name: 'User',
        isEmailVerified: true,
        isActive: true,
        roleId: userRole.id,
      });
      console.log('✅ User user@example.com created');
    } else {
      console.log('ℹ️ User user@example.com already exists');
    }

    // Insert subscription renewal options
    console.log('🌱 Seeding subscription renewal options...');
    for (const renewal of defaultSubscriptionRenewal) {
      await db.insert(subscriptionRenewalTypes).values(renewal).onConflictDoNothing();
    }
    console.log('✅ Subscription renewal options seeded');

    // Insert subscription statuses
    console.log('🌱 Seeding subscription statuses...');
    for (const status of defaultStatuses) {
      await db.insert(subscriptionStatuses).values(status).onConflictDoNothing();
    }
    console.log('✅ Subscription statuses seeded');
    
    // Insert subscription plans
    console.log('🌱 Seeding subscription plans...');
    for (const plan of defaultPlans) {
      await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
    }

    console.log('🎉 Seeding completed successfully!');
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