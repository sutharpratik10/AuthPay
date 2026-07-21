import { NextRequest } from 'next/server';
import { createAuthSSEStream } from '@/server/sse/auth-stream';
import { RBACService } from '@/lib/rbac/rbac-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return createAuthSSEStream(request, {
    channelName: 'admin:notifications',
    authorize: async (session) => {
      // Use RBAC service to verify admin role
      return RBACService.isAdmin(session.user.id!);
    }
  });
}
