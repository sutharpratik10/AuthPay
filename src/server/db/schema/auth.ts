import { pgTable, pgSchema, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core";
import { languages, timezones } from "./core";

export const authSchema = pgSchema("auth");


export const otpCodes = authSchema.table("otp_codes", {
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


export const recoveryCodes = authSchema.table("recovery_codes", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	code: varchar('code', { length: 255 }).notNull(),
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


export const twoFactorAuth = authSchema.table("two_factor_auth", {
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


export const sessions = authSchema.table("sessions", {
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


export const userAvatars = authSchema.table("user_avatars", {
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


export const passwordResetTokens = authSchema.table("password_reset_tokens", {
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


export const users = authSchema.table("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }),
	name: varchar({ length: 100 }),
	image: varchar({ length: 255 }),
	isEmailVerified: boolean("is_email_verified").default(false),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	isSuspended: boolean("is_suspended").default(false),
	failedLoginAttempts: integer("failed_login_attempts").default(0),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	passwordChangedAt: timestamp("password_changed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	avatarUrl: varchar("avatar_url", { length: 255 }),
}, (table) => [
	unique("users_email_unique").on(table.email)
]);

// Many-to-many relationship: Users can have multiple roles

export const userPreferences = authSchema.table("user_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	emailNotifications: boolean("email_notifications").default(true),
	securityAlerts: boolean("security_alerts").default(true),
	productUpdates: boolean("product_updates").default(false),
	profileVisibility: boolean("profile_visibility").default(true),
	theme: varchar({ length: 20 }).default('system'),
	additionalSettings: text("additional_settings"),
	dashboardLayout: jsonb("dashboard_layout"),
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


export const verificationTokens = authSchema.table("verification_tokens", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires").notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk" }),
]);


export const accounts = authSchema.table("accounts", {
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


export const loginHistory = authSchema.table("login_history", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	ipAddress: varchar('ip_address', { length: 45 }), // 45 chars for IPv6
	location: varchar('location', { length: 255 }), // City, Country
	device: varchar('device', { length: 255 }), // Mobile, Desktop
	os: varchar('os', { length: 255 }), // Windows, iOS
	browser: varchar('browser', { length: 255 }), // Chrome, Safari
	userAgent: text('user_agent'), // Raw string just in case
	loginAt: timestamp('login_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "login_history_user_id_users_id_fk"
	}).onDelete("cascade"),
]);


