import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * User Preferences table - stores user customization settings
 */
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Notification preferences
  emailNotifications: boolean('email_notifications').default(true),
  securityAlerts: boolean('security_alerts').default(true),
  productUpdates: boolean('product_updates').default(false),
  
  // Privacy preferences
  profileVisibility: boolean('profile_visibility').default(true),
  
  // Localization preferences
  language: varchar('language', { length: 10 }).default('en-US'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Theme preferences
  theme: varchar('theme', { length: 20 }).default('system'), // light, dark, system
    // Additional preferences (stored as text for now, will convert to JSON later)
  additionalSettings: text('additional_settings'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Password Reset Tokens table - for secure password reset functionality
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 10 }).notNull(), // 6-digit OTP code
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * User Avatars table - for storing user profile pictures
 */
export const userAvatars = pgTable('user_avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

/**
 * Relations for user preferences
 */
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

/**
 * Relations for password reset tokens
 */
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

/**
 * Relations for user avatars
 */
export const userAvatarsRelations = relations(userAvatars, ({ one }) => ({
  user: one(users, {
    fields: [userAvatars.userId],
    references: [users.id],
  }),
}));
