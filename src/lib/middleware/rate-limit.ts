/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Usage in API routes:
 * 
 * import { withRateLimit } from '@/lib/middleware/rate-limit';
 * 
 * export const GET = withRateLimit(
 *   async (req: Request) => {
 *     // Your handler logic
 *   },
 *   'api' // or 'auth', 'readOnly', 'sensitive'
 * );
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMIT_CONFIGS, RateLimitConfig } from '@/lib/utils/rate-limiter';

/**
 * Get client identifier (IP address or fallback)
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier (not ideal for production)
  return 'unknown-client';
}

/**
 * Rate limit middleware wrapper for Next.js API routes
 */
export function withRateLimit<T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(
  handler: T,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'api',
  customConfig?: RateLimitConfig
): T {
  return (async (req: NextRequest, ...args: unknown[]) => {
    const config = customConfig || RATE_LIMIT_CONFIGS[configKey];
    const clientId = getClientIdentifier(req);
    const path = req.nextUrl.pathname;
    
    // Create unique key combining client IP and endpoint
    const rateLimitKey = `${clientId}:${path}`;
    
    // Check rate limit
    const { allowed, resetTime, remaining } = rateLimiter.check(rateLimitKey, config);
    
    // Add rate limit headers to response
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      headers.set('Retry-After', retryAfter.toString());
      
      console.warn(`[Rate Limit] Blocked request from ${clientId} to ${path}`);
      
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }
    
    // Execute handler
    const response = await handler(req, ...args);
    
    // Add rate limit headers to successful response
    const newResponse = new Response(response.body, response);
    headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  }) as T;
}

/**
 * Custom rate limiter for specific use cases
 */
export function createRateLimiter(config: RateLimitConfig) {
  return <T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(handler: T): T => {
    return withRateLimit(handler, 'api', config);
  };
}

/**
 * Pre-configured rate limiters for common scenarios
 */
export const rateLimiters = {
  /** Strict rate limiting for login/signup (5 requests per 15 minutes) */
  auth: <T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(handler: T) => 
    withRateLimit(handler, 'auth'),
  
  /** Moderate rate limiting for general API (60 requests per minute) */
  api: <T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(handler: T) => 
    withRateLimit(handler, 'api'),
  
  /** Relaxed rate limiting for read operations (100 requests per minute) */
  readOnly: <T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(handler: T) => 
    withRateLimit(handler, 'readOnly'),
  
  /** Very strict for sensitive operations (3 requests per hour) */
  sensitive: <T extends (req: NextRequest, ...args: unknown[]) => Promise<Response>>(handler: T) => 
    withRateLimit(handler, 'sensitive'),
};
