ALTER TABLE "otp_codes" ADD COLUMN "session_token" varchar(64);--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "verified_token" varchar(64);--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "verified_at" timestamp;