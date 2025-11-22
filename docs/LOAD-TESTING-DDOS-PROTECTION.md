# Load Testing & DDoS Protection Guide

## Overview

This guide explains how to test your AuthPay application against high-traffic scenarios and implement protection against DDoS attacks.

## ⚠️ Important Disclaimer

**This is for testing your own application only**. Never perform load tests on:
- Production environments without proper preparation
- Third-party services
- Systems you don't own or have permission to test

## Load Testing Tool

### Installation

The load testing tool is already installed as part of dev dependencies:
- `autocannon` - HTTP benchmarking tool
- `chalk` - Colored console output

### Running Load Tests

```bash
# Light load test (10 connections, 10 seconds)
node scripts/load-test.js low

# Medium load test (50 connections, 30 seconds)
node scripts/load-test.js medium

# High load test (100 connections, 60 seconds)
node scripts/load-test.js high

# Extreme load test - DDoS simulation (500 connections, 120 seconds)
node scripts/load-test.js extreme
```

### Test Intensity Levels

| Level    | Connections | Duration | Pipelining | Description                          |
|----------|-------------|----------|------------|--------------------------------------|
| `low`    | 10          | 10s      | 1          | Normal traffic simulation            |
| `medium` | 50          | 30s      | 5          | Busy period simulation               |
| `high`   | 100         | 60s      | 10         | Peak traffic simulation              |
| `extreme`| 500         | 120s     | 20         | DDoS-like scenario (stress test)     |

### Tested API Routes

The load test script automatically tests these critical routes:
- `/api/auth/check-email`
- `/api/user/admin-status`
- `/api/user/subscription-status`
- `/api/subscription-plans`
- `/api/rbac/check-permission`
- `/api/auth/check-suspension`
- `/api/user/data`

### Understanding Results

The test will show:
- **Requests per second (RPS)**: How many requests the server can handle
- **Latency metrics**:
  - `avg`: Average response time
  - `p50`: 50% of requests completed within this time
  - `p95`: 95% of requests completed within this time (important!)
  - `p99`: 99% of requests completed within this time
- **Errors**: Failed requests
- **Timeouts**: Requests that took too long
- **Non-2xx**: Requests with error status codes

### What to Look For

✅ **Good Signs**:
- No errors or timeouts
- P95 latency under 500ms
- Consistent RPS throughout the test
- No 429 (Too Many Requests) errors

⚠️ **Warning Signs**:
- Increasing latency over time (memory leak?)
- Errors or timeouts appearing
- Server crashes or becomes unresponsive
- High CPU or memory usage

## Rate Limiting Implementation

### How It Works

The rate limiter uses a **token bucket algorithm** with in-memory storage:
- Each client (identified by IP) has a "bucket" of tokens
- Each request consumes one token
- Tokens regenerate over time
- When bucket is empty, requests are blocked

### Rate Limit Configurations

Located in `src/lib/utils/rate-limiter.ts`:

```typescript
// Strict - for login/signup
auth: {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // 5 requests
}

// Moderate - for general API
api: {
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 60,            // 60 requests
}

// Relaxed - for read-only
readOnly: {
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 100,           // 100 requests
}

// Very strict - for sensitive ops
sensitive: {
  windowMs: 60 * 60 * 1000,   // 1 hour
  maxRequests: 3,             // 3 requests
}
```

### Applying Rate Limiting to Routes

#### Method 1: Using Pre-configured Limiters

```typescript
// src/app/api/auth/login/route.ts
import { rateLimiters } from '@/lib/middleware/rate-limit';

export const POST = rateLimiters.auth(async (req: Request) => {
  // Your login logic here
  return NextResponse.json({ success: true });
});
```

#### Method 2: Custom Configuration

```typescript
import { createRateLimiter } from '@/lib/middleware/rate-limit';

const customLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 10,           // 10 requests
  message: 'Custom rate limit message',
});

export const POST = customLimiter(async (req: Request) => {
  // Your handler logic
  return NextResponse.json({ success: true });
});
```

### Rate Limit Headers

Responses include these headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: When the limit resets (ISO timestamp)
- `Retry-After`: Seconds to wait before retrying (when limited)

### Testing Rate Limits

```bash
# Test authentication rate limit (should block after 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/check-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo "\nRequest $i"
  sleep 1
done
```

## Implementing Additional Protection

### 1. Add to Critical Routes

Protect these routes first:
- [ ] `/api/auth/login`
- [ ] `/api/auth/register`
- [ ] `/api/auth/forgot-password`
- [ ] `/api/auth/reset-password`
- [ ] `/api/user/delete-account`
- [ ] `/api/payments/*`

### 2. Monitor Rate Limit Violations

Add logging to track abusive IPs:

```typescript
// In rate-limit middleware
if (!allowed) {
  console.warn(`[Rate Limit] Blocked ${clientId} on ${path}`);
  // TODO: Add to monitoring system
}
```

### 3. IP Blacklisting (Future Enhancement)

Create a blacklist for repeat offenders:

```typescript
const blacklistedIPs = new Set<string>();

function isBlacklisted(ip: string): boolean {
  return blacklistedIPs.has(ip);
}
```

### 4. CAPTCHA Integration (Future)

For authentication routes, add CAPTCHA after multiple failures:
- Google reCAPTCHA v3
- hCaptcha
- Cloudflare Turnstile

### 5. Production DDoS Protection

For production deployment, use these services:
- **Cloudflare** (Free tier available)
- **AWS Shield** (with CloudFront)
- **Fastly**
- **Akamai**

## Best Practices

### Before Testing

1. **Start with low intensity** and gradually increase
2. **Monitor system resources** (CPU, memory, network)
3. **Check logs** for errors during tests
4. **Use localhost** - never test production directly
5. **Close unnecessary applications** for accurate results

### During Testing

1. Watch for:
   - Server crashes
   - Memory leaks (increasing memory usage)
   - Database connection pool exhaustion
   - File descriptor limits
2. Monitor response times in real-time
3. Check if rate limiting activates correctly

### After Testing

1. Review all error logs
2. Identify bottlenecks (slow queries, CPU-intensive operations)
3. Optimize based on findings
4. Re-test after optimizations
5. Document acceptable load thresholds

## Troubleshooting

### Server Crashes During Test

**Cause**: Application can't handle the load

**Solutions**:
- Implement rate limiting
- Optimize slow database queries
- Add caching for frequent reads
- Increase server resources
- Enable connection pooling

### High Memory Usage

**Cause**: Memory leak or inefficient code

**Solutions**:
- Review code for memory leaks
- Implement request size limits
- Use streaming for large responses
- Enable garbage collection monitoring

### Database Errors

**Cause**: Connection pool exhausted

**Solutions**:
- Increase connection pool size
- Add query timeouts
- Implement query result caching
- Use read replicas for heavy read loads

### Rate Limiter Not Working

**Check**:
1. Is middleware applied to the route?
2. Is client IP detection working? (check headers)
3. Are rate limit configs correct?
4. Check console for rate limit logs

## Example: Complete Protected Route

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

async function handleLogin(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authentication logic here
    // ...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 5 requests per 15 minutes
export const POST = rateLimiters.auth(handleLogin);
```

## Metrics to Track

### Performance Metrics

- **Response Time**: Target < 200ms for APIs
- **Throughput**: Requests handled per second
- **Error Rate**: Should be < 0.1%
- **Availability**: Target 99.9% uptime

### Security Metrics

- **Rate Limit Triggers**: How often limits are hit
- **Blocked IPs**: Repeat offenders
- **Failed Auth Attempts**: Potential brute force
- **Unusual Traffic Patterns**: Potential DDoS

## Next Steps

1. ✅ Install load testing tools
2. ✅ Create rate limiting middleware
3. ⏳ Apply rate limits to critical routes
4. ⏳ Run load tests and analyze results
5. ⏳ Optimize based on findings
6. ⏳ Set up monitoring and alerting
7. ⏳ Plan for production DDoS protection

## Resources

- [Autocannon Documentation](https://github.com/mcollina/autocannon)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Cloudflare DDoS Protection](https://www.cloudflare.com/ddos/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
