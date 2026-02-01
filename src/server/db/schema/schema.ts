import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core"

export const subscriptionPlans = pgTable("subscription_plans", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	description: varchar('description', { length: 500 }),
	price: varchar('price', { length: 50 }).notNull(), // Stored as string to handle different currencies
	billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, yearly, etc.
	features: varchar('features', { length: 1000 }), // JSON stringified list of features
	isActive: boolean('is_active').default(true).notNull(),
	// Razorpay integration fields (all nullable)
	razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
	razorpaySubscriptionPlanId: varchar('razorpay_subscription_plan_id', { length: 100 }),
	razorpaySubscriptionLink: varchar('razorpay_subscription_link', { length: 255 }),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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

export const adminDashboardStats = pgTable("admin_dashboard_stats", {
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

export const userUsageMetrics = pgTable("user_usage_metrics", {
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

export const auditLogs = pgTable("audit_logs", {
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

export const errorLogs = pgTable("error_logs", {
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

export const userNotifications = pgTable("user_notifications", {
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

export const billings = pgTable("billings", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	planId: uuid('plan_id').references(() => subscriptionPlans.id),
	invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
	amount: varchar('amount', { length: 50 }).notNull(),
	currency: varchar('currency', { length: 3 }).notNull().default('USD'),
	status: varchar('status', { length: 20 }).notNull(), // paid, pending, failed
	paymentDate: timestamp('payment_date'),
	paymentMethod: varchar('payment_method', { length: 50 }),
	billingStartDate: timestamp('billing_start_date').notNull(),
	billingEndDate: timestamp('billing_end_date').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "billings_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.planId],
		foreignColumns: [subscriptionPlans.id],
		name: "billings_plan_id_subscription_plans_id_fk"
	}),
]);

export const permissions = pgTable("permissions", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // Policy name like "content:create", "user:manage"
	description: varchar('description', { length: 500 }),
	category: varchar('category', { length: 50 }), // user management, billing, content, etc.
	displayName: varchar('display_name', { length: 100 }),
	resource: varchar('resource', { length: 100 }), // The resource type: "content", "user", "billing"
	action: varchar('action', { length: 50 }), // The action: "create", "read", "update", "delete", "manage"
	isSystemManaged: boolean('is_system_managed').default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable("roles", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	description: varchar('description', { length: 500 }),
	isDefault: boolean('is_default').default(false),
	isSystemManaged: boolean('is_system_managed').default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
	unique("roles_name_key").on(t.name)
]);

export const rolePermissions = pgTable("role_permissions", {
	id: uuid('id').defaultRandom().primaryKey(),
	roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
	permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
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

export const otpCodes = pgTable("otp_codes", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	code: varchar('code', { length: 10 }).notNull(),
	type: varchar('type', { length: 20 }).notNull(), // email verification, password reset, 2FA
	expiresAt: timestamp('expires_at').notNull(),
	usedAt: timestamp('used_at'),
	isValid: boolean('is_valid').default(true),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	attemptCount: integer('attempt_count').default(0),
	// Secure token-based flow for password reset
	sessionToken: varchar('session_token', { length: 64 }), // Token from email step
	verifiedToken: varchar('verified_token', { length: 64 }), // Token after code verification
	verifiedAt: timestamp('verified_at'), // When code was verified
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "otp_codes_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const recoveryCodes = pgTable("recovery_codes", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	code: varchar('code', { length: 20 }).notNull(),
	isUsed: boolean('is_used').default(false),
	usedAt: timestamp('used_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "recovery_codes_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const twoFactorAuth = pgTable("two_factor_auth", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
	enabled: boolean('enabled').default(false).notNull(),
	secret: varchar('secret', { length: 255 }),
	method: varchar('method', { length: 20 }).notNull().default('app'), // app, sms, email
	phoneNumber: varchar('phone_number', { length: 20 }),
	backupCodes: text('backup_codes'), // JSON stringified array of codes
	lastVerifiedAt: timestamp('last_verified_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "two_factor_auth_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	browserName: varchar('browser_name', { length: 50 }), // Store parsed browser name instead of full user agent
	ipAddress: varchar('ip_address', { length: 45 }),
	lastActiveAt: timestamp('last_active_at').defaultNow(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "sessions_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const userAvatars = pgTable("user_avatars", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
	fileName: varchar('file_name', { length: 255 }).notNull(),
	fileSize: varchar('file_size', { length: 50 }),
	mimeType: varchar('mime_type', { length: 100 }),
	uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_avatars_user_id_users_id_fk"
	}).onDelete("cascade"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	token: varchar('token', { length: 255 }).notNull().unique(),
	code: varchar('code', { length: 10 }).notNull(), // 6-digit OTP code
	expiresAt: timestamp('expires_at').notNull(),
	isUsed: boolean('is_used').default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "password_reset_tokens_user_id_users_id_fk"
	}).onDelete("cascade"),
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
	isSuspended: boolean("is_suspended").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	avatarUrl: varchar("avatar_url", { length: 255 }),
}, (table) => [
	unique("users_email_unique").on(table.email)
]);

// Many-to-many relationship: Users can have multiple roles
export const userRoles = pgTable("user_roles", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
	assignedAt: timestamp('assigned_at').defaultNow().notNull(),
	assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }), // Track who assigned this role
}, (table) => [
	unique("user_roles_user_id_role_id_unique").on(table.userId, table.roleId)
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
	twoFactorAuth: boolean("two_factor_auth").default(false),
	mfaAuth: boolean("mfa_auth").default(false),
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
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "English (US)"
	code: varchar('code', { length: 10 }).notNull().unique(), // e.g., "en-US"
	nativeName: varchar('native_name', { length: 100 }), // e.g., "English"
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timezones = pgTable("timezones", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "Pacific Time"
	code: varchar('code', { length: 50 }).notNull().unique(), // e.g., "UTC-8"
	utcOffset: integer('utc_offset').notNull(), // Offset from UTC in minutes
	description: varchar('description', { length: 255 }), // Additional description
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires").notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk" }),
]);

export const accounts = pgTable("accounts", {
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refresh_token: text("refresh_token"),
	access_token: text("access_token"),
	expires_at: integer("expires_at"),
	token_type: text("token_type"),
	scope: text("scope"),
	id_token: text("id_token"),
	session_state: text("session_state"),
	created_at: timestamp("created_at").defaultNow().notNull(),
	updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "accounts_user_id_users_id_fk"
	}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_provider_account_id_pk" }),
]);

export const paymentOrders = pgTable("payment_orders", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
	planId: uuid('plan_id').references(() => subscriptionPlans.id),
	// Link to billing by invoice number if created beforehand (optional)
	invoiceNumber: varchar('invoice_number', { length: 50 }),
	// Your internal order id to reconcile UI/client flows
	orderId: varchar('order_id', { length: 100 }).notNull().unique(),    // Provider specific identifiers
	provider: varchar('provider', { length: 50 }).notNull().default('internal'),
	providerOrderId: varchar('provider_order_id', { length: 150 }),
	providerTransactionId: varchar('provider_transaction_id', { length: 150 }),
	amountMinor: integer('amount_minor').notNull(), // in paisa
	currency: varchar('currency', { length: 3 }).notNull().default('INR'),
	purpose: varchar('purpose', { length: 50 }).notNull().default('subscription'),
	status: varchar('status', { length: 20 }).notNull().default('created'), // created, pending, success, failed, expired
	razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }), // Razorpay subscription id (nullable)
	redirectUrl: varchar('redirect_url', { length: 500 }), 	// Payment provider redirect/callback urls and data
	callbackUrl: varchar('callback_url', { length: 500 }),
	// Integrity fields
	saltIndex: varchar('salt_index', { length: 10 }),
	xVerify: varchar('x_verify', { length: 255 }),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "payment_orders_user_id_users_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.planId],
		foreignColumns: [subscriptionPlans.id],
		name: "payment_orders_plan_id_subscription_plans_id_fk"
	}),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: uuid('id').defaultRandom().primaryKey(),
	paymentOrderId: uuid('payment_order_id').notNull().references(() => paymentOrders.id, { onDelete: 'cascade' }),
	provider: varchar('provider', { length: 50 }).notNull().default('internal'),
	event: varchar('event', { length: 50 }).notNull(), // created, callback, status_check, refund, etc.
	status: varchar('status', { length: 20 }).notNull(), // success, pending, failed, initiated
	providerOrderId: varchar('provider_order_id', { length: 150 }),
	providerTransactionId: varchar('provider_transaction_id', { length: 150 }),
	message: varchar('message', { length: 255 }),
	rawRequest: jsonb('raw_request'),
	rawResponse: jsonb('raw_response'),
	receivedAt: timestamp('received_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.paymentOrderId],
		foreignColumns: [paymentOrders.id],
		name: "payment_transactions_payment_order_id_payment_orders_id_fk"
	}).onDelete("cascade"),
]);

