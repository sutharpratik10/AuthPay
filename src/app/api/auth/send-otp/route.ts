import { Routes } from '@/routes/routes';
import { NextRequest } from 'next/server';

/**
 * Send OTP route - handles sending OTP for verification purposes
 * This route delegates to the resend verification email functionality
 */
export async function POST(req: NextRequest) {
  return Routes.resendVerificationEmail(req);
}