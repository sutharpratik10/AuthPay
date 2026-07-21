import { pgTable, pgSchema, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core";

export const coreSchema = pgSchema("core");


export const languages = coreSchema.table("languages", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "English (US)"
	code: varchar('code', { length: 10 }).notNull().unique(), // e.g., "en-US"
	nativeName: varchar('native_name', { length: 100 }), // e.g., "English"
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const timezones = coreSchema.table("timezones", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "Pacific Time"
	code: varchar('code', { length: 50 }).notNull().unique(), // e.g., "UTC-8"
	utcOffset: integer('utc_offset').notNull(), // Offset from UTC in minutes
	description: varchar('description', { length: 255 }), // Additional description
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const platformSettings = coreSchema.table("platform_settings", {
	id: varchar('id', { length: 50 }).primaryKey(),
	autoProcessRefunds: boolean('auto_process_refunds').default(false).notNull(),
	refundsEnabled: boolean('refunds_enabled').default(true).notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