export const subscriptionStatuses = pgTable("subscription_statuses", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 32 }).notNull().unique(),
	description: varchar('description', { length: 255 })
});

export const subscriptionRenewalTypes = pgTable("subscription_renewal_types", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 20 }).notNull().unique(),
	description: varchar('description', { length: 255 })
});

export const userSubscriptions = pgTable("user_subscriptions", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	// planId made nullable to support subscriptions created directly on Razorpay
	planId: uuid('plan_id').references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
	statusId: uuid('status_id').notNull().references(() => subscriptionStatuses.id),
	renewalTypeId: uuid('renewal_type_id').references(() => subscriptionRenewalTypes.id),
	// Razorpay metadata (nullable)
	razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
	razorpayCustomerId: varchar('razorpay_customer_id', { length: 100 }),
	startDate: timestamp('start_date', { mode: 'string' }).notNull(),
	expiryDate: timestamp('expiry_date', { mode: 'string' }),
	endDate: timestamp('end_date', { mode: 'string' }),
	cancellationReason: varchar('cancellation_reason', { length: 255 }),
	paymentMethod: varchar('payment_method', { length: 50 }),
	lastPaymentDate: timestamp('last_payment_date', { mode: 'string' }),
	nextBillingDate: timestamp('next_billing_date', { mode: 'string' }),
	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================
// APPOINTMENT BOOKING SYSTEM (Multi-tenant)
// ============================================

// Business profile for appointment booking
export const businesses = pgTable("businesses", {
	id: uuid('id').defaultRandom().primaryKey(),
	ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	// Unique slug for public booking page: /book/[slug]
	slug: varchar('slug', { length: 50 }).notNull().unique(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	logo: varchar('logo', { length: 255 }),
	phone: varchar('phone', { length: 20 }),
	email: varchar('email', { length: 255 }),
	address: text('address'),
	timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),
	// Booking settings
	bookingLeadTime: integer('booking_lead_time').default(60), // Minutes before slot
	bookingWindowDays: integer('booking_window_days').default(30), // How far ahead
	slotDuration: integer('slot_duration').default(30), // Default slot in minutes
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.ownerId],
		foreignColumns: [users.id],
		name: "businesses_owner_id_users_id_fk"
	}).onDelete("cascade"),
]);

