import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core"

export const adminNotifications = pgTable("admin_notifications", {
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

export const subscriptionAnalytics = pgTable("subscription_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subscriptionPlanId: uuid("subscription_plan_id").notNull(),
	statDate: timestamp("stat_date", { mode: 'string' }).notNull(),
	activeTenants: integer("active_tenants").default(0),
	newSubscriptions: integer("new_subscriptions").default(0),
	cancelledSubscriptions: integer("cancelled_subscriptions").default(0),
	upgrades: integer().default(0),
	downgrades: integer().default(0),
	revenue: varchar({ length: 50 }).default('0'),
	churnRate: varchar("churn_rate", { length: 10 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const systemHealthLogs = pgTable("system_health_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cpuUsage: varchar("cpu_usage", { length: 10 }),
	memoryUsage: varchar("memory_usage", { length: 10 }),
	databaseConnections: integer("database_connections"),
	activeUsers: integer("active_users"),
	responseTime: integer("response_time"),
	queueLength: integer("queue_length"),
	loggedAt: timestamp("logged_at", { mode: 'string' }).defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 50 }).notNull(),
	logoUrl: varchar("logo_url", { length: 255 }),
	primaryColor: varchar("primary_color", { length: 7 }),
	planId: uuid("plan_id"),
	planEffectiveDate: timestamp("plan_effective_date", { mode: 'string' }).defaultNow(),
	planExpiryDate: timestamp("plan_expiry_date", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "tenants_plan_id_subscription_plans_id_fk"
		}),
	unique("tenants_slug_unique").on(table.slug),
]);

export const adminDashboardStats = pgTable("admin_dashboard_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
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
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "admin_dashboard_stats_tenant_id_tenants_id_fk"
		}),
]);

export const featureUsageAnalytics = pgTable("feature_usage_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	featureName: varchar("feature_name", { length: 100 }).notNull(),
	usageCount: integer("usage_count").default(0),
	uniqueUsers: integer("unique_users").default(0),
	statDate: timestamp("stat_date", { mode: 'string' }).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "feature_usage_analytics_tenant_id_tenants_id_fk"
		}),
]);

export const userUsageMetrics = pgTable("user_usage_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: uuid("user_id").notNull(),
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
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_usage_metrics_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_usage_metrics_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	userId: uuid("user_id"),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: varchar("entity_id", { length: 50 }),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	metadata: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	performedAt: timestamp("performed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "audit_logs_tenant_id_tenants_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const errorLogs = pgTable("error_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	userId: uuid("user_id"),
	errorCode: varchar("error_code", { length: 50 }),
	errorMessage: text("error_message").notNull(),
	stackTrace: text("stack_trace"),
	context: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	occurredAt: timestamp("occurred_at", { mode: 'string' }).defaultNow().notNull(),
	isSolved: boolean("is_solved").default(false),
	solvedAt: timestamp("solved_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "error_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "error_logs_user_id_users_id_fk"
		}),
]);

export const systemNotifications = pgTable("system_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	type: varchar({ length: 20 }).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	link: varchar({ length: 255 }),
	createdByUserId: uuid("created_by_user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "system_notifications_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "system_notifications_created_by_user_id_users_id_fk"
		}),
]);

