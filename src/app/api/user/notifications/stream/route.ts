import { NextRequest } from 'next/server';
import { createAuthSSEStream } from '@/server/sse/auth-stream';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return createAuthSSEStream(request, {
    channelName: (userId) => `user:${userId}:notifications`,
  });
}
