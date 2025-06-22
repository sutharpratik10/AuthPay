import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from '../tenants';
import { users } from '../users';

/**
 * Admin dashboard stats table - for analytics and metrics
 */
export const adminDashboardStats = pgTable('admin_dashboard_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  statDate: timestamp('stat_date').notNull(),
  activeUsers: integer('active_users').default(0),
  newUsers: integer('new_users').default(0),
  totalRevenue: varchar('total_revenue', { length: 50 }).default('0'),
  revenueChange: varchar('revenue_change', { length: 50 }), // percentage change
  userGrowth: varchar('user_growth', { length: 50 }), // percentage change
  totalStorageUsed: varchar('total_storage_used', { length: 50 }), // in bytes as string
  avgSessionDuration: integer('avg_session_duration').default(0), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * User usage metrics - for tracking individual user activity
 */
export const userUsageMetrics = pgTable('user_usage_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastLoginDate: timestamp('last_login_date'),
  sessionCount: integer('session_count').default(0),
  totalActiveTimeMinutes: integer('total_active_time_minutes').default(0),
  resourcesAccessed: integer('resources_accessed').default(0),
  actionsPerformed: integer('actions_performed').default(0),
  measurementPeriodStart: timestamp('measurement_period_start'),
  measurementPeriodEnd: timestamp('measurement_period_end'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscription analytics - for tracking subscription metrics
 */
export const subscriptionAnalytics = pgTable('subscription_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionPlanId: uuid('subscription_plan_id').notNull(),
  statDate: timestamp('stat_date').notNull(),
  activeTenants: integer('active_tenants').default(0),
  newSubscriptions: integer('new_subscriptions').default(0),
  cancelledSubscriptions: integer('cancelled_subscriptions').default(0),
  upgrades: integer('upgrades').default(0),
  downgrades: integer('downgrades').default(0),
  revenue: varchar('revenue', { length: 50 }).default('0'),
  churnRate: varchar('churn_rate', { length: 10 }), // percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Feature usage analytics - for tracking feature adoption
 */
export const featureUsageAnalytics = pgTable('feature_usage_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  featureName: varchar('feature_name', { length: 100 }).notNull(),
  usageCount: integer('usage_count').default(0),
  uniqueUsers: integer('unique_users').default(0),
  statDate: timestamp('stat_date').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Admin notifications - for admin-specific alerts
 */
export const adminNotifications = pgTable('admin_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // billing, user, security
  priority: varchar('priority', { length: 10 }).default('normal'), // high, normal, low
  isRead: boolean('is_read').default(false).notNull(),
  link: varchar('link', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * System health logs - for monitoring system performance
 */
export const systemHealthLogs = pgTable('system_health_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  cpuUsage: varchar('cpu_usage', { length: 10 }),
  memoryUsage: varchar('memory_usage', { length: 10 }),
  databaseConnections: integer('database_connections'),
  activeUsers: integer('active_users'),
  responseTime: integer('response_time'), // in milliseconds
  queueLength: integer('queue_length'),
  loggedAt: timestamp('logged_at').defaultNow().notNull(),
});

/**
 * Define relations for the admin dashboard stats table
 */
export const adminDashboardStatsRelations = relations(adminDashboardStats, ({ one }) => ({
  tenant: one(tenants, {
    fields: [adminDashboardStats.tenantId],
    references: [tenants.id],
  }),
}));

/**
 * Define relations for the user usage metrics table
 */
export const userUsageMetricsRelations = relations(userUsageMetrics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userUsageMetrics.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userUsageMetrics.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the feature usage analytics table
 */
export const featureUsageAnalyticsRelations = relations(featureUsageAnalytics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [featureUsageAnalytics.tenantId],
    references: [tenants.id],
  }),
}));
