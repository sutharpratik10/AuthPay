/**
 * System Health and Protection Status Endpoint
 * 
 * Returns the current status of all protection mechanisms:
 * - Global rate limiter status
 * - Request queue status
 * - Cache statistics
 * - Circuit breaker states
 * 
 * @route GET /api/health/system
 * @access Admin only in production
 */

import { NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/middleware/rate-limit';

export async function GET() {
  try {
    // In production, you should add authentication here
    // const session = await auth();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const health = getSystemHealth();

    // Determine overall system status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (health.globalRateLimit.status === 'critical') {
      overallStatus = 'critical';
    } else if (
      health.globalRateLimit.status === 'high' ||
      health.requestQueue.currentQueueSize > 1000 ||
      Object.values(health.circuitBreakers).some(cb => cb.state === 'OPEN')
    ) {
      overallStatus = 'degraded';
    }

    return NextResponse.json({
      status: overallStatus,
      timestamp: health.timestamp,
      
      // Global Rate Limiter
      globalRateLimit: {
        status: health.globalRateLimit.status,
        loadPercentage: health.globalRateLimit.loadPercentage,
        totalRequests: health.globalRateLimit.metrics.totalRequests,
        rejectedRequests: health.globalRateLimit.metrics.rejectedRequests,
        peakRequestsPerSecond: health.globalRateLimit.metrics.peakRequestsPerSecond,
      },
      
      // Request Queue
      requestQueue: {
        currentSize: health.requestQueue.currentQueueSize,
        totalQueued: health.requestQueue.totalQueued,
        totalProcessed: health.requestQueue.totalProcessed,
        totalTimedOut: health.requestQueue.totalTimedOut,
        totalRejected: health.requestQueue.totalRejected,
        averageWaitTimeMs: health.requestQueue.averageWaitTimeMs,
      },
      
      // Response Cache
      cache: {
        size: health.cache.size,
        hitRate: health.cache.hitRate,
        hits: health.cache.hits,
        misses: health.cache.misses,
        evictions: health.cache.evictions,
        staleHits: health.cache.staleHits,
      },
      
      // Circuit Breakers
      circuitBreakers: Object.entries(health.circuitBreakers).map(([name, cb]) => ({
        name,
        state: cb.state,
        failureRate: cb.metrics.failureRate,
        totalRequests: cb.metrics.totalRequests,
        rejectedRequests: cb.metrics.rejectedRequests,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[System Health] Error getting system health:', error);
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    );
  }
}
