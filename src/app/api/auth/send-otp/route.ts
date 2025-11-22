import { Routes } from '@/routes/routes';
import { NextRequest } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Send OTP route - handles sending OTP for verification purposes
 * This route delegates to the resend verification email functionality
 */
/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) =>req: NextRequest) {
  return Routes.resendVerificationEmail(req);
});