export const userNotifications = pgTable("user_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	type: varchar({ length: 20 }).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	link: varchar({ length: 255 }),
	relatedEntityType: varchar("related_entity_type", { length: 50 }),
	relatedEntityId: varchar("related_entity_id", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const billings = pgTable("billings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	planId: uuid("plan_id"),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	amount: varchar({ length: 50 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: varchar({ length: 20 }).notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	paymentMethod: varchar("payment_method", { length: 50 }),
	billingStartDate: timestamp("billing_start_date", { mode: 'string' }).notNull(),
	billingEndDate: timestamp("billing_end_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "billings_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "billings_plan_id_subscription_plans_id_fk"
		}),
	unique("billings_invoice_number_unique").on(table.invoiceNumber),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	price: varchar({ length: 50 }).notNull(),
	billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
	features: varchar({ length: 1000 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const tenantSettings = pgTable("tenant_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: varchar({ length: 1000 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tenant_settings_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const usageStatistics = pgTable("usage_statistics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userCount: varchar("user_count", { length: 10 }),
	storageUsed: varchar("storage_used", { length: 20 }),
	apiCalls: varchar("api_calls", { length: 10 }),
	lastActivityDate: timestamp("last_activity_date", { mode: 'string' }),
	recordedAt: timestamp("recorded_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "usage_statistics_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const invitations = pgTable("invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	roleId: uuid("role_id"),
	sentByUserId: uuid("sent_by_user_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "invitations_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sentByUserId],
			foreignColumns: [users.id],
			name: "invitations_sent_by_user_id_users_id_fk"
		}),
	unique("invitations_token_unique").on(table.token),
]);

export const tenantUsers = pgTable("tenant_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: uuid("user_id").notNull(),
	isOwner: boolean("is_owner").default(false),
	isPrimary: boolean("is_primary").default(false),
	status: varchar({ length: 20 }).default('invited').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tenant_users_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tenant_users_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userActivityLogs = pgTable("user_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tenantId: uuid("tenant_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }),
	resourceId: varchar("resource_id", { length: 50 }),
	metadata: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 255 }),
	performedAt: timestamp("performed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_activity_logs_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_activity_logs_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const customUserPermissions = pgTable("custom_user_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantUserId: uuid("tenant_user_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	granted: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantUserId],
			foreignColumns: [tenantUsers.id],
			name: "custom_user_permissions_tenant_user_id_tenant_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "custom_user_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	category: varchar({ length: 50 }),
	displayName: varchar("display_name", { length: 100 }),
	isSystemManaged: boolean("is_system_managed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("permissions_name_unique").on(table.name),
]);

export const permissionGroups = pgTable("permission_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const permissionGroupItems = pgTable("permission_group_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [permissionGroups.id],
			name: "permission_group_items_group_id_permission_groups_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "permission_group_items_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	isDefault: boolean("is_default").default(false),
	isSystemManaged: boolean("is_system_managed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "roles_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roleId: uuid("role_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantUserId: uuid("tenant_user_id").notNull(),
	roleId: uuid("role_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantUserId],
			foreignColumns: [tenantUsers.id],
			name: "user_roles_tenant_user_id_tenant_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
]);

export const resources = pgTable("resources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	path: varchar({ length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resources_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const resourceAccessControls = pgTable("resource_access_controls", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceId: uuid("resource_id").notNull(),
	userId: uuid("user_id"),
	roleId: uuid("role_id"),
	accessType: varchar("access_type", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdByUserId: uuid("created_by_user_id"),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_access_controls_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resource_access_controls_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "resource_access_controls_created_by_user_id_users_id_fk"
		}),
]);

export const resourceComments = pgTable("resource_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceId: uuid("resource_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	replyToCommentId: uuid("reply_to_comment_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isEdited: boolean("is_edited").default(false),
	isDeleted: boolean("is_deleted").default(false),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_comments_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resource_comments_user_id_users_id_fk"
		}),
]);

export const resourceShares = pgTable("resource_shares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceId: uuid("resource_id").notNull(),
	userId: uuid("user_id"),
	email: varchar({ length: 255 }),
	accessToken: varchar("access_token", { length: 255 }).notNull(),
	accessType: varchar("access_type", { length: 20 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_shares_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resource_shares_user_id_users_id_fk"
		}),
]);

export const resourceVersions = pgTable("resource_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceId: uuid("resource_id").notNull(),
	version: varchar({ length: 20 }).notNull(),
	data: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdByUserId: uuid("created_by_user_id"),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_versions_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "resource_versions_created_by_user_id_users_id_fk"
		}),
]);

export const otpCodes = pgTable("otp_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	code: varchar({ length: 10 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	isValid: boolean("is_valid").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	attemptCount: integer("attempt_count").default(0),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "otp_codes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const recoveryCodes = pgTable("recovery_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	code: varchar({ length: 20 }).notNull(),
	isUsed: boolean("is_used").default(false),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "recovery_codes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const twoFactorAuth = pgTable("two_factor_auth", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	enabled: boolean().default(false).notNull(),
	secret: varchar({ length: 255 }),
	method: varchar({ length: 20 }).default('app').notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	backupCodes: text("backup_codes"),
	lastVerifiedAt: timestamp("last_verified_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "two_factor_auth_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("two_factor_auth_user_id_unique").on(table.userId),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	browserName: varchar("browser_name", { length: 50 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userAvatars = pgTable("user_avatars", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }),
	fileSize: varchar("file_size", { length: 50 }),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_avatars_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_avatars_user_id_unique").on(table.userId),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	isUsed: boolean("is_used").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	code: varchar({ length: 10 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }),
	name: varchar({ length: 100 }),
	image: varchar({ length: 255 }),
	isEmailVerified: boolean("is_email_verified").default(false),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	avatarUrl: varchar("avatar_url", { length: 255 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const userPreferences = pgTable("user_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	emailNotifications: boolean("email_notifications").default(true),
	securityAlerts: boolean("security_alerts").default(true),
	productUpdates: boolean("product_updates").default(false),
	profileVisibility: boolean("profile_visibility").default(true),
	theme: varchar({ length: 20 }).default('system'),
	additionalSettings: text("additional_settings"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	languageId: uuid("language_id"),
	timezoneId: uuid("timezone_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.languageId],
			foreignColumns: [languages.id],
			name: "user_preferences_language_id_languages_id_fk"
		}),
	foreignKey({
			columns: [table.timezoneId],
			foreignColumns: [timezones.id],
			name: "user_preferences_timezone_id_timezones_id_fk"
		}),
	unique("user_preferences_user_id_unique").on(table.userId),
]);

export const languages = pgTable("languages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	nativeName: varchar("native_name", { length: 100 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("languages_name_unique").on(table.name),
	unique("languages_code_unique").on(table.code),
]);

export const timezones = pgTable("timezones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	utcOffset: integer("utc_offset").notNull(),
	description: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("timezones_name_unique").on(table.name),
	unique("timezones_code_unique").on(table.code),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_provider_account_id_pk"}),
]);
