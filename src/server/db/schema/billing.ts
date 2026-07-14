import { pgTable, pgSchema, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const billingSchema = pgSchema("billing");


export const subscriptionPlans = billingSchema.table("subscription_plans", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	description: varchar('description', { length: 500 }),
	price: varchar('price', { length: 50 }).notNull(), // Stored as string to handle different currencies
	billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, yearly, etc.
	features: varchar('features', { length: 1000 }), // JSON stringified list of features
	isActive: boolean('is_active').default(true).notNull(),
	isVisibleToCustomers: boolean('is_visible_to_customers').default(true).notNull(), // Control visibility on pricing page
	// Razorpay integration fields (all nullable)
	razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
	razorpaySubscriptionPlanId: varchar('razorpay_subscription_plan_id', { length: 100 }),
	razorpaySubscriptionLink: varchar('razorpay_subscription_link', { length: 255 }),
	// Stripe integration fields (all nullable)
	stripeProductId: varchar('stripe_product_id', { length: 100 }),
	stripePriceId: varchar('stripe_price_id', { length: 100 }),
	displayOrder: integer('display_order').default(0),
	badgeText: varchar('badge_text', { length: 50 }),
	enableAutoPopular: boolean('enable_auto_popular').default(false),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const billings = billingSchema.table("billings", {
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


export const paymentOrders = billingSchema.table("payment_orders", {
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


export const paymentTransactions = billingSchema.table("payment_transactions", {
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

// ============================================================
// Payment Gateway Configuration (admin-controlled geo-routing)
// ============================================================

export const paymentGatewayConfig = billingSchema.table("payment_gateway_config", {
	id: uuid('id').defaultRandom().primaryKey(),
	// NULL = global/default rule; ISO 3166-1 alpha-2 code = country-specific rule
	countryCode: varchar('country_code', { length: 2 }),
	// 'razorpay' | 'stripe' | 'none'
	gateway: varchar('gateway', { length: 20 }).notNull(),
	isEnabled: boolean('is_enabled').default(true).notNull(),
	// Marks the global fallback rule (used when countryCode IS NULL)
	isDefault: boolean('is_default').default(false).notNull(),
	notes: varchar('notes', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "payment_gateway_config_created_by_users_id_fk"
	}).onDelete("set null"),
]);


export const subscriptionStatuses = billingSchema.table("subscription_statuses", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 32 }).notNull().unique(),
	description: varchar('description', { length: 255 })
});


export const subscriptionRenewalTypes = billingSchema.table("subscription_renewal_types", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 20 }).notNull().unique(),
	description: varchar('description', { length: 255 })
});


export const userSubscriptions = billingSchema.table("user_subscriptions", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	// planId made nullable to support subscriptions created directly on Razorpay
	planId: uuid('plan_id').references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
	paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id, { onDelete: 'set null' }),
	statusId: uuid('status_id').notNull().references(() => subscriptionStatuses.id),
	renewalTypeId: uuid('renewal_type_id').references(() => subscriptionRenewalTypes.id),
	// Razorpay metadata (nullable)
	providerSubscriptionId: varchar('provider_subscription_id', { length: 100 }),
	providerCustomerId: varchar('provider_customer_id', { length: 100 }),
	startDate: timestamp('start_date', { mode: 'string' }).notNull(),
	expiryDate: timestamp('expiry_date', { mode: 'string' }),
	endDate: timestamp('end_date', { mode: 'string' }),
	cancellationReason: varchar('cancellation_reason', { length: 255 }),
	paymentGatewayProvider: varchar('payment_gateway_provider', { length: 50 }),
	lastPaymentDate: timestamp('last_payment_date', { mode: 'string' }),
	nextBillingDate: timestamp('next_billing_date', { mode: 'string' }),
	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});


export const freeTrialSettings = billingSchema.table("free_trial_settings", {
	id: uuid('id').defaultRandom().primaryKey(),
	planId: uuid('plan_id').references(() => subscriptionPlans.id, { onDelete: 'cascade' }).notNull(),
	durationDays: integer('duration_days').notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const refundRequests = billingSchema.table("refund_requests", {
	id: uuid('id').defaultRandom().primaryKey(),
	paymentOrderId: uuid('payment_order_id').notNull().references(() => paymentOrders.id),
	userId: uuid('user_id').notNull().references(() => users.id),
	planId: uuid('plan_id').references(() => subscriptionPlans.id),
	amountMinor: integer('amount_minor').notNull(),
	currency: varchar('currency', { length: 3 }).notNull(),
	reason: text('reason').notNull(),
	status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, completed, failed
	gateway: varchar('gateway', { length: 50 }).notNull(), // razorpay or stripe
	gatewayPaymentId: varchar('gateway_payment_id', { length: 150 }).notNull(),
	gatewayRefundId: varchar('gateway_refund_id', { length: 150 }),
	gatewayResponse: jsonb('gateway_response'),
	approvedBy: uuid('approved_by').references(() => users.id),
	approvedAt: timestamp('approved_at'),
	processedAt: timestamp('processed_at'),
	completedAt: timestamp('completed_at'),
	failureReason: text('failure_reason'),
	revokeSubscription: boolean('revoke_subscription').default(false).notNull(),
	subscriptionAction: varchar('subscription_action', { length: 20 }).default('none'), // none, cancelled, keep_active
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.paymentOrderId],
		foreignColumns: [paymentOrders.id],
		name: "refund_requests_payment_order_id_payment_orders_id_fk"
	}),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "refund_requests_user_id_users_id_fk"
	}),
	foreignKey({
		columns: [table.planId],
		foreignColumns: [subscriptionPlans.id],
		name: "refund_requests_plan_id_subscription_plans_id_fk"
	}),
	foreignKey({
		columns: [table.approvedBy],
		foreignColumns: [users.id],
		name: "refund_requests_approved_by_users_id_fk"
	})
]);


