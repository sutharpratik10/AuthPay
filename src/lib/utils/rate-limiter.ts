/**
 * Rate Limiter Utility
 * 
 * Comprehensive rate limiting solution that includes:
 * 1. Per-client rate limiting (IP-based) - Protects against individual abuse
 * 2. Global rate limiting - Protects total system capacity for high traffic (10,000+ users)
 * 
 * Uses sliding window algorithm for smooth rate limiting.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in the window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface GlobalRateLimitConfig {
  /** Maximum requests per second across all users */
  maxRequestsPerSecond: number;
  /** Maximum burst size (allows short spikes) */
  burstSize: number;
  /** Time window for calculating rate (in ms) */
  windowMs: number;
  /** Enable/disable global limiting */
  enabled: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface TimeSlot {
  timestamp: number;
  count: number;
}

interface GlobalMetrics {
  totalRequests: number;
  rejectedRequests: number;
  lastMinuteRequests: number;
  peakRequestsPerSecond: number;
}

// ============================================================================
// PER-CLIENT RATE LIMITER (IP-based)
// ============================================================================

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited (per-client)
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const entry = this.store[key];

    // No entry or expired window - create new
    if (!entry || now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        resetTime: this.store[key].resetTime,
        remaining: config.maxRequests - 1,
      };
    }

    // Within window - check limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return {
        allowed: true,
        resetTime: entry.resetTime,
        remaining: config.maxRequests - entry.count,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remaining: 0,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

// ============================================================================
// GLOBAL RATE LIMITER (System-wide capacity protection)
// ============================================================================

class GlobalRateLimiter {
  private slots: TimeSlot[] = [];
  private config: GlobalRateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private metrics: GlobalMetrics = {
    totalRequests: 0,
    rejectedRequests: 0,
    lastMinuteRequests: 0,
    peakRequestsPerSecond: 0,
  };

  constructor(config: Partial<GlobalRateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerSecond: config.maxRequestsPerSecond ?? 5000,
      burstSize: config.burstSize ?? 10000,
      windowMs: config.windowMs ?? 1000,
      enabled: config.enabled ?? true,
    };

    // Cleanup old slots every second
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
      this.updateMetrics();
    }, 1000);
  }

  /**
   * Check if request should be allowed based on global system capacity
   */
  check(): { 
    allowed: boolean; 
    currentRate: number; 
    maxRate: number;
    queuePosition?: number;
  } {
    if (!this.config.enabled) {
      return { allowed: true, currentRate: 0, maxRate: this.config.maxRequestsPerSecond };
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Count requests in current window
    const currentCount = this.slots
      .filter(slot => slot.timestamp >= windowStart)
      .reduce((sum, slot) => sum + slot.count, 0);

    this.metrics.totalRequests++;
    
    // Calculate current rate per second
    const currentRate = Math.round(currentCount * (1000 / this.config.windowMs));
    
    // Track peak rate
    if (currentRate > this.metrics.peakRequestsPerSecond) {
      this.metrics.peakRequestsPerSecond = currentRate;
    }

    // Check against burst size (allows temporary spikes)
    if (currentCount >= this.config.burstSize) {
      this.metrics.rejectedRequests++;
      return { 
        allowed: false, 
        currentRate,
        maxRate: this.config.maxRequestsPerSecond,
        queuePosition: currentCount - this.config.burstSize + 1,
      };
    }

    // Check against sustained rate limit
    if (currentRate >= this.config.maxRequestsPerSecond) {
      // Allow some burst above the rate limit up to burstSize
      if (currentCount < this.config.burstSize * 0.9) {
        this.addRequest(now);
        return { allowed: true, currentRate, maxRate: this.config.maxRequestsPerSecond };
      }
      
      this.metrics.rejectedRequests++;
      return { 
        allowed: false, 
        currentRate,
        maxRate: this.config.maxRequestsPerSecond,
      };
    }

    // Request allowed
    this.addRequest(now);
    return { allowed: true, currentRate, maxRate: this.config.maxRequestsPerSecond };
  }

  /**
   * Add a request to the current time slot
   */
  private addRequest(timestamp: number): void {
    const slotIndex = this.slots.findIndex(
      slot => Math.abs(slot.timestamp - timestamp) < 100 // Group within 100ms
    );

    if (slotIndex >= 0) {
      this.slots[slotIndex].count++;
    } else {
      this.slots.push({ timestamp, count: 1 });
    }
  }

  /**
   * Get current system load percentage
   */
  getSystemLoad(): { 
    loadPercentage: number; 
    status: 'healthy' | 'moderate' | 'high' | 'critical';
    metrics: GlobalMetrics;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const currentCount = this.slots
      .filter(slot => slot.timestamp >= windowStart)
      .reduce((sum, slot) => sum + slot.count, 0);
    
    const currentRate = Math.round(currentCount * (1000 / this.config.windowMs));
    const loadPercentage = Math.round((currentRate / this.config.maxRequestsPerSecond) * 100);
    
    let status: 'healthy' | 'moderate' | 'high' | 'critical';
    if (loadPercentage < 50) {
      status = 'healthy';
    } else if (loadPercentage < 75) {
      status = 'moderate';
    } else if (loadPercentage < 90) {
      status = 'high';
    } else {
      status = 'critical';
    }

    return { loadPercentage, status, metrics: { ...this.metrics } };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(config: Partial<GlobalRateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup old time slots
   */
  private cleanup(): void {
    const cutoff = Date.now() - (this.config.windowMs * 2);
    this.slots = this.slots.filter(slot => slot.timestamp >= cutoff);
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.metrics.lastMinuteRequests = this.slots
      .filter(slot => slot.timestamp >= oneMinuteAgo)
      .reduce((sum, slot) => sum + slot.count, 0);
  }

  /**
   * Reset all metrics and state
   */
  reset(): void {
    this.slots = [];
    this.metrics = {
      totalRequests: 0,
      rejectedRequests: 0,
      lastMinuteRequests: 0,
      peakRequestsPerSecond: 0,
    };
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.slots = [];
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

/** Per-client rate limiter (IP-based) */
const rateLimiter = new RateLimiter();

/** Global rate limiter (system-wide capacity) */
const globalRateLimiter = new GlobalRateLimiter({
  maxRequestsPerSecond: 5000,   // 5000 requests/second system-wide
  burstSize: 10000,             // Allow bursts up to 10000
  windowMs: 1000,               // 1 second window
  enabled: true,
});

// ============================================================================
// CONFIGURATIONS & PRESETS
// ============================================================================

/**
 * Per-client rate limiting configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for authentication endpoints (login, signup submit)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },
  
  // Relaxed limits for validation endpoints (email check, field validation)
  validation: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute
    message: 'Too many validation requests. Please slow down.',
  },
  
  // Moderate limits for API endpoints
  api: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Relaxed limits for read-only endpoints
  readOnly: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Very strict for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,           // 3 requests per hour
    message: 'Too many attempts for sensitive operation. Please try again later.',
  },
} as const;

/**
 * Global rate limit presets for different environments
 */
export const GLOBAL_RATE_LIMIT_PRESETS = {
  development: {
    maxRequestsPerSecond: 1000,
    burstSize: 2000,
    windowMs: 1000,
    enabled: true,
  },
  production: {
    maxRequestsPerSecond: 5000,
    burstSize: 10000,
    windowMs: 1000,
    enabled: true,
  },
  highCapacity: {
    maxRequestsPerSecond: 10000,
    burstSize: 20000,
    windowMs: 1000,
    enabled: true,
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  rateLimiter, 
  RateLimiter, 
  globalRateLimiter, 
  GlobalRateLimiter 
};
