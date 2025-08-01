-- Add is2faVerified column to sessions table for enhanced 2FA security
ALTER TABLE "sessions" ADD COLUMN "is_2fa_verified" boolean DEFAULT false;
