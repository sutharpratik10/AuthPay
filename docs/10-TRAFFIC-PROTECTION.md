# Advanced Traffic Protection System

This document describes the advanced traffic protection system that handles high-volume legitimate traffic (10,000+ concurrent users) while protecting against abuse.

## Overview

The system consists of four integrated protection mechanisms:

| Component | Purpose | When It Activates |
|-----------|---------|-------------------|
| **Global Rate Limiter** | Protects total system capacity | System load > 10M req/sec |
| **Request Queue** | Graceful degradation under load | Queue when load > 70% |
| **Response Cache** | Reduces database/compute load | GET requests with caching enabled |
| **Circuit Breaker** | Prevents cascade failures | Service failure threshold exceeded |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Incoming Request                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     1. Global Rate Limiter                          │
│   ┌─────────────┐                                                   │
│   │ 10M req/s   │  System capacity check (all users combined)       │
│   │ burst: 15M  │  ──▶ If exceeded, queue or reject                │
│   └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     2. Per-IP Rate Limiter                          │
│   ┌─────────────┐                                                   │
│   │ 60 req/min  │  Per-client limiting (IP-based)                   │
│   │ per IP      │  ──▶ If exceeded, return 429                      │
│   └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     3. Response Cache                               │
│   ┌─────────────┐                                                   │
│   │ LRU Cache   │  Check cache for GET requests                     │
│   │ 10k entries │  ──▶ If hit, return cached response              │
│   └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     4. Circuit Breaker                              │
│   ┌─────────────┐                                                   │
│   │ CLOSED      │  Service health check                             │
│   │ HALF-OPEN   │  ──▶ If OPEN, return 503                         │
│   │ OPEN        │                                                   │
│   └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Route Handler                                │
│                   (Your business logic)                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Global Rate Limiter

**File:** `src/lib/utils/rate-limiter.ts`

Protects total system capacity regardless of IP address. When 10,000+ legitimate users hit the system simultaneously, this prevents system overload by limiting total throughput. Both per-client (`RateLimiter`) and global (`GlobalRateLimiter`) rate limiters are in the same file.

### Configuration

```typescript
import { GlobalTokenBucketLimiter } from '@/lib/utils/rate-limiter';

// Default configuration (hyperscale production)
const globalLimiter = new GlobalTokenBucketLimiter({
  maxRequestsPerSecond: 10_000_000,   // 10 million requests/second
  burstSize: 15_000_000,              // Allow bursts up to 15 million
  enabled: true,
});
```

### Usage

```typescript
// Check system capacity
const { allowed, currentRate, maxRate } = globalLimiter.check();

if (!allowed) {
  // System at capacity - queue or reject
}

// Get system load
const { loadPercentage, status, metrics } = globalRateLimiter.getSystemLoad();
// status: 'healthy' | 'moderate' | 'high' | 'critical'
```

---

## 2. Request Queue

**File:** `src/lib/utils/request-queue.ts`

Instead of immediately rejecting requests during high traffic, this queue allows requests to wait in line with configurable timeouts and graceful degradation.

### Features

- **Priority queuing**: Authenticated users get priority
- **Timeout handling**: Requests timeout after 30s (configurable)
- **Graceful degradation**: Return cached/degraded responses when overwhelmed
- **Load shedding**: Reject when queue is full (10,000 max)

### Configuration

```typescript
import { requestQueue, QUEUE_PRESETS } from '@/lib/utils/request-queue';

// Default configuration
{
  maxQueueSize: 10000,      // Maximum queue size
  maxWaitTimeMs: 30000,     // 30 second timeout
  concurrency: 100,         // Process 100 concurrent requests
  enablePriority: true,     // Priority queuing
  enableDegradation: true,  // Return degraded responses
}

// Apply preset
requestQueue.updateConfig(QUEUE_PRESETS.highThroughput);
```

### Usage

```typescript
// Enqueue a request with priority
const result = await requestQueue.enqueue('high', {
  userId: 'user123',
  path: '/api/data',
  method: 'GET',
});

// Handle result
switch (result.status) {
  case 'processed':
    // Continue with request
    break;
  case 'timeout':
    // Request waited too long
    break;
  case 'degraded':
    // Return cached/degraded response
    break;
  case 'rejected':
    // Queue full
    break;
}
```

---

## 3. Response Cache

**File:** `src/lib/utils/response-cache.ts`

