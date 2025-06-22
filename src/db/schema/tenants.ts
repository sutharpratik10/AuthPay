import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantUsers } from './users';
import { roles } from './roles'; // Make sure this path is correct
/**
 * Tenants table - represents organizations or accounts in the system
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  logoUrl: varchar('logo_url', { length: 255 }),
  primaryColor: varchar('primary_color', { length: 7 }),
  planId: uuid('plan_id').references(() => subscriptionPlans.id),
  planEffectiveDate: timestamp('plan_effective_date').defaultNow(),
  planExpiryDate: timestamp('plan_expiry_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscription plans table - defines available subscription tiers
 */
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  price: varchar('price', { length: 50 }).notNull(), // Stored as string to handle different currencies
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, yearly, etc.
  features: varchar('features', { length: 1000 }), // JSON stringified list of features
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant settings - configurable options for each tenant
 */
export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 100 }).notNull(),
  value: varchar('value', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Define relations for the tenants table
 */
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  plan: one(subscriptionPlans, {
    fields: [tenants.planId],
    references: [subscriptionPlans.id],
  }),
  settings: many(tenantSettings),
  users: many(tenantUsers),
  roles: many(roles),
  billings: many(billings),
  usageStatistics: many(usageStatistics),
}));

/**
 * Define relations for the subscription plans table
 */
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  tenants: many(tenants),
}));

/**
 * Define relations for the tenant settings table
 */
export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantSettings.tenantId],
    references: [tenants.id],
  }),
}));

/**
 * Billing history table - tracks subscription payments and invoices
 */
export const billings = pgTable('billings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
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
});

/**
 * Define relations for the billings table
 */
export const billingsRelations = relations(billings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [billings.tenantId],
    references: [tenants.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [billings.planId],
    references: [subscriptionPlans.id],
  }),
}));

/**
 * Usage statistics table - tracks tenant resource usage
 */
export const usageStatistics = pgTable('usage_statistics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userCount: varchar('user_count', { length: 10 }),
  storageUsed: varchar('storage_used', { length: 20 }), // in bytes as string
  apiCalls: varchar('api_calls', { length: 10 }),
  lastActivityDate: timestamp('last_activity_date'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Define relations for the usage statistics table
 */
export const usageStatisticsRelations = relations(usageStatistics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageStatistics.tenantId],
    references: [tenants.id],
  }),
}));
