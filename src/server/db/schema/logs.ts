import { pgTable, pgSchema, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { subscriptionPlans } from "./billing";

export const logsSchema = pgSchema("logs");


export const adminNotifications = logsSchema.table("admin_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	type: varchar({ length: 20 }).notNull(),
	priority: varchar({ length: 10 }).default('normal'),
	isRead: boolean("is_read").default(false).notNull(),
	link: varchar({ length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});


export const subscriptionAnalytics = logsSchema.table("subscription_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subscriptionPlanId: uuid("subscription_plan_id").notNull().references(() => subscriptionPlans.id),
	statDate: timestamp("stat_date", { mode: 'string' }).notNull(),
	activeUsers: integer("active_users").default(0),
	newSubscriptions: integer("new_subscriptions").default(0),
	cancelledSubscriptions: integer("cancelled_subscriptions").default(0),
	upgrades: integer("upgrades").default(0),
	downgrades: integer("downgrades").default(0),
	revenue: varchar("revenue", { length: 50 }).default('0'),
	churnRate: varchar("churn_rate", { length: 10 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.subscriptionPlanId],
		foreignColumns: [subscriptionPlans.id],
		name: "subscription_analytics_subscription_plan_id_subscription_plans_id_fk"
	}),
]);


export const adminDashboardStats = logsSchema.table("admin_dashboard_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").references(() => users.id),
	statDate: timestamp("stat_date", { mode: 'string' }).notNull(),
	activeUsers: integer("active_users").default(0),
	newUsers: integer("new_users").default(0),
	totalRevenue: varchar("total_revenue", { length: 50 }).default('0'),
	revenueChange: varchar("revenue_change", { length: 50 }),
	userGrowth: varchar("user_growth", { length: 50 }),
	totalStorageUsed: varchar("total_storage_used", { length: 50 }),
	avgSessionDuration: integer("avg_session_duration").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "admin_dashboard_stats_user_id_users_id_fk"
	}),
]);


export const userUsageMetrics = logsSchema.table("user_usage_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
	lastLoginDate: timestamp("last_login_date", { mode: 'string' }),
	sessionCount: integer("session_count").default(0),
	totalActiveTimeMinutes: integer("total_active_time_minutes").default(0),
	resourcesAccessed: integer("resources_accessed").default(0),
	actionsPerformed: integer("actions_performed").default(0),
	measurementPeriodStart: timestamp("measurement_period_start", { mode: 'string' }),
	measurementPeriodEnd: timestamp("measurement_period_end", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_usage_metrics_id_fk"
	}).onDelete("cascade"),
]);


export const auditLogs = logsSchema.table("audit_logs", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
	action: varchar('action', { length: 100 }).notNull(),
	entityType: varchar('entity_type', { length: 50 }).notNull(), // user, role, permission, etc.
	entityId: varchar('entity_id', { length: 50 }),
	oldValues: jsonb('old_values'),
	newValues: jsonb('new_values'),
	metadata: jsonb('metadata'),
	ipAddress: varchar('ip_address', { length: 45 }),
	userAgent: text('user_agent'),
	performedAt: timestamp('performed_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "audit_logs_user_id_users_id_fk"
	}).onDelete("set null"),
]);


export const errorLogs = logsSchema.table("error_logs", {
	id: uuid('id').defaultRandom().primaryKey(),
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
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "error_logs_user_id_users_id_fk"
	}),
]);


export const userNotifications = logsSchema.table("user_notifications", {
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
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_notifications_user_id_users_id_fk"
	}).onDelete("cascade"),
]);


