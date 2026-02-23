CREATE TABLE "break_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"description" varchar(255),
	"apply_to_all_days" boolean DEFAULT true NOT NULL,
	"days_of_week" integer[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "badge_text" varchar(50);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "enable_auto_popular" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "break_times" ADD CONSTRAINT "break_times_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;