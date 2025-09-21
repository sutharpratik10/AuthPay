ALTER TABLE "payment_orders" DROP CONSTRAINT "payment_orders_plan_id_subscription_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "razorpay_subscription_id" varchar(100);--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;