import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

/**
 * Audit logs table - tracks system-wide actions for compliance
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // user, role, permission, tenant, etc.
  entityId: varchar('entity_id', { length: 50 }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
});

/**
 * System notifications - for system-wide alerts and messages
 */
export const systemNotifications = pgTable('system_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id), // Optional, null for system-wide
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // info, warning, error, success
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  link: varchar('link', { length: 255 }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User notifications - for user-specific notifications
 */
export const userNotifications = pgTable('user_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // info, warning, error, success
  isRead: boolean('is_read').default(false).notNull(),
  link: varchar('link', { length: 255 }),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: varchar('related_entity_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Error logs - for system error tracking
 */
export const errorLogs = pgTable('error_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  userId: uuid('user_id').references(() => users.id),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  context: jsonb('context'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  isSolved: boolean('is_solved').default(false),
  solvedAt: timestamp('solved_at'),
});

/**
 * Define relations for the audit logs table
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the system notifications table
 */
export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [systemNotifications.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [systemNotifications.createdByUserId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the user notifications table
 */
export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the error logs table
 */
export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [errorLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
}));
