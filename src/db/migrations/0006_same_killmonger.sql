ALTER TABLE "user_preferences" ADD COLUMN "two_factor_auth" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "mfa_auth" boolean DEFAULT false;