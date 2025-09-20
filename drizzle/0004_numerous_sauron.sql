ALTER TABLE "subscription_plans" ADD COLUMN "razorpay_subscription_id" varchar(100);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "razorpay_subscription_plan_id" varchar(100);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "razorpay_subscription_link" varchar(255);