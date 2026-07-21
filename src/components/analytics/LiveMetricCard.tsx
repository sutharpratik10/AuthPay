'use client';

import { useDashboardStream } from '@/hooks/use-dashboard-stream';
import { MetricSummaryCard } from '@/components/analytics/MetricSummaryCard';

interface LiveMetricCardProps {
  initialStats: any;
}

export function LiveMetricCard({ initialStats }: LiveMetricCardProps) {
  const { stats, isConnected } = useDashboardStream();

  const currentStats = stats || initialStats;

  return (
    <div className="relative">
      {!isConnected && (
        <div className="absolute top-2 right-2 p-1 z-10">
          <span className="flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" title="Reconnecting..."></span>
          </span>
        </div>
      )}
      {isConnected && (
        <div className="absolute top-2 right-2 p-1 z-10">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" title="Live"></span>
          </span>
        </div>
      )}
      <MetricSummaryCard stats={currentStats} />
    </div>
  );
}
