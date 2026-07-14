CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "billing";
--> statement-breakpoint
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "rbac";
--> statement-breakpoint
CREATE SCHEMA "logs";
--> statement-breakpoint
CREATE TABLE "auth"."accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"location" varchar(255),
	"device" varchar(255),
	"os" varchar(255),
	"browser" varchar(255),
	"user_agent" text,
	"login_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"is_valid" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"attempt_count" integer DEFAULT 0,
	"session_token" varchar(64),
	"verified_token" varchar(64),
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth"."password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth"."recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(255) NOT NULL,
	"is_used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"browser_name" varchar(50),
	"ip_address" varchar(45),
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."two_factor_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"secret" varchar(255),
	"method" varchar(20) DEFAULT 'app' NOT NULL,
	"phone_number" varchar(20),
	"backup_codes" text,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "two_factor_auth_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."user_avatars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" varchar(50),
	"mime_type" varchar(100),
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_avatars_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean DEFAULT true,
	"security_alerts" boolean DEFAULT true,
	"product_updates" boolean DEFAULT false,
	"profile_visibility" boolean DEFAULT true,
	"theme" varchar(20) DEFAULT 'system',
	"additional_settings" text,
	"dashboard_layout" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"language_id" uuid,
	"timezone_id" uuid,
	"two_factor_auth" boolean DEFAULT false,
	"mfa_auth" boolean DEFAULT false,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(100),
	"image" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true,
	"is_suspended" boolean DEFAULT false,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"password_changed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"emailVerified" timestamp,
	"avatar_url" varchar(255),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth"."verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "billing"."billings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_date" timestamp,
	"payment_method" varchar(50),
	"billing_start_date" timestamp NOT NULL,
	"billing_end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billings_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "billing"."free_trial_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"duration_days" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing"."payment_gateway_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" varchar(2),
	"gateway" varchar(20) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "billing"."payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"plan_id" uuid,
	"invoice_number" varchar(50),
	"order_id" varchar(100) NOT NULL,
	"provider" varchar(50) DEFAULT 'internal' NOT NULL,
	"provider_order_id" varchar(150),
	"provider_transaction_id" varchar(150),
	"amount_minor" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"purpose" varchar(50) DEFAULT 'subscription' NOT NULL,
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"razorpay_subscription_id" varchar(100),
	"redirect_url" varchar(500),
	"callback_url" varchar(500),
	"salt_index" varchar(10),
	"x_verify" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "billing"."payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_order_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'internal' NOT NULL,
	"event" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"provider_order_id" varchar(150),
	"provider_transaction_id" varchar(150),
	"message" varchar(255),
	"raw_request" jsonb,
	"raw_response" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing"."refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"amount_minor" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"gateway" varchar(50) NOT NULL,
	"gateway_payment_id" varchar(150) NOT NULL,
	"gateway_refund_id" varchar(150),
	"gateway_response" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"failure_reason" text,
	"revoke_subscription" boolean DEFAULT false NOT NULL,
	"subscription_action" varchar(20) DEFAULT 'none',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing"."subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"price" varchar(50) NOT NULL,
	"billing_cycle" varchar(20) NOT NULL,
	"features" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_visible_to_customers" boolean DEFAULT true NOT NULL,
	"razorpay_subscription_id" varchar(100),
	"razorpay_subscription_plan_id" varchar(100),
	"razorpay_subscription_link" varchar(255),
	"stripe_product_id" varchar(100),
	"stripe_price_id" varchar(100),
	"display_order" integer DEFAULT 0,
	"badge_text" varchar(50),
	"enable_auto_popular" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing"."subscription_renewal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(20) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "subscription_renewal_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "billing"."subscription_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(32) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "subscription_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "billing"."user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"payment_order_id" uuid,
	"status_id" uuid NOT NULL,
	"renewal_type_id" uuid,
	"provider_subscription_id" varchar(100),
	"provider_customer_id" varchar(100),
	"start_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"end_date" timestamp,
	"cancellation_reason" varchar(255),
	"payment_gateway_provider" varchar(50),
	"last_payment_date" timestamp,
	"next_billing_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"native_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "languages_name_unique" UNIQUE("name"),
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "core"."platform_settings" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"auto_process_refunds" boolean DEFAULT false NOT NULL,
	"refunds_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."timezones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"utc_offset" integer NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "timezones_name_unique" UNIQUE("name"),
	CONSTRAINT "timezones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rbac"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"category" varchar(50),
	"display_name" varchar(100),
	"resource" varchar(100),
	"action" varchar(50),
	"is_system_managed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rbac"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "rbac"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"is_default" boolean DEFAULT false,
	"is_system_managed" boolean DEFAULT false,
	"is_super_admin" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name"),
	CONSTRAINT "roles_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rbac"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "logs"."admin_dashboard_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"stat_date" timestamp NOT NULL,
	"active_users" integer DEFAULT 0,
	"new_users" integer DEFAULT 0,
	"total_revenue" varchar(50) DEFAULT '0',
	"revenue_change" varchar(50),
	"user_growth" varchar(50),
	"total_storage_used" varchar(50),
	"avg_session_duration" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs"."admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"priority" varchar(10) DEFAULT 'normal',
	"is_read" boolean DEFAULT false NOT NULL,
	"link" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(50),
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs"."error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"error_code" varchar(50),
	"error_message" text NOT NULL,
	"stack_trace" text,
	"context" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"is_solved" boolean DEFAULT false,
	"solved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logs"."subscription_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_plan_id" uuid NOT NULL,
	"stat_date" timestamp NOT NULL,
	"active_users" integer DEFAULT 0,
	"new_subscriptions" integer DEFAULT 0,
	"cancelled_subscriptions" integer DEFAULT 0,
	"upgrades" integer DEFAULT 0,
	"downgrades" integer DEFAULT 0,
	"revenue" varchar(50) DEFAULT '0',
	"churn_rate" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs"."user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" varchar(255),
	"related_entity_type" varchar(50),
	"related_entity_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs"."user_usage_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"last_login_date" timestamp,
	"session_count" integer DEFAULT 0,
	"total_active_time_minutes" integer DEFAULT 0,
	"resources_accessed" integer DEFAULT 0,
	"actions_performed" integer DEFAULT 0,
	"measurement_period_start" timestamp,
	"measurement_period_end" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_preferences" ADD CONSTRAINT "user_preferences_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "core"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_preferences" ADD CONSTRAINT "user_preferences_timezone_id_timezones_id_fk" FOREIGN KEY ("timezone_id") REFERENCES "core"."timezones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."billings" ADD CONSTRAINT "billings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."billings" ADD CONSTRAINT "billings_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."free_trial_settings" ADD CONSTRAINT "free_trial_settings_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payment_gateway_config" ADD CONSTRAINT "payment_gateway_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payment_orders" ADD CONSTRAINT "payment_orders_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payment_transactions" ADD CONSTRAINT "payment_transactions_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "billing"."payment_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."refund_requests" ADD CONSTRAINT "refund_requests_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "billing"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."refund_requests" ADD CONSTRAINT "refund_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."refund_requests" ADD CONSTRAINT "refund_requests_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."refund_requests" ADD CONSTRAINT "refund_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "billing"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_status_id_subscription_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "billing"."subscription_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_renewal_type_id_subscription_renewal_types_id_fk" FOREIGN KEY ("renewal_type_id") REFERENCES "billing"."subscription_renewal_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "rbac"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "rbac"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."admin_dashboard_stats" ADD CONSTRAINT "admin_dashboard_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."subscription_analytics" ADD CONSTRAINT "subscription_analytics_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "billing"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."user_usage_metrics" ADD CONSTRAINT "user_usage_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs"."user_usage_metrics" ADD CONSTRAINT "user_usage_metrics_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;