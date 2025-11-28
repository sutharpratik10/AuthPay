/**
 * Rate Limiting Middleware for Next.js API Routes
 * 
 * Comprehensive protection with:
 * - Per-IP rate limiting (prevents individual abuse)
 * - Global rate limiting (protects system capacity for 10,000+ users)
 * - Request queuing with graceful degradation
 * - Response caching (reduces load)
 * - Circuit breaker (prevents cascade failures)
 * 
 * @example Basic usage
 * ```ts
 * import { rateLimiters } from '@/lib/middleware/rate-limit';
 * 
 * export const GET = rateLimiters.api(async (req) => {
 *   return NextResponse.json({ data });
 * });
 * ```
 * 
 * @example Advanced usage with all features
 * ```ts
 * import { rateLimiters } from '@/lib/middleware/rate-limit';
 * 
 * export const GET = rateLimiters.withCache(async (req) => {
 *   return NextResponse.json({ data });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  rateLimiter, 
  globalRateLimiter, 
  RATE_LIMIT_CONFIGS, 
  RateLimitConfig 
} from '@/lib/utils/rate-limiter';
import { requestQueue } from '@/lib/utils/request-queue';
import { responseCache, generateCacheKey, CACHE_TTL } from '@/lib/utils/response-cache';
import { 
  circuitBreakerRegistry, 
  CircuitBreakerError, 
  CIRCUIT_BREAKER_CONFIGS 
} from '@/lib/utils/circuit-breaker';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitOptions extends Partial<RateLimitConfig> {
  /** Enable global rate limiting (default: true) */
  enableGlobalLimit?: boolean;
  /** Enable request queuing under load (default: false for basic, true for advanced) */
  enableQueuing?: boolean;
  /** Enable response caching (default: false) */
  enableCaching?: boolean;
  /** Cache TTL in ms */
  cacheTtlMs?: number;
  /** Cache tags for invalidation */
  cacheTags?: string[];
  /** Enable circuit breaker (default: false) */
  enableCircuitBreaker?: boolean;
  /** Circuit breaker name */
  circuitBreakerName?: string;
  /** Priority level for queuing */
  priority?: 'high' | 'normal' | 'low';
}

type RouteHandler = (req: NextRequest, ...args: unknown[]) => Promise<Response>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client identifier (IP address or fallback)
 */
function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  
  return 'unknown-client';
}

/**
 * Get user ID from request (if authenticated)
 */
function getUserId(req: NextRequest): string | null {
  const userId = req.headers.get('x-user-id');
  if (userId) return userId;
  
  const sessionToken = req.cookies.get('next-auth.session-token')?.value;
  if (sessionToken) return `session:${sessionToken.substring(0, 8)}`;
  
  return null;
}

/**
 * Determine request priority based on authentication and endpoint
 */
function getRequestPriority(req: NextRequest): 'high' | 'normal' | 'low' {
  const userId = getUserId(req);
  const path = req.nextUrl.pathname;
  
  if (userId) return 'high';
  if (path.includes('/health') || path.includes('/api/auth')) return 'high';
  if (req.method === 'GET' && !path.includes('/api/user')) return 'low';
  
  return 'normal';
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function createRateLimitResponse(
  config: RateLimitConfig,
  resetTime: number,
  headers: Headers
): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  headers.set('Retry-After', retryAfter.toString());
  
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: config.message || 'Rate limit exceeded. Please try again later.',
      retryAfter,
    },
    { status: 429, headers }
  );
}

function createOverloadResponse(currentRate: number, maxRate: number): Response {
  return NextResponse.json(
    {
      error: 'Service Overloaded',
      message: 'System is currently experiencing high load. Please try again shortly.',
      currentLoad: `${Math.round((currentRate / maxRate) * 100)}%`,
    },
    {
      status: 503,
      headers: {
        'Retry-After': '5',
        'X-System-Load': `${Math.round((currentRate / maxRate) * 100)}%`,
      },
    }
  );
}

