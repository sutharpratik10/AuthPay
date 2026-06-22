import { Routes } from '@/routes/routes';
import { NextRequest } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * POST /api/auth/forgot-password - Initiate password reset  
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents abuse)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) => {
  return Routes.initiatePasswordReset(req);
});
