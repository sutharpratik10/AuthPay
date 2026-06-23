import { getRevenueData, getUserGrowthData, getChurnRateData } from "../actions/analytics";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateRangeStr = url.searchParams.get("range") || "30d";
  const dateRange = dateRangeStr as any;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          // Stream might be closed
        }
      };

      // Push initial data
      try {
        const [revenue, growth, churn] = await Promise.all([
          getRevenueData(dateRange),
          getUserGrowthData(dateRange),
          getChurnRateData(dateRange),
        ]);
        send({ type: "revenue", payload: revenue });
        send({ type: "user-growth", payload: growth });
        send({ type: "churn", payload: churn });
      } catch (e) {
        console.error("Initial SSE push failed", e);
      }

      // Poll and push every 30 seconds
      const interval = setInterval(async () => {
        try {
          const [revenue, growth, churn] = await Promise.all([
            getRevenueData(dateRange),
            getUserGrowthData(dateRange),
            getChurnRateData(dateRange),
          ]);
          send({ type: "revenue", payload: revenue });
          send({ type: "user-growth", payload: growth });
          send({ type: "churn", payload: churn });
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