function createDegradedResponse(): Response {
  return NextResponse.json(
    {
      error: 'Service Degraded',
      message: 'Returning limited functionality due to high load.',
      degraded: true,
    },
    {
      status: 503,
      headers: { 'X-Degraded-Mode': 'true', 'Retry-After': '10' },
    }
  );
}

function createCircuitBreakerResponse(retryAfterMs: number): Response {
  return NextResponse.json(
    {
      error: 'Service Temporarily Unavailable',
      message: 'The service is experiencing issues. Please try again later.',
      retryAfter: Math.ceil(retryAfterMs / 1000),
    },
    {
      status: 503,
      headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() },
    }
  );
}

function createCachedResponse(cachedResponse: Response, isStale: boolean): Response {
  const response = cachedResponse.clone();
  response.headers.set('X-Cache', isStale ? 'STALE' : 'HIT');
  return response;
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

/**
 * Rate limit middleware wrapper for Next.js API routes
 */
export function withRateLimit<T extends RouteHandler>(
  handler: T,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'api',
  options: RateLimitOptions = {}
): T {
  // Merge configuration
  const baseConfig = RATE_LIMIT_CONFIGS[configKey];
  const config: RateLimitConfig & RateLimitOptions = {
    ...baseConfig,
    enableGlobalLimit: options.enableGlobalLimit ?? false,
    enableQueuing: options.enableQueuing ?? false,
    enableCaching: options.enableCaching ?? false,
    cacheTtlMs: options.cacheTtlMs ?? CACHE_TTL.api,
    cacheTags: options.cacheTags ?? [],
    enableCircuitBreaker: options.enableCircuitBreaker ?? false,
    circuitBreakerName: options.circuitBreakerName,
    priority: options.priority,
    ...options,
  };

  return (async (req: NextRequest, ...args: unknown[]) => {
    const clientId = getClientIdentifier(req);
    const path = req.nextUrl.pathname;
    const method = req.method;

    // ===== STEP 1: Global Rate Limit (system capacity) =====
    if (config.enableGlobalLimit) {
      const globalCheck = globalRateLimiter.check();
      
      if (!globalCheck.allowed) {
        console.warn(`[Global Rate Limit] System at capacity: ${globalCheck.currentRate}/s`);
        
        if (config.enableQueuing) {
          const priority = config.priority || getRequestPriority(req);
          const queueResult = await requestQueue.enqueue(priority, { 
            userId: getUserId(req) || undefined, 
            path, 
            method 
          });
          
          if (queueResult.status === 'rejected') {
            return createOverloadResponse(globalCheck.currentRate, globalCheck.maxRate);
          }
          
          if (queueResult.status === 'degraded') {
            if (method === 'GET' && config.enableCaching) {
              const cacheKey = generateCacheKey(path, Object.fromEntries(req.nextUrl.searchParams), getUserId(req) || undefined);
              const cached = responseCache.get(cacheKey);
              if (cached) return createCachedResponse(cached.value as Response, true);
            }
            return createDegradedResponse();
          }
        } else {
          return createOverloadResponse(globalCheck.currentRate, globalCheck.maxRate);
        }
      }
    }

    // ===== STEP 2: Per-IP Rate Limit =====
    const rateLimitKey = `${clientId}:${path}`;
    const { allowed, resetTime, remaining } = rateLimiter.check(rateLimitKey, config);

    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (!allowed) {
      console.warn(`[Rate Limit] Blocked: ${clientId} -> ${path}`);
      return createRateLimitResponse(config, resetTime, headers);
    }

    // ===== STEP 3: Check Cache =====
    if (method === 'GET' && config.enableCaching) {
      const cacheKey = generateCacheKey(path, Object.fromEntries(req.nextUrl.searchParams), getUserId(req) || undefined);
      const cached = responseCache.get(cacheKey);
      if (cached && !cached.isStale) {
        return createCachedResponse(cached.value as Response, false);
      }
    }

    // ===== STEP 4: Execute Handler (with optional circuit breaker) =====
    let response: Response;
    
    try {
      if (config.enableCircuitBreaker && config.circuitBreakerName) {
        const breaker = circuitBreakerRegistry.getOrCreate({
          ...CIRCUIT_BREAKER_CONFIGS.externalApi,
          name: config.circuitBreakerName,
        });
        response = await breaker.execute(() => handler(req, ...args));
      } else {
        response = await handler(req, ...args);
      }
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        return createCircuitBreakerResponse(error.retryAfterMs);
      }
      throw error;
    }

    // ===== STEP 5: Cache Response =====
    if (method === 'GET' && config.enableCaching && response.ok) {
      const cacheKey = generateCacheKey(path, Object.fromEntries(req.nextUrl.searchParams), getUserId(req) || undefined);
      responseCache.set(cacheKey, response.clone(), {
        ttlMs: config.cacheTtlMs,
        tags: config.cacheTags,
      });
    }

    // Add rate limit headers to response
    const newResponse = new Response(response.body, response);
    headers.forEach((value, key) => newResponse.headers.set(key, value));

    if (config.enableQueuing) requestQueue.complete();

    return newResponse;
  }) as T;
}

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: RateLimitOptions) {
  return <T extends RouteHandler>(handler: T): T => {
    return withRateLimit(handler, 'api', options);
  };
}

