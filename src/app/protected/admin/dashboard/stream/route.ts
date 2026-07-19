export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          // Stream might be closed
        }
      };

      // Poll and push every 30 seconds
      const interval = setInterval(async () => {
        try {
          // send empty object as a heartbeat
          send({ type: "heartbeat" });
        } catch (e) {
          console.error("Interval SSE push failed", e);
        }
      }, 30_000);

      // cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
