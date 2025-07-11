import { pgTable, uuid, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Languages table - stores available language options
 */
export const languages = pgTable('languages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "English (US)"
  code: varchar('code', { length: 10 }).notNull().unique(), // e.g., "en-US"
  nativeName: varchar('native_name', { length: 100 }), // e.g., "English"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Timezones table - stores available timezone options
 */
export const timezones = pgTable('timezones', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "Pacific Time"
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g., "UTC-8"
  utcOffset: integer('utc_offset').notNull(), // Offset from UTC in minutes
  description: varchar('description', { length: 255 }), // Additional description
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});