// ============================================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================================

export const rateLimiters = {
  // ----- BASIC (Per-IP only) -----
  
  /** Auth endpoints: 5 requests per 15 minutes */
  auth: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'auth'),
  
  /** Validation endpoints: 30 requests per minute */
  validation: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'validation'),
  
  /** General API: 60 requests per minute */
  api: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'api'),
  
  /** Read-only: 100 requests per minute */
  readOnly: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'readOnly'),
  
  /** Sensitive operations: 3 requests per hour */
  sensitive: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'sensitive'),

  // ----- ADVANCED (All features) -----
  
  /** API with global limiting + queuing */
  withGlobalLimit: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'api', {
      enableGlobalLimit: true,
      enableQueuing: true,
    }),
  
  /** API with caching */
  withCache: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'api', {
      enableGlobalLimit: true,
      enableQueuing: true,
      enableCaching: true,
      cacheTtlMs: CACHE_TTL.api,
    }),
  
  /** Read-only with aggressive caching */
  withAggressiveCache: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'readOnly', {
      enableGlobalLimit: true,
      enableQueuing: true,
      enableCaching: true,
      cacheTtlMs: CACHE_TTL.list,
      priority: 'low',
    }),
  
  /** With circuit breaker for external services */
  withCircuitBreaker: (circuitName: string) => 
    <T extends RouteHandler>(handler: T) => 
      withRateLimit(handler, 'api', {
        enableGlobalLimit: true,
        enableQueuing: true,
        enableCircuitBreaker: true,
        circuitBreakerName: circuitName,
      }),
  
  /** Database-heavy operations */
  database: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'api', {
      enableGlobalLimit: true,
      enableQueuing: true,
      enableCaching: true,
      cacheTtlMs: CACHE_TTL.list,
      enableCircuitBreaker: true,
      circuitBreakerName: 'database',
    }),

  /** Full protection: all features enabled */
  full: <T extends RouteHandler>(handler: T) => 
    withRateLimit(handler, 'api', {
      enableGlobalLimit: true,
      enableQueuing: true,
      enableCaching: true,
      cacheTtlMs: CACHE_TTL.api,
      enableCircuitBreaker: true,
      circuitBreakerName: 'default',
    }),
};

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

/**
 * Get system health status for monitoring
 */
export function getSystemHealth() {
  const globalLoad = globalRateLimiter.getSystemLoad();
  const queueMetrics = requestQueue.getMetrics();
  const cacheStats = responseCache.getStats();
  const circuitBreakers = circuitBreakerRegistry.getHealthStatus();

  return {
    status: globalLoad.status,
    globalRateLimit: {
      loadPercentage: globalLoad.loadPercentage,
      status: globalLoad.status,
      metrics: globalLoad.metrics,
    },
    requestQueue: queueMetrics,
    cache: cacheStats,
    circuitBreakers,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  globalRateLimiter, 
  requestQueue, 
  responseCache, 
  circuitBreakerRegistry,
  CACHE_TTL,
};
