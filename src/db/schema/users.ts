import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { userRoles } from './roles';

/**
 * Users table - base user accounts
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // Hashed password
  name: varchar('name', { length: 100 }),
  
  // NextAuth compatibility columns
  image: varchar('image', { length: 255 }), // NextAuth image field
  emailVerified: timestamp('emailVerified'), // NextAuth emailVerified field
  
  // Custom columns
  avatarUrl: varchar('avatar_url', { length: 255 }), // Our custom avatar field
  isEmailVerified: boolean('is_email_verified').default(false), // Our custom verification field
  
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant users - maps users to tenants with roles 
 */
export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isOwner: boolean('is_owner').default(false),
  isPrimary: boolean('is_primary').default(false), // If user belongs to multiple tenants, which one is primary
  status: varchar('status', { length: 20 }).notNull().default('invited'), // invited, active, inactive, suspended
  joinedAt: timestamp('joined_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User sessions - tracks authenticated sessions
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  browserName: varchar('browser_name', { length: 50 }), // Store parsed browser name instead of full user agent
  ipAddress: varchar('ip_address', { length: 45 }),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Invitations - tracks pending invites to tenants
 */
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  roleId: uuid('role_id'),
  sentByUserId: uuid('sent_by_user_id').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User Activity Log - tracks user actions within the system
 */
export const userActivityLogs = pgTable('user_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: varchar('resource_id', { length: 50 }),
  metadata: text('metadata'), // JSON stringified metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 255 }),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
});

/**
 * Define relations for the users table
 */
export const usersRelations = relations(users, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  sessions: many(sessions),
}));

/**
 * Define relations for the tenant users table
 */
export const tenantUsersRelations = relations(tenantUsers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
  roles: many(userRoles),
}));

/**
 * Define relations for the sessions table
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the invitations table
 */
export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id],
  }),
  sentByUser: one(users, {
    fields: [invitations.sentByUserId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the user activity logs table
 */
export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [userActivityLogs.tenantId],
    references: [tenants.id],
  }),
}));
