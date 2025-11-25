/**
 * Rate Limiter Utility
 * 
 * Implements in-memory rate limiting to protect against DDoS and abuse
 * Uses token bucket algorithm for smooth rate limiting
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in the window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

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
   * Check if request should be rate limited
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

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting configurations for different endpoint types
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

export { rateLimiter, RateLimiter };
export type { RateLimitConfig };
