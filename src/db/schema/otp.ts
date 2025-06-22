import { pgTable, uuid, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * OTP codes table - for one-time password verification
 */
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 10 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // email verification, password reset, 2FA
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  isValid: boolean('is_valid').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  attemptCount: integer('attempt_count').default(0),
});

/**
 * Two Factor Authentication - stores 2FA settings
 */
export const twoFactorAuth = pgTable('two_factor_auth', {
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
});

/**
 * Recovery codes - for account recovery
 */
export const recoveryCodes = pgTable('recovery_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 20 }).notNull(),
  isUsed: boolean('is_used').default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Define relations for the OTP codes table
 */
export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the Two Factor Auth table
 */
export const twoFactorAuthRelations = relations(twoFactorAuth, ({ one }) => ({
  user: one(users, {
    fields: [twoFactorAuth.userId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the recovery codes table
 */
export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [recoveryCodes.userId],
    references: [users.id],
  }),
}));
