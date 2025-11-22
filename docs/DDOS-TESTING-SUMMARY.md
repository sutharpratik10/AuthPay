# 🛡️ DDoS Protection & Load Testing Setup Complete

## What We've Implemented

### 1. ✅ Load Testing Tool (`scripts/load-test.js`)

A comprehensive load testing script that simulates high-traffic scenarios:

**Features:**
- 4 intensity levels (low, medium, high, extreme)
- Tests 7 critical API routes
- Detailed performance metrics (RPS, latency, errors)
- Colored console output for easy reading
- Progress tracking during tests

**Usage:**
```bash
# Start your dev server
npm run dev

# In another terminal, run load tests:
node scripts/load-test.js low      # Normal traffic
node scripts/load-test.js medium   # Busy period
node scripts/load-test.js high     # Peak traffic
node scripts/load-test.js extreme  # DDoS simulation
```

### 2. ✅ Rate Limiting System

**Components:**
- `src/lib/utils/rate-limiter.ts` - Core rate limiter with token bucket algorithm
- `src/lib/middleware/rate-limit.ts` - Next.js middleware for easy integration

**Pre-configured Limits:**
- **Auth routes**: 5 requests per 15 minutes (strict)
- **API routes**: 60 requests per minute (moderate)
- **Read-only**: 100 requests per minute (relaxed)
- **Sensitive ops**: 3 requests per hour (very strict)

### 3. ✅ Quick Test Script (`scripts/test-rate-limit.js`)

Test rate limiting on specific endpoints:

```bash
node scripts/test-rate-limit.js /api/subscription-plans 20
```

### 4. ✅ Comprehensive Documentation

- `docs/LOAD-TESTING-DDOS-PROTECTION.md` - Complete guide with examples

---

## 🚀 Quick Start Guide

### Step 1: Start Your Server

```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

### Step 2: Run Your First Load Test

Open a new terminal:

```bash
# Start with LOW intensity to see baseline performance
node scripts/load-test.js low
```

**Expected output:**
```
🔥 AuthPay Load Testing Tool

Intensity: LOW
Description: Light load - Normal traffic simulation
Target: http://localhost:3000
Connections: 10
Duration: 10s
Pipelining: 1

📊 Testing: /api/auth/check-email
✅ Completed: /api/auth/check-email
   Requests: 145 (14 req/sec)
   Latency: avg=68ms, p95=120ms
   Errors: 0, Timeouts: 0, Non-2xx: 0

[... more routes ...]

📈 LOAD TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Requests Sent: 1015
Average RPS: 98
Total Errors: 0
Total Timeouts: 0

✅ All tests passed! Application is resilient to this load level.
```

### Step 3: Analyze Results

**Good performance indicators:**
- ✅ No errors or timeouts
- ✅ P95 latency < 500ms
- ✅ Consistent RPS throughout test
- ✅ No server crashes

**Warning signs:**
- ⚠️ Errors > 0
- ⚠️ Timeouts increasing
- ⚠️ Latency growing over time
- ⚠️ Server becomes unresponsive

### Step 4: Gradually Increase Load

```bash
# After low passes, try medium
node scripts/load-test.js medium

# Then high
node scripts/load-test.js high

# Finally, simulate DDoS (extreme)
node scripts/load-test.js extreme
```

**What to watch for:**
- When does performance degrade?
- At what point do errors appear?
- Does the server recover after the test?

---

## 🔒 Implementing Rate Limiting

### Protect Authentication Routes

**Example: Login Route**

Create/Edit: `src/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

async function handleLogin(req: NextRequest) {
  const body = await req.json();
  // Your login logic here...
  return NextResponse.json({ success: true });
}

// Apply strict rate limiting (5 requests per 15 min)
export const POST = rateLimiters.auth(handleLogin);
```

### Protect API Routes

**Example: Subscription Status**

Edit: `src/app/api/user/subscription-status/route.ts`

```typescript
import { rateLimiters } from '@/lib/middleware/rate-limit';

async function handleSubscriptionStatus(req: Request) {
  // Your existing logic...
}

// Apply moderate rate limiting (60 requests per min)
export const GET = rateLimiters.api(handleSubscriptionStatus);
```

### Custom Rate Limits

For specific needs:

```typescript
import { createRateLimiter } from '@/lib/middleware/rate-limit';

const customLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 20,           // 20 requests
  message: 'Too many profile updates',
});

export const PUT = customLimit(handleProfileUpdate);
```

---

## 🧪 Testing Rate Limits

### Method 1: Quick Test Script

```bash
# Test if rate limiting is active
node scripts/test-rate-limit.js /api/subscription-plans 20
```

**Expected output (with rate limiting):**
```
✅ Request 1: SUCCESS (Remaining: 59)
✅ Request 2: SUCCESS (Remaining: 58)
...
✅ Request 60: SUCCESS (Remaining: 0)
⛔ Request 61: RATE LIMITED (Retry after: 45s)
⛔ Request 62: RATE LIMITED (Retry after: 44s)
```

### Method 2: Manual cURL Test

```bash
# Rapid fire requests to trigger rate limit
for i in {1..10}; do
  curl -i http://localhost:3000/api/subscription-plans
  echo "\n--- Request $i ---\n"
done
```

Look for:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
Retry-After: 42
```

---

