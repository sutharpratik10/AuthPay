import { Routes } from '@/routes/routes';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return Routes.verifyPasswordResetCode(req);
}
