ALTER TABLE "subscription_plans" ADD COLUMN "stripe_product_id" varchar(100);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "stripe_price_id" varchar(100);