Reduces database/compute load by caching frequently accessed data with LRU eviction and TTL expiration.

### Features

- **LRU eviction**: Least recently used entries removed when full
- **TTL expiration**: Automatic cache invalidation
- **Stale-while-revalidate**: Serve stale content while refreshing
- **Tag-based invalidation**: Invalidate related entries together

### Configuration

```typescript
import { responseCache, CACHE_TTL, CACHE_PRESETS } from '@/lib/utils/response-cache';

// TTL presets
CACHE_TTL.static       // 1 hour   - Static data
CACHE_TTL.userProfile  // 5 min    - User profile
CACHE_TTL.list         // 2 min    - Lists/collections
CACHE_TTL.realtime     // 30 sec   - Real-time data
CACHE_TTL.config       // 15 min   - Configuration
CACHE_TTL.api          // 1 min    - API responses
```

### Usage

```typescript
import { responseCache, generateCacheKey } from '@/lib/utils/response-cache';

// Generate cache key
const cacheKey = generateCacheKey('/api/users', { page: 1 }, 'user123');

// Cache-aside pattern
const data = await responseCache.getOrSet(
  cacheKey,
  async () => {
    return await fetchFromDatabase();
  },
  { ttlMs: 60000, tags: ['users'] }
);

// Invalidate by tag (e.g., when user data changes)
responseCache.invalidateByTag('users');

// Invalidate by prefix
responseCache.invalidateByPrefix('/api/users');
```

---

## 4. Circuit Breaker

**File:** `src/lib/utils/circuit-breaker.ts`

Prevents cascade failures when downstream services are overwhelmed. When a service starts failing, the circuit breaker "trips" and immediately returns errors without hitting the failing service.

### States

| State | Description |
|-------|-------------|
| **CLOSED** | Normal operation, requests pass through |
| **OPEN** | Service failing, requests immediately rejected |
| **HALF-OPEN** | Testing if service has recovered |

### Configuration

```typescript
import { circuitBreakerRegistry, CIRCUIT_BREAKER_CONFIGS } from '@/lib/utils/circuit-breaker';

// Pre-configured circuit breakers
CIRCUIT_BREAKER_CONFIGS.database      // Database operations
CIRCUIT_BREAKER_CONFIGS.externalApi   // External API calls
CIRCUIT_BREAKER_CONFIGS.paymentGateway // Payment processing
CIRCUIT_BREAKER_CONFIGS.emailService   // Email sending
CIRCUIT_BREAKER_CONFIGS.cache          // Redis/cache

// Custom configuration
{
  name: 'myService',
  failureThreshold: 5,      // Open after 5 failures
  resetTimeoutMs: 30000,    // Try again after 30s
  successThreshold: 3,      // Close after 3 successes
  failureWindowMs: 60000,   // Count failures in 1 minute
  requestTimeoutMs: 5000,   // Timeout per request
}
```

### Usage

```typescript
import { circuitBreakerRegistry, withCircuitBreaker } from '@/lib/utils/circuit-breaker';

// Get or create circuit breaker
const breaker = circuitBreakerRegistry.getOrCreate({
  name: 'externalApi',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  successThreshold: 2,
  failureWindowMs: 60000,
});

// Execute with protection
try {
  const result = await breaker.execute(async () => {
    return await callExternalApi();
  });
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    // Service unavailable, retry after error.retryAfterMs
  }
}

// Wrap a function with circuit breaker
const protectedFn = withCircuitBreaker(myAsyncFn, {
  name: 'myService',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 3,
  failureWindowMs: 60000,
});
```

---

## Unified Rate Limit Middleware

**File:** `src/lib/middleware/rate-limit.ts`

Integrates all protection mechanisms into a single middleware.

### Usage in Routes

```typescript
import { rateLimiters } from '@/lib/middleware/rate-limit';

// Authentication endpoint (high priority, no caching)
export const POST = rateLimiters.auth(async (req) => {
  // Login logic
});

// API endpoint with caching
export const GET = rateLimiters.api(async (req) => {
  // API logic
});

// Read-only endpoint (aggressive caching, low priority)
export const GET = rateLimiters.readOnly(async (req) => {
  // Read logic
});

// Sensitive operation (circuit breaker enabled)
export const POST = rateLimiters.sensitive(async (req) => {
  // Sensitive operation
});

// Endpoint with global limit
export const GET = rateLimiters.withGlobalLimit(async (req) => {
  // Global limit protection
});

// Endpoint with caching
export const GET = rateLimiters.withCache(async (req) => {
  // Cached response
});

// Database-heavy operation
export const GET = rateLimiters.database(async (req) => {
  // Database query
});

// Full protection (all features enabled)
export const GET = rateLimiters.full(async (req) => {
  // Fully protected endpoint
});
```

### Custom Configuration

```typescript
import { createAdvancedRateLimiter } from '@/lib/middleware/rate-limit';

const customLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  enableGlobalLimit: true,
  enableQueuing: true,
  enableCaching: true,
  cacheTtlMs: 120000,
  cacheTags: ['products'],
  enableCircuitBreaker: true,
  circuitBreakerName: 'productService',
  priority: 'normal',
});

export const GET = customLimiter(async (req) => {
  // Handler logic
});
```

---

## System Health Endpoint

**Route:** `GET /api/health/system`

Returns the current status of all protection mechanisms.

### Response Example

```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T10:30:00.000Z",
  "globalRateLimit": {
    "status": "healthy",
    "loadPercentage": 23,
    "totalRequests": 150000,
    "rejectedRequests": 12,
    "peakRequestsPerSecond": 3200
  },
  "requestQueue": {
    "currentSize": 45,
    "totalQueued": 5000,
    "totalProcessed": 4950,
    "totalTimedOut": 3,
    "totalRejected": 2,
    "averageWaitTimeMs": 120
  },
  "cache": {
    "size": 8500,
    "hitRate": 78,
    "hits": 95000,
    "misses": 27000,
    "evictions": 1500,
    "staleHits": 3200
  },
  "circuitBreakers": [
    {
      "name": "database",
      "state": "CLOSED",
      "failureRate": 2,
      "totalRequests": 50000,
      "rejectedRequests": 0
    },
    {
      "name": "externalApi",
      "state": "HALF_OPEN",
      "failureRate": 15,
      "totalRequests": 10000,
      "rejectedRequests": 500
    }
  ]
}
```

---

## Best Practices

### 1. For High-Traffic Scenarios (10,000+ users)

```typescript
// Configure for high capacity
globalRateLimiter.updateConfig({
  maxRequestsPerSecond: 10000,
  burstSize: 20000,
});

requestQueue.updateConfig({
  maxQueueSize: 50000,
  concurrency: 500,
});

responseCache.updateConfig({
  maxSize: 50000,
  defaultTtlMs: 5 * 60 * 1000,
});
```

### 2. Cache Aggressively for Read-Heavy Workloads

```typescript
export const GET = rateLimiters.readOnly(async (req) => {
  // Cached for 2 minutes, stale content served while refreshing
});
```

### 3. Use Circuit Breakers for External Dependencies

```typescript
const externalApiBreaker = circuitBreakerRegistry.getOrCreate({
  name: 'thirdPartyApi',
  failureThreshold: 3,
  resetTimeoutMs: 60000,
});

// All calls to the external API go through the breaker
await externalApiBreaker.execute(() => callThirdPartyApi());
```

### 4. Monitor System Health

```typescript
// Poll health endpoint periodically
const health = await fetch('/api/health/system');
const data = await health.json();

if (data.status === 'critical') {
  // Alert ops team
  // Scale up infrastructure
}
```

---

## Scaling Considerations

For production at scale:

1. **Redis Integration**: Replace in-memory stores with Redis for distributed rate limiting
2. **CDN Layer**: Add Cloudflare/AWS CloudFront for edge caching and DDoS protection
3. **Auto-scaling**: Configure Kubernetes/ECS to scale based on queue size and load percentage
4. **Monitoring**: Integrate with Prometheus/Grafana for real-time monitoring
5. **Load Balancing**: Use multiple instances behind a load balancer

---

## Files Created

| File | Description |
|------|-------------|
| `src/lib/utils/rate-limiter.ts` | Per-client + Global rate limiting |
| `src/lib/utils/request-queue.ts` | Request queuing with degradation |
| `src/lib/utils/response-cache.ts` | Response caching layer |
| `src/lib/utils/circuit-breaker.ts` | Circuit breaker pattern |
| `src/lib/middleware/rate-limit.ts` | Unified middleware (all features) |
| `src/app/api/health/system/route.ts` | Health monitoring endpoint |
