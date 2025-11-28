/**
 * Request Queue with Graceful Degradation
 * 
 * Instead of immediately rejecting requests during high traffic,
 * this queue allows requests to wait in line with configurable
 * timeouts and graceful degradation strategies.
 * 
 * Features:
 * - Priority queuing (authenticated users get priority)
 * - Timeout handling
 * - Graceful degradation (return cached/degraded responses)
 * - Load shedding when queue is full
 */

export interface QueueConfig {
  /** Maximum queue size */
  maxQueueSize: number;
  /** Maximum wait time in ms before timing out */
  maxWaitTimeMs: number;
  /** Number of concurrent requests to process */
  concurrency: number;
  /** Enable priority queuing for authenticated users */
  enablePriority: boolean;
  /** Enable graceful degradation responses */
  enableDegradation: boolean;
}

export interface QueuedRequest {
  id: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  resolve: (result: QueueResult) => void;
  reject: (error: Error) => void;
  metadata?: {
    userId?: string;
    path?: string;
    method?: string;
  };
}

export interface QueueResult {
  status: 'processed' | 'timeout' | 'degraded' | 'rejected';
  waitTimeMs: number;
  queuePosition?: number;
  message?: string;
}

export interface QueueMetrics {
  currentQueueSize: number;
  totalQueued: number;
  totalProcessed: number;
  totalTimedOut: number;
  totalRejected: number;
  averageWaitTimeMs: number;
  maxWaitTimeMs: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = 0;
  private config: QueueConfig;
  private metrics: QueueMetrics;
  private processInterval: NodeJS.Timeout | null = null;
  private waitTimes: number[] = [];

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 10000,
      maxWaitTimeMs: config.maxWaitTimeMs ?? 30000, // 30 seconds
      concurrency: config.concurrency ?? 100,
      enablePriority: config.enablePriority ?? true,
      enableDegradation: config.enableDegradation ?? true,
    };

    this.metrics = {
      currentQueueSize: 0,
      totalQueued: 0,
      totalProcessed: 0,
      totalTimedOut: 0,
      totalRejected: 0,
      averageWaitTimeMs: 0,
      maxWaitTimeMs: 0,
    };

    // Process queue every 10ms
    this.processInterval = setInterval(() => {
      this.processQueue();
      this.checkTimeouts();
    }, 10);
  }

  /**
   * Enqueue a request and wait for processing
   */
  async enqueue(
    priority: 'high' | 'normal' | 'low' = 'normal',
    metadata?: QueuedRequest['metadata']
  ): Promise<QueueResult> {
    // Check if queue is full - apply load shedding
    if (this.queue.length >= this.config.maxQueueSize) {
      this.metrics.totalRejected++;
      
      // For degraded mode, return a degraded response instead of rejection
      if (this.config.enableDegradation) {
        return {
          status: 'degraded',
          waitTimeMs: 0,
          message: 'System under high load. Returning cached/degraded response.',
        };
      }
      
      return {
        status: 'rejected',
        waitTimeMs: 0,
        queuePosition: this.queue.length,
        message: 'Queue full. Please try again later.',
      };
    }

    const requestId = this.generateId();
    const timestamp = Date.now();

    return new Promise<QueueResult>((resolve, reject) => {
      const request: QueuedRequest = {
        id: requestId,
        priority,
        timestamp,
        resolve,
        reject,
        metadata,
      };

      // Insert based on priority
      if (this.config.enablePriority && priority === 'high') {
        // Find first non-high priority request and insert before it
        const insertIndex = this.queue.findIndex(r => r.priority !== 'high');
        if (insertIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(insertIndex, 0, request);
        }
      } else if (this.config.enablePriority && priority === 'low') {
        // Low priority goes to the end
        this.queue.push(request);
      } else {
        // Normal priority - insert after high, before low
        const insertIndex = this.queue.findIndex(r => r.priority === 'low');
        if (insertIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(insertIndex, 0, request);
        }
      }

      this.metrics.totalQueued++;
      this.metrics.currentQueueSize = this.queue.length;
    });
  }

  /**
   * Signal that a request has completed processing
   */
  complete(): void {
    this.processing = Math.max(0, this.processing - 1);
    this.metrics.totalProcessed++;
  }

  /**
   * Get current queue position for a request
   */
  getPosition(requestId: string): number {
    return this.queue.findIndex(r => r.id === requestId) + 1;
  }

  /**
   * Get estimated wait time based on current processing rate
   */
  getEstimatedWaitTime(): number {
    if (this.metrics.averageWaitTimeMs === 0) {
      return this.queue.length * 10; // Estimate 10ms per request if no data
    }
    const queuePosition = this.queue.length;
    return Math.round(queuePosition * (this.metrics.averageWaitTimeMs / this.metrics.totalProcessed));
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    return {
      ...this.metrics,
      currentQueueSize: this.queue.length,
    };
  }

  /**
   * Check if request should be queued (when system is under load)
   */
  shouldQueue(systemLoad: number): boolean {
    // Queue requests when system load exceeds 70%
    return systemLoad > 70;
  }

  /**
   * Process requests from the queue
   */
  private processQueue(): void {
    while (
      this.queue.length > 0 && 
      this.processing < this.config.concurrency
    ) {
      const request = this.queue.shift();
      if (!request) break;

      this.processing++;
      this.metrics.currentQueueSize = this.queue.length;

      const waitTime = Date.now() - request.timestamp;
      this.recordWaitTime(waitTime);

      request.resolve({
        status: 'processed',
        waitTimeMs: waitTime,
        queuePosition: 0,
      });
    }
  }

  /**
   * Check for timed out requests
   */
  private checkTimeouts(): void {
    const now = Date.now();
    const timedOut: QueuedRequest[] = [];

    this.queue = this.queue.filter(request => {
      const waitTime = now - request.timestamp;
      if (waitTime >= this.config.maxWaitTimeMs) {
        timedOut.push(request);
        return false;
      }
      return true;
    });

    // Handle timed out requests
    for (const request of timedOut) {
      this.metrics.totalTimedOut++;
      
      if (this.config.enableDegradation) {
        request.resolve({
          status: 'degraded',
          waitTimeMs: this.config.maxWaitTimeMs,
          message: 'Request timed out. Returning degraded response.',
        });
      } else {
        request.resolve({
          status: 'timeout',
          waitTimeMs: this.config.maxWaitTimeMs,
          message: 'Request timed out in queue.',
        });
      }
    }

    this.metrics.currentQueueSize = this.queue.length;
  }

  /**
   * Record wait time for metrics
   */
  private recordWaitTime(waitTime: number): void {
    this.waitTimes.push(waitTime);
    
    // Keep only last 1000 measurements
    if (this.waitTimes.length > 1000) {
      this.waitTimes.shift();
    }

    // Update metrics
    this.metrics.averageWaitTimeMs = Math.round(
      this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
    );
    this.metrics.maxWaitTimeMs = Math.max(...this.waitTimes);
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all pending requests
    for (const request of this.queue) {
      request.resolve({
        status: 'rejected',
        waitTimeMs: Date.now() - request.timestamp,
        message: 'Queue cleared.',
      });
    }
    this.queue = [];
    this.metrics.currentQueueSize = 0;
  }

  /**
   * Destroy the queue
   */
  destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const requestQueue = new RequestQueue({
  maxQueueSize: 10000,
  maxWaitTimeMs: 30000,
  concurrency: 100,
  enablePriority: true,
  enableDegradation: true,
});

// Configuration presets
export const QUEUE_PRESETS = {
  development: {
    maxQueueSize: 1000,
    maxWaitTimeMs: 10000,
    concurrency: 50,
    enablePriority: true,
    enableDegradation: true,
  },
  production: {
    maxQueueSize: 10000,
    maxWaitTimeMs: 30000,
    concurrency: 100,
    enablePriority: true,
    enableDegradation: true,
  },
  highThroughput: {
    maxQueueSize: 50000,
    maxWaitTimeMs: 60000,
    concurrency: 500,
    enablePriority: true,
    enableDegradation: true,
  },
} as const;

export { RequestQueue };
