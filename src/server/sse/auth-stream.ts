import { NextRequest } from 'next/server';
import { auth } from '@/config/auth';
import { sseManager, SSEController } from './channel';

export interface SSEStreamOptions {
  channelName: string | ((userId: string) => string);
  authorize?: (session: any) => boolean | Promise<boolean>;
  onConnect?: (userId: string, controller: SSEController) => void;
  onDisconnect?: (userId: string) => void;
}

export async function createAuthSSEStream(
  request: NextRequest,
  options: SSEStreamOptions
) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (options.authorize) {
    const isAuthorized = await options.authorize(session);
    if (!isAuthorized) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const userId = session.user.id;
  const channelNameStr = typeof options.channelName === 'function' ? options.channelName(userId) : options.channelName;
  const channel = sseManager.getChannel(channelNameStr);

  const stream = new ReadableStream({
    start(controller) {
      // Send an immediate connection established message to flush proxy buffers
      try {
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      } catch (e) {
        console.error('Failed to send initial SSE message', e);
      }

      channel.subscribe(userId, controller);

      if (options.onConnect) {
        options.onConnect(userId, controller);
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
        } catch (e) {
          // ignore
        }
      }, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        channel.unsubscribe(userId);
        if (options.onDisconnect) {
          options.onDisconnect(userId);
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
