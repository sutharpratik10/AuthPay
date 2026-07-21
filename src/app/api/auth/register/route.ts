import { NextRequest } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';
import { Routes } from '@/routes/routes';

export const runtime = 'nodejs';

export const POST = rateLimiters.auth(async (req: NextRequest): Promise<Response> => {
  return Routes.registerUser(req);
});