## 📊 Understanding Test Results

### Metrics Explained

**RPS (Requests Per Second)**
- How many requests your server handles
- Higher is better
- Typical range: 50-500 for most apps

**Latency**
- Time to complete a request
- **avg**: Average response time
- **p50**: Median (50% faster than this)
- **p95**: 95th percentile (important!)
- **p99**: 99th percentile (worst case)

Target: p95 < 500ms

**Errors**
- Requests that failed
- Should be 0 in good conditions

**Timeouts**
- Requests that took too long
- Indicates server overload

### What Different Results Mean

**Scenario 1: All Green**
```
Requests: 1000
RPS: 100
Errors: 0
Timeouts: 0
P95: 250ms
```
✅ **Excellent!** Server handles this load easily.

**Scenario 2: Some Issues**
```
Requests: 1000
RPS: 85
Errors: 15
Timeouts: 5
P95: 850ms
```
⚠️ **Warning!** Server struggling. Consider:
- Optimizing slow queries
- Adding caching
- Implementing rate limiting

**Scenario 3: Server Overwhelmed**
```
Requests: 500
RPS: 20
Errors: 250
Timeouts: 100
P95: 5000ms
```
🚨 **Critical!** Immediate action needed:
- Reduce load
- Fix bottlenecks
- Add rate limiting
- Scale infrastructure

---

## 🎯 Recommended Action Plan

### Phase 1: Baseline Testing (Week 1)

- [ ] Run `low` intensity test
- [ ] Document baseline performance
- [ ] Identify slow routes
- [ ] Note any errors

### Phase 2: Protection (Week 1-2)

- [ ] Implement rate limiting on auth routes
- [ ] Apply to payment routes
- [ ] Protect user data endpoints
- [ ] Test rate limits are working

### Phase 3: Stress Testing (Week 2)

- [ ] Run `medium` intensity
- [ ] Run `high` intensity
- [ ] Identify breaking points
- [ ] Document maximum capacity

### Phase 4: Optimization (Week 3)

- [ ] Optimize slow database queries
- [ ] Add caching where appropriate
- [ ] Review and adjust rate limits
- [ ] Re-test after optimizations

### Phase 5: Extreme Testing (Week 4)

- [ ] Run `extreme` DDoS simulation
- [ ] Verify rate limiting holds
- [ ] Check server recovery
- [ ] Plan production DDoS protection

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to localhost:3000"

**Solution:**
```bash
# Make sure dev server is running
npm run dev
```

### Problem: "Test shows 0 errors but server crashed"

**Causes:**
- Memory leak
- Database connection exhaustion
- File descriptor limit

**Debug:**
```bash
# Watch memory usage during test
node --max-old-space-size=4096 scripts/load-test.js medium
```

### Problem: "Rate limiting not working"

**Check:**
1. Is middleware applied to route?
2. Restart dev server after changes
3. Check console for rate limit logs
4. Verify IP detection working

**Debug:**
```typescript
// Add logging to see what's happening
console.log('Client IP:', getClientIdentifier(req));
console.log('Rate limit result:', { allowed, remaining });
```

---

## 🌐 Production Deployment

### Before Going Live

1. **Choose a DDoS Protection Service:**
   - Cloudflare (Recommended - Free tier available)
   - AWS CloudFront + Shield
   - Fastly
   - Akamai

2. **Monitor These Metrics:**
   - Request rate per endpoint
   - Error rate
   - Response times (p50, p95, p99)
   - Rate limit triggers

3. **Set Up Alerts:**
   - Error rate > 1%
   - P95 latency > 1000ms
   - Rate limit triggers > 100/hour
   - Unusual traffic patterns

### Cloudflare Setup (Recommended)

1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable:
   - DDoS Protection (automatic)
   - Rate Limiting Rules
   - Bot Fight Mode
   - WAF (Web Application Firewall)

---

## 📚 Additional Resources

### Tools
- [Autocannon](https://github.com/mcollina/autocannon) - Load testing
- [k6](https://k6.io/) - Advanced load testing
- [Apache JMeter](https://jmeter.apache.org/) - GUI-based testing

### Security
- [OWASP DDoS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Cloudflare Learning Center](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/)

### Monitoring
- [Datadog](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)
- [Grafana](https://grafana.com/)

---

## ✅ Success Criteria

Your application is production-ready when:

- [ ] Handles 100+ RPS without errors
- [ ] P95 latency < 500ms under load
- [ ] Rate limiting active on all sensitive routes
- [ ] No crashes during extreme load test
- [ ] Server recovers after stress test
- [ ] Monitoring and alerting configured
- [ ] DDoS protection service enabled

---

## 🎓 What You Learned

1. **Load Testing**: How to simulate realistic traffic
2. **Rate Limiting**: Protecting against abuse
3. **Performance Metrics**: Understanding RPS, latency, errors
4. **Bottleneck Identification**: Finding weak points
5. **DDoS Protection**: Multi-layered defense strategy

---

## Need Help?

Check the detailed documentation:
- `docs/LOAD-TESTING-DDOS-PROTECTION.md`

Or run tests with verbose logging:
```bash
DEBUG=* node scripts/load-test.js low
```

---

**Remember:** These tests are for YOUR application on YOUR localhost only. Never perform unauthorized testing on production systems or third-party services.