// Services offered by a business
export const services = pgTable("services", {
	id: uuid('id').defaultRandom().primaryKey(),
	businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	duration: integer('duration').notNull(), // Duration in minutes
	price: integer('price').default(0), // Price in minor units (paisa)
	currency: varchar('currency', { length: 3 }).default('INR'),
	color: varchar('color', { length: 7 }), // Hex color for calendar display
	isActive: boolean('is_active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.businessId],
		foreignColumns: [businesses.id],
		name: "services_business_id_businesses_id_fk"
	}).onDelete("cascade"),
]);

// Weekly business hours configuration
export const businessHours = pgTable("business_hours", {
	id: uuid('id').defaultRandom().primaryKey(),
	businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
	dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
	openTime: varchar('open_time', { length: 5 }).notNull(), // "09:00"
	closeTime: varchar('close_time', { length: 5 }).notNull(), // "18:00"
	isClosed: boolean('is_closed').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.businessId],
		foreignColumns: [businesses.id],
		name: "business_hours_business_id_businesses_id_fk"
	}).onDelete("cascade"),
]);

// Blocked dates (holidays, special closures)
export const blockedDates = pgTable("blocked_dates", {
	id: uuid('id').defaultRandom().primaryKey(),
	businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
	date: timestamp('date').notNull(),
	reason: varchar('reason', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.businessId],
		foreignColumns: [businesses.id],
		name: "blocked_dates_business_id_businesses_id_fk"
	}).onDelete("cascade"),
]);

// Appointments/bookings
export const appointments = pgTable("appointments", {
	id: uuid('id').defaultRandom().primaryKey(),
	businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
	serviceId: uuid('service_id').notNull().references(() => services.id),
	// Customer (nullable for registered users, required fields for guest booking)
	customerId: uuid('customer_id').references(() => users.id, { onDelete: 'set null' }),
	customerName: varchar('customer_name', { length: 100 }).notNull(),
	customerEmail: varchar('customer_email', { length: 255 }).notNull(),
	customerPhone: varchar('customer_phone', { length: 20 }),
	// Appointment timing
	appointmentDate: timestamp('appointment_date').notNull(),
	startTime: varchar('start_time', { length: 5 }).notNull(), // "10:00"
	endTime: varchar('end_time', { length: 5 }).notNull(), // "10:30"
	// Status: pending, confirmed, cancelled, completed, no_show
	status: varchar('status', { length: 20 }).notNull().default('confirmed'),
	notes: text('notes'),
	// Timestamps
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	cancelledAt: timestamp('cancelled_at'),
	cancellationReason: varchar('cancellation_reason', { length: 255 }),
}, (table) => [
	foreignKey({
		columns: [table.businessId],
		foreignColumns: [businesses.id],
		name: "appointments_business_id_businesses_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.serviceId],
		foreignColumns: [services.id],
		name: "appointments_service_id_services_id_fk"
	}),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [users.id],
		name: "appointments_customer_id_users_id_fk"
	}).onDelete("set null"),
]);
