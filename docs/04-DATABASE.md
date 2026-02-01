# Database Schema & Migrations

## Table of Contents
- [Overview](#overview)
- [Database Technology](#database-technology)
- [Schema Structure](#schema-structure)
- [Core Tables](#core-tables)
- [Migrations](#migrations)
- [Database Scripts](#database-scripts)
- [Queries & Operations](#queries--operations)
- [Best Practices](#best-practices)

## Overview

BookEase uses **PostgreSQL** as its relational database with **Drizzle ORM** for type-safe database operations and migrations. The schema is designed for security, performance, and scalability.

### Key Features

- ✅ **Type-Safe**: Full TypeScript integration with Drizzle ORM
- ✅ **Migrations**: Version-controlled schema changes
- ✅ **Relations**: Proper foreign keys and cascading deletes
- ✅ **Indexes**: Optimized for common queries
- ✅ **Constraints**: Data integrity at database level
- ✅ **UUID**: Secure, non-sequential identifiers

## Database Technology

### PostgreSQL

**Version**: 14.x or higher

**Why PostgreSQL?**
- ACID compliance
- Advanced features (JSON, full-text search)
- Excellent performance
- Strong community support
- Reliable and battle-tested

### Drizzle ORM

**Why Drizzle?**
- Type-safe queries
- Zero runtime overhead
- SQL-like syntax
- Excellent TypeScript support
- Migration support
- Lightweight (~15KB)

**Installation**:
```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

## Schema Structure

### File Organization

```
src/server/db/
├── index.ts                 # Database connection
├── schema/
│   ├── schema.ts           # Main schema file
│   ├── index.ts            # Schema exports
│   └── relations.ts        # Table relations
├── migrations/
│   ├── 0000_initial.sql
│   ├── 0001_add_rbac.sql
│   └── meta/
└── seed/
    └── seed-data.ts        # Seed scripts
```

### Connection Setup

**Location**: `src/server/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/schema';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export types
export type Database = typeof db;
```

**Environment Variable**:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/BookEase
```

## Core Tables

### 1. Users Table

**Purpose**: Store user account information

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Nullable for OAuth users
  name: text('name'),
  image: text('image'),
  
  // Email verification
  emailVerified: timestamp('email_verified'),
  verificationToken: text('verification_token'),
  verificationTokenExpiry: timestamp('verification_token_expiry'),
  
  // Password reset
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  
  // OAuth
  provider: text('provider'), // 'google', 'github', etc.
  providerId: text('provider_id'),
  
  // Account status
  isSuspended: boolean('is_suspended').default(false),
  suspendedAt: timestamp('suspended_at'),
  suspendedReason: text('suspended_reason'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  
  // Security
  loginAttempts: integer('login_attempts').default(0),
  lastFailedLogin: timestamp('last_failed_login'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
});

// Indexes for performance
export const usersEmailIdx = index('users_email_idx').on(users.email);
export const usersProviderIdx = index('users_provider_idx').on(users.provider, users.providerId);
```

**Key Fields**:
- `id`: UUID primary key
- `email`: Unique, indexed for fast lookup
- `password`: Bcrypt hashed (nullable for OAuth)
- `emailVerified`: NULL until verified
- `provider`: OAuth provider name
- `isSuspended`: Admin can suspend accounts

### 2. Roles Table

**Purpose**: Define user roles for RBAC

```typescript
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  
  // System flags
  isDefault: boolean('is_default').default(false),
  isSystemManaged: boolean('is_system_managed').default(false),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const rolesNameIdx = index('roles_name_idx').on(roles.name);
```

**System Flags**:
- `isDefault`: Auto-assigned to new users
- `isSystemManaged`: Cannot be deleted (Admin, User)

**Default Roles**:
- Admin
- User (default)
- Author
- Moderator

### 3. Permissions Table

**Purpose**: Store available policies

```typescript
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(), // Format: resource:action
  description: text('description'),
  category: text('category'), // Group related permissions
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const permissionsNameIdx = index('permissions_name_idx').on(permissions.name);
export const permissionsCategoryIdx = index('permissions_category_idx').on(permissions.category);
```

**Policy Examples**:
```sql
INSERT INTO permissions (name, description, category) VALUES
  ('content:view', 'View content', 'content'),
  ('content:create', 'Create content', 'content'),
  ('admin:access', 'Access admin panel', 'admin'),
  ('user:manage', 'Manage users', 'user');
```

### 4. User-Role Junction Table

**Purpose**: Many-to-many relationship between users and roles

```typescript
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const userRolesUserIdx = index('user_roles_user_idx').on(userRoles.userId);
export const userRolesRoleIdx = index('user_roles_role_idx').on(userRoles.roleId);
```

**Features**:
- Composite primary key (userId + roleId)
- Cascade delete: Remove when user/role deleted
- Track who assigned the role
- Index on both foreign keys

### 5. Role-Permission Junction Table

**Purpose**: Many-to-many relationship between roles and permissions

```typescript
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const rolePermissionsRoleIdx = index('role_permissions_role_idx').on(rolePermissions.roleId);
export const rolePermissionsPermissionIdx = index('role_permissions_permission_idx').on(rolePermissions.permissionId);
```

### 6. Sessions Table

**Purpose**: Store user sessions (if using database sessions)

```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Device info
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
});

export const sessionsTokenIdx = index('sessions_token_idx').on(sessions.token);
export const sessionsUserIdx = index('sessions_user_idx').on(sessions.userId);
export const sessionsExpiryIdx = index('sessions_expiry_idx').on(sessions.expiresAt);
```

### 7. Subscriptions Table

**Purpose**: Manage user subscriptions

```typescript
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(), // One active subscription per user
  
  // Plan details
  planId: text('plan_id').notNull(), // 'free', 'pro', 'enterprise'
  planName: text('plan_name').notNull(),
  
  // Payment
  paymentProvider: text('payment_provider'), // 'razorpay', 'stripe'
  subscriptionId: text('subscription_id'), // Provider's subscription ID
  customerId: text('customer_id'), // Provider's customer ID
  
  // Status
  status: text('status').notNull().default('active'), // active, canceled, expired
  
  // Billing
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionsUserIdx = index('subscriptions_user_idx').on(subscriptions.userId);
export const subscriptionsStatusIdx = index('subscriptions_status_idx').on(subscriptions.status);
```

### 8. Payments Table

**Purpose**: Track payment transactions

```typescript
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Payment details
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').notNull().default('INR'),
  
  // Payment provider
  provider: text('provider').notNull(), // 'razorpay'
  paymentId: text('payment_id').notNull().unique(), // Provider's payment ID
  orderId: text('order_id'),
  
  // Status
  status: text('status').notNull(), // 'pending', 'completed', 'failed', 'refunded'
  
  // Metadata
  description: text('description'),
  metadata: jsonb('metadata'), // Additional data
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const paymentsUserIdx = index('payments_user_idx').on(payments.userId);
export const paymentsStatusIdx = index('payments_status_idx').on(payments.status);
export const paymentsPaymentIdIdx = index('payments_payment_id_idx').on(payments.paymentId);
```

### 9. Jobs Table

**Purpose**: Job listings

```typescript
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Job details
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  type: text('type'), // 'full-time', 'part-time', 'contract'
  description: text('description'),
  requirements: text('requirements'),
  salary: text('salary'),
  
  // URLs
  applyUrl: text('apply_url'),
  companyUrl: text('company_url'),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Metadata
  postedBy: uuid('posted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

export const jobsTitleIdx = index('jobs_title_idx').on(jobs.title);
export const jobsCompanyIdx = index('jobs_company_idx').on(jobs.company);
export const jobsActiveIdx = index('jobs_active_idx').on(jobs.isActive);
```

## Relationships

```typescript
// Users → User Roles
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  subscriptions: many(subscriptions),
  payments: many(payments),
  sessions: many(sessions),
}));

// Roles → User Roles & Role Permissions
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

// Permissions → Role Permissions
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// User Roles (junction)
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

// Role Permissions (junction)
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
```

## Migrations

### Configuration

**Location**: `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/server/db/schema/schema.ts',
  out: './src/server/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### Migration Commands

```bash
# Generate migration from schema changes
npm run db:generate
# or
npx drizzle-kit generate:pg

# Run migrations
npm run db:migrate
# or
npx drizzle-kit push:pg

# Drop database (development only!)
npm run db:drop
# or
npx drizzle-kit drop

# Open Drizzle Studio (GUI)
npm run db:studio
# or
npx drizzle-kit studio
```

### Migration Files

**Location**: `src/server/db/migrations/`

Example migration:
```sql
-- 0001_add_rbac_tables.sql

CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "is_default" boolean DEFAULT false,
  "is_system_managed" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "category" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "role_id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("role_id", "permission_id"),
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
  FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
);

CREATE INDEX "roles_name_idx" ON "roles" ("name");
CREATE INDEX "permissions_name_idx" ON "permissions" ("name");
CREATE INDEX "user_roles_user_idx" ON "user_roles" ("user_id");
CREATE INDEX "user_roles_role_idx" ON "user_roles" ("role_id");
```

## Database Scripts

### 1. Test Connection

**Location**: `scripts/test-connection.ts`

```typescript
import { db } from '@/server/db';

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
```

Run: `npx tsx scripts/test-connection.ts`

### 2. Seed RBAC Data

**Location**: `scripts/seed-rbac.ts`

```typescript
import { db } from '@/server/db';
import { roles, permissions, rolePermissions } from '@/server/db/schema';

async function seedRBAC() {
  console.log('🌱 Seeding RBAC data...');

  // Create roles
  const [adminRole, userRole, authorRole] = await db.insert(roles).values([
    {
      name: 'Admin',
      description: 'Full system access',
      isDefault: false,
      isSystemManaged: true,
    },
    {
      name: 'User',
      description: 'Standard user',
      isDefault: true,
      isSystemManaged: true,
    },
    {
      name: 'Author',
      description: 'Content creator',
      isDefault: false,
      isSystemManaged: false,
    },
  ]).returning();

  // Create permissions
  const permissionsData = await db.insert(permissions).values([
    { name: 'admin:access', description: 'Access admin panel', category: 'admin' },
    { name: 'admin:full', description: 'Full admin access', category: 'admin' },
    { name: 'content:view', description: 'View content', category: 'content' },
    { name: 'content:create', description: 'Create content', category: 'content' },
    { name: 'content:edit', description: 'Edit content', category: 'content' },
    { name: 'content:delete', description: 'Delete content', category: 'content' },
    { name: 'user:view', description: 'View users', category: 'user' },
    { name: 'user:manage', description: 'Manage users', category: 'user' },
    { name: 'profile:view', description: 'View profile', category: 'profile' },
    { name: 'profile:edit', description: 'Edit profile', category: 'profile' },
  ]).returning();

  // Assign permissions to roles
  // Admin gets everything
  const adminPermissions = permissionsData.map(p => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // User gets basic permissions
  const userPermissions = permissionsData
    .filter(p => ['content:view', 'profile:view', 'profile:edit'].includes(p.name))
    .map(p => ({
      roleId: userRole.id,
      permissionId: p.id,
    }));

  // Author gets content permissions
  const authorPermissions = permissionsData
    .filter(p => p.category === 'content' || p.category === 'profile')
    .map(p => ({
      roleId: authorRole.id,
      permissionId: p.id,
    }));

  await db.insert(rolePermissions).values([
    ...adminPermissions,
    ...userPermissions,
    ...authorPermissions,
  ]);

  console.log('✅ RBAC data seeded successfully');
}

seedRBAC();
```

Run: `npx tsx scripts/seed-rbac.ts`

### 3. Create Database

**Location**: `scripts/create-database.ts`

```typescript
import { Pool } from 'pg';

async function createDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log('✅ Database created');
  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await pool.end();
  }
}

createDatabase();
```

## Queries & Operations

### Basic Queries

```typescript
import { db } from '@/server/db';
import { users, roles, userRoles } from '@/server/db/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';

// Select all users
const allUsers = await db.select().from(users);

// Find user by email
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com'),
});

// Find user with roles
const userWithRoles = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    userRoles: {
      with: {
        role: true,
      },
    },
  },
});

// Insert user
const [newUser] = await db.insert(users).values({
  email: 'new@example.com',
  name: 'New User',
  password: hashedPassword,
}).returning();

// Update user
await db.update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, userId));

// Delete user
await db.delete(users).where(eq(users.id, userId));
```

### Complex Queries

```typescript
// Get user's all permissions
const userPermissions = await db.query.userRoles.findMany({
  where: eq(userRoles.userId, userId),
  with: {
    role: {
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    },
  },
});

// Search users
const searchResults = await db.select()
  .from(users)
  .where(
    or(
      like(users.name, `%${searchTerm}%`),
      like(users.email, `%${searchTerm}%`)
    )
  )
  .limit(10);

// Get active subscriptions
const activeSubscriptions = await db.query.subscriptions.findMany({
  where: and(
    eq(subscriptions.status, 'active'),
    gt(subscriptions.currentPeriodEnd, new Date())
  ),
  with: {
    user: true,
  },
});

// Pagination
const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const paginatedUsers = await db.select()
  .from(users)
  .limit(limit)
  .offset(offset)
  .orderBy(desc(users.createdAt));
```

### Transactions

```typescript
import { db } from '@/server/db';

// Execute multiple queries in a transaction
await db.transaction(async (tx) => {
  // Create user
  const [user] = await tx.insert(users).values({
    email: 'user@example.com',
    name: 'User Name',
  }).returning();

  // Get default role
  const defaultRole = await tx.query.roles.findFirst({
    where: eq(roles.isDefault, true),
  });

  // Assign role to user
  if (defaultRole) {
    await tx.insert(userRoles).values({
      userId: user.id,
      roleId: defaultRole.id,
    });
  }
});
```

## Best Practices

### 1. Use Transactions for Related Operations

```typescript
// ✅ Good - Atomic operation
await db.transaction(async (tx) => {
  await tx.delete(userRoles).where(eq(userRoles.userId, userId));
  await tx.insert(userRoles).values(newRoles);
});

// ❌ Bad - Can fail partially
await db.delete(userRoles).where(eq(userRoles.userId, userId));
await db.insert(userRoles).values(newRoles);
```

### 2. Use Indexes for Frequent Queries

```typescript
// Add indexes for columns used in WHERE clauses
export const usersEmailIdx = index('users_email_idx').on(users.email);
```

### 3. Use Proper Foreign Keys

```typescript
// ✅ Good - Cascade delete
userId: uuid('user_id')
  .references(() => users.id, { onDelete: 'cascade' })

// ❌ Bad - Orphaned records
userId: uuid('user_id')
```

### 4. Validate Data at Database Level

```typescript
// Use constraints
email: text('email').notNull().unique(),
status: text('status').notNull().default('active'),
```

### 5. Use UUID for Primary Keys

```typescript
// ✅ Good - Secure, non-sequential
id: uuid('id').defaultRandom().primaryKey()

// ❌ Bad - Predictable, security risk
id: serial('id').primaryKey()
```

### 6. Add Timestamps

```typescript
// Always include
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull(),
```

### 7. Use JSON for Flexible Data

```typescript
// For dynamic/flexible data
metadata: jsonb('metadata'),

// Query JSON fields
where: sql`metadata->>'key' = 'value'`
```

### 8. Connection Pooling

```typescript
// Configure pool properly
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection string
echo $DATABASE_URL
```

**2. Migration Fails**
```bash
# Reset database (development only!)
npm run db:drop
npm run db:migrate
```

**3. Permission Denied**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE BookEase TO username;
```

**4. Duplicate Key Error**
```typescript
// Handle unique constraint violations
try {
  await db.insert(users).values({ email });
} catch (error) {
  if (error.code === '23505') {
    throw new Error('Email already exists');
  }
}
```

## Next Steps

- Read [05-API-ROUTES.md](./05-API-ROUTES.md) for API documentation
- Check [10-TESTING.md](./10-TESTING.md) for database testing
- Review [11-DEPLOYMENT.md](./11-DEPLOYMENT.md) for production setup
