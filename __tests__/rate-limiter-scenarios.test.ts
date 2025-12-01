/**
 * Real-World Rate Limiting Scenario Tests
 * 
 * Tests that simulate actual traffic patterns with both
 * Global Rate Limiter (system capacity) and Client-Specific Rate Limiter
 * working together.
 */

import {
  EnterpriseRateLimiter,
  GlobalTokenBucketLimiter,
  RATE_LIMIT_CONFIGS_V2,
  RateLimitConfig,
  GlobalRateLimitConfig,
} from '../src/lib/utils/rate-limiter';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Simulates a request going through both global and client rate limiters
 */
async function simulateRequest(
  globalLimiter: GlobalTokenBucketLimiter,
  clientLimiter: EnterpriseRateLimiter,
  clientKey: string,
  clientConfig: RateLimitConfig
): Promise<{
  allowed: boolean;
  blockedBy: 'global' | 'client' | null;
  globalResult: ReturnType<GlobalTokenBucketLimiter['check']>;
  clientResult: Awaited<ReturnType<EnterpriseRateLimiter['check']>>;
}> {
  // First check global limit
  const globalResult = globalLimiter.check();
  
  if (!globalResult.allowed) {
    return {
      allowed: false,
      blockedBy: 'global',
      globalResult,
      clientResult: {
        allowed: false,
        remaining: 0,
        limit: clientConfig.maxRequests,
        resetTime: Date.now() + 1000,
        retryAfterSeconds: 1,
        penaltyLevel: 1,
        currentCount: 0,
      },
    };
  }

  // Then check client-specific limit
  const clientResult = await clientLimiter.check(clientKey, clientConfig);

  return {
    allowed: clientResult.allowed,
    blockedBy: clientResult.allowed ? null : 'client',
    globalResult,
    clientResult,
  };
}

/**
 * Simulate multiple clients making requests concurrently
 */
async function simulateConcurrentClients(
  globalLimiter: GlobalTokenBucketLimiter,
  clientLimiter: EnterpriseRateLimiter,
  clientCount: number,
  requestsPerClient: number,
  clientConfig: RateLimitConfig
): Promise<{
  totalRequests: number;
  allowedRequests: number;
  blockedByGlobal: number;
  blockedByClient: number;
  clientStats: Map<string, { allowed: number; blocked: number }>;
}> {
  const clientStats = new Map<string, { allowed: number; blocked: number }>();
  let allowedRequests = 0;
  let blockedByGlobal = 0;
  let blockedByClient = 0;

  const requests: Promise<void>[] = [];

  for (let clientId = 0; clientId < clientCount; clientId++) {
    const clientKey = `client-${clientId}`;
    clientStats.set(clientKey, { allowed: 0, blocked: 0 });

    for (let req = 0; req < requestsPerClient; req++) {
      requests.push(
        (async () => {
          const result = await simulateRequest(
            globalLimiter,
            clientLimiter,
            clientKey,
            clientConfig
          );

          const stats = clientStats.get(clientKey)!;
          if (result.allowed) {
            allowedRequests++;
            stats.allowed++;
          } else if (result.blockedBy === 'global') {
            blockedByGlobal++;
            stats.blocked++;
          } else {
            blockedByClient++;
            stats.blocked++;
          }
        })()
      );
    }
  }

  await Promise.all(requests);

  return {
    totalRequests: clientCount * requestsPerClient,
    allowedRequests,
    blockedByGlobal,
    blockedByClient,
    clientStats,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Global + Client Rate Limiting Scenarios', () => {
  let globalLimiter: GlobalTokenBucketLimiter;
  let clientLimiter: EnterpriseRateLimiter;

  beforeEach(() => {
    // Create fresh limiters for each test
    globalLimiter = new GlobalTokenBucketLimiter({
      maxRequestsPerSecond: 100, // Low for testing
      burstSize: 200,
      enabled: true,
    });
    clientLimiter = new EnterpriseRateLimiter();
  });

  afterEach(() => {
    clientLimiter.destroy();
  });

  describe('Scenario 1: Normal Traffic - All Requests Pass', () => {
    it('should allow all requests when within both limits', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 10 };
      
      // Single client, few requests
      const results = await simulateConcurrentClients(
        globalLimiter,
        clientLimiter,
        1,  // 1 client
        5,  // 5 requests
        config
      );

      expect(results.allowedRequests).toBe(5);
      expect(results.blockedByGlobal).toBe(0);
      expect(results.blockedByClient).toBe(0);
    });
  });

  describe('Scenario 2: Single Client Exceeds Limit', () => {
    it('should block single client after exceeding client limit', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };
      const clientKey = 'test-client-sequential';
      
      // Sequential requests (not concurrent) for predictable results
      let allowed = 0;
      let blocked = 0;
      
      for (let i = 0; i < 10; i++) {
        const result = await simulateRequest(
          globalLimiter,
          clientLimiter,
          clientKey,
          config
        );
        if (result.allowed) allowed++;
        else blocked++;
      }

      expect(allowed).toBe(5);  // Only 5 allowed
      expect(blocked).toBe(5);  // 5 blocked by client limit
    });
  });

  describe('Scenario 3: Multiple Clients - Independent Limits', () => {
    it('should track separate limits for each client', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };
      
      // Sequential requests per client for predictable results
      const clientStats = new Map<string, { allowed: number; blocked: number }>();
      
      for (let clientId = 0; clientId < 3; clientId++) {
        const clientKey = `seq-client-${clientId}`;
        clientStats.set(clientKey, { allowed: 0, blocked: 0 });
        
        for (let req = 0; req < 7; req++) {
          const result = await simulateRequest(
            globalLimiter,
            clientLimiter,
            clientKey,
            config
          );
          const stats = clientStats.get(clientKey)!;
          if (result.allowed) stats.allowed++;
          else stats.blocked++;
        }
      }

      // Each client should have exactly 5 allowed and 2 blocked
      let totalAllowed = 0;
      let totalBlocked = 0;
      clientStats.forEach((stats) => {
        expect(stats.allowed).toBe(5);
        expect(stats.blocked).toBe(2);
        totalAllowed += stats.allowed;
        totalBlocked += stats.blocked;
      });
      
      expect(totalAllowed).toBe(15);  // 5 per client x 3 clients
      expect(totalBlocked).toBe(6);   // 2 blocked per client x 3
    });
  });

  describe('Scenario 4: Global Limit Kicks In', () => {
    it('should block requests when global limit is exhausted', async () => {
      // Very restrictive global limit
      const restrictiveGlobal = new GlobalTokenBucketLimiter({
        maxRequestsPerSecond: 10,
        burstSize: 15,  // Only 15 total requests allowed
        enabled: true,
      });

      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 100 };  // High client limit
      
      const results = await simulateConcurrentClients(
        restrictiveGlobal,
        clientLimiter,
        5,   // 5 clients
        10,  // 10 requests each = 50 total
        config
      );

      // Global limit (15) should kick in before all 50 requests
      expect(results.blockedByGlobal).toBeGreaterThan(0);
      expect(results.allowedRequests).toBeLessThanOrEqual(15);
    });
  });

  describe('Scenario 5: Mixed Blocking - Both Limits Active', () => {
    it('should block by whichever limit is hit first', async () => {
      // Very restrictive global limit (only 10 tokens)
      const restrictiveGlobal = new GlobalTokenBucketLimiter({
        maxRequestsPerSecond: 5,
        burstSize: 10,
        enabled: true,
      });

      // Low per-client limit
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 3 };
      
      // Sequential requests to track blocking properly
      let blockedByGlobal = 0;
      let blockedByClient = 0;
      let allowed = 0;
      
      // 5 clients, 5 requests each = 25 total requests
      for (let clientId = 0; clientId < 5; clientId++) {
        const clientKey = `mixed-client-${clientId}`;
        for (let req = 0; req < 5; req++) {
          const result = await simulateRequest(
            restrictiveGlobal,
            clientLimiter,
            clientKey,
            config
          );
          if (result.allowed) allowed++;
          else if (result.blockedBy === 'global') blockedByGlobal++;
          else blockedByClient++;
        }
      }

      // Should have some blocked by global limit (10 tokens)
      // and some blocked by client limit (3 per client)
      expect(allowed).toBeLessThanOrEqual(10); // Global burst limit
      expect(blockedByGlobal + blockedByClient).toBeGreaterThan(0);
    });
  });

  describe('Scenario 6: Burst Traffic Pattern', () => {
    it('should handle burst of traffic followed by normal traffic', async () => {
      const config: RateLimitConfig = { windowMs: 100, maxRequests: 5 };
      const clientKey = 'burst-test-client';

      // Burst: 10 rapid requests
      const burstResults: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        const result = await simulateRequest(
          globalLimiter,
          clientLimiter,
          clientKey,
          config
        );
        burstResults.push(result.allowed);
      }

      // First 5 should pass, next 5 should be blocked
      expect(burstResults.filter(r => r).length).toBe(5);
      expect(burstResults.filter(r => !r).length).toBe(5);

      // Wait for window to slide
      await new Promise(resolve => setTimeout(resolve, 120));

      // Now requests should be allowed again
      const afterWaitResult = await simulateRequest(
        globalLimiter,
        clientLimiter,
        clientKey,
        config
      );
      expect(afterWaitResult.allowed).toBe(true);
    });
  });

  describe('Scenario 7: Different Client Tiers', () => {
    it('should apply different limits to different client types', async () => {
      const regularConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };
      const premiumConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 20 };

      const regularClient = 'regular-user';
      const premiumClient = 'premium-user';

      // Regular user makes 10 requests
      const regularResults: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        const result = await simulateRequest(
          globalLimiter,
          clientLimiter,
          regularClient,
          regularConfig
        );
        regularResults.push(result.allowed);
      }

      // Premium user makes 10 requests
      const premiumResults: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        const result = await simulateRequest(
          globalLimiter,
          clientLimiter,
          premiumClient,
          premiumConfig
        );
        premiumResults.push(result.allowed);
      }

      // Regular: 5 allowed, 5 blocked
      expect(regularResults.filter(r => r).length).toBe(5);
      
      // Premium: all 10 allowed
      expect(premiumResults.filter(r => r).length).toBe(10);
    });
  });

  describe('Scenario 8: IP + User Compound Limiting', () => {
    it('should limit by both IP and user ID', async () => {
      const ipConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 10 };
      const userConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };

      const ip = 'ip:192.168.1.1';
      const userId = 'user:123';

      // Make requests with compound check
      const results: { allowed: boolean; blockedBy?: string }[] = [];
      
      for (let i = 0; i < 12; i++) {
        const result = await clientLimiter.checkMultiple([
          { key: ip, config: ipConfig },
          { key: userId, config: userConfig },
        ]);
        results.push(result);
      }

      // User limit (5) should hit first
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBe(5);  // Blocked by user limit

      // After 5 allowed, remaining 7 should be blocked
      // Note: checkMultiple increments all counters, so after enough requests
      // some may be blocked by IP (limit 10) once it catches up
      const totalBlocked = results.filter(r => !r.allowed).length;
      expect(totalBlocked).toBe(7);  // 7 requests blocked total
    });
  });

  describe('Scenario 9: Progressive Penalties', () => {
    it('should apply increasing penalties for repeat offenders', async () => {
      const config: RateLimitConfig = {
        windowMs: 100,
        maxRequests: 2,
        enablePenalties: true,
        maxPenaltyMultiplier: 4,
      };
      const clientKey = 'repeat-offender';

      // First round: use up limit
      await clientLimiter.check(clientKey, config);
      await clientLimiter.check(clientKey, config);
      
      // First violation
      const violation1 = await clientLimiter.check(clientKey, config);
      expect(violation1.allowed).toBe(false);
      expect(violation1.penaltyLevel).toBe(2);  // Penalty increased

      // More violations
      const violation2 = await clientLimiter.check(clientKey, config);
      expect(violation2.penaltyLevel).toBe(3);

      const violation3 = await clientLimiter.check(clientKey, config);
      expect(violation3.penaltyLevel).toBe(4);  // Max penalty

      // Penalty should not exceed max
      const violation4 = await clientLimiter.check(clientKey, config);
      expect(violation4.penaltyLevel).toBe(4);  // Stays at max
    });
  });

  describe('Scenario 10: High Concurrency Stress Test', () => {
    it('should handle many clients without errors', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 10 };
      
      // Sequential execution for predictable results
      const clientStats = new Map<string, { allowed: number; blocked: number }>();
      let totalAllowed = 0;
      let totalBlocked = 0;
      
      // 50 clients, 15 requests each = 750 total requests
      for (let clientId = 0; clientId < 50; clientId++) {
        const clientKey = `stress-client-${clientId}`;
        clientStats.set(clientKey, { allowed: 0, blocked: 0 });
        
        for (let req = 0; req < 15; req++) {
          const result = await clientLimiter.check(clientKey, config);
          const stats = clientStats.get(clientKey)!;
          if (result.allowed) {
            stats.allowed++;
            totalAllowed++;
          } else {
            stats.blocked++;
            totalBlocked++;
          }
        }
      }

      // Should complete without errors
      expect(totalAllowed + totalBlocked).toBe(750);
      
      // Each client should have exactly 10 allowed (the limit)
      clientStats.forEach((stats) => {
        expect(stats.allowed).toBe(10);
        expect(stats.blocked).toBe(5);
      });
      
      expect(totalAllowed).toBe(500);  // 10 per client x 50 clients
      expect(totalBlocked).toBe(250);  // 5 blocked per client x 50 clients
    });
  });

  describe('Scenario 11: System Load Monitoring', () => {
    it('should report accurate system load', async () => {
      const smallBucket = new GlobalTokenBucketLimiter({
        maxRequestsPerSecond: 100,
        burstSize: 50,
        enabled: true,
      });

      // Initial state should be healthy
      let load = smallBucket.getSystemLoad();
      expect(load.status).toBe('healthy');
      expect(load.tokensRemaining).toBe(50);

      // Consume half the tokens
      for (let i = 0; i < 25; i++) {
        smallBucket.check();
      }

      load = smallBucket.getSystemLoad();
      expect(load.tokensRemaining).toBeLessThanOrEqual(25);
      expect(load.loadPercentage).toBeGreaterThanOrEqual(50);

      // Consume most tokens
      for (let i = 0; i < 20; i++) {
        smallBucket.check();
      }

      load = smallBucket.getSystemLoad();
      expect(['high', 'critical']).toContain(load.status);
    });
  });

  describe('Scenario 12: Rate Limiter Reset', () => {
    it('should allow reset of specific client', async () => {
      const config: RateLimitConfig = { windowMs: 10000, maxRequests: 2 };
      const clientKey = 'reset-test-client';

      // Use up limit
      await clientLimiter.check(clientKey, config);
      await clientLimiter.check(clientKey, config);
      
      const blocked = await clientLimiter.check(clientKey, config);
      expect(blocked.allowed).toBe(false);

      // Reset the client
      await clientLimiter.reset(clientKey);

      // Should be allowed again
      const afterReset = await clientLimiter.check(clientKey, config);
      expect(afterReset.allowed).toBe(true);
    });
  });

  describe('Scenario 13: Metrics Tracking', () => {
    it('should track accurate metrics across multiple clients', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 3 };
      
      // Sequential execution for predictable metrics
      for (let clientId = 0; clientId < 5; clientId++) {
        const clientKey = `metrics-client-${clientId}`;
        for (let req = 0; req < 5; req++) {
          await clientLimiter.check(clientKey, config);
        }
      }

      const metrics = clientLimiter.getMetrics();
      
      expect(metrics.totalChecks).toBe(25);
      expect(metrics.totalAllowed).toBe(15);  // 3 per client x 5
      expect(metrics.totalBlocked).toBe(10);  // 2 blocked per client x 5
    });
  });
});

describe('Real-World API Tier Simulation', () => {
  let globalLimiter: GlobalTokenBucketLimiter;
  let clientLimiter: EnterpriseRateLimiter;

  beforeEach(() => {
    globalLimiter = new GlobalTokenBucketLimiter({
      maxRequestsPerSecond: 5000,
      burstSize: 10000,
      enabled: true,
    });
    clientLimiter = new EnterpriseRateLimiter();
  });

  afterEach(() => {
    clientLimiter.destroy();
  });

  it('should handle auth endpoint correctly (45 req/15min)', async () => {
    const config = RATE_LIMIT_CONFIGS_V2.auth;
    const clientKey = 'auth-test-user';

    // Simulate login attempts
    const results: boolean[] = [];
    for (let i = 0; i < 50; i++) {
      const result = await clientLimiter.check(clientKey, config);
      results.push(result.allowed);
    }

    // First 45 should pass
    expect(results.slice(0, 45).every(r => r)).toBe(true);
    // Remaining 5 should be blocked
    expect(results.slice(45).every(r => !r)).toBe(true);
  });

  it('should handle sensitive endpoint correctly (2 req/sec)', async () => {
    const config = RATE_LIMIT_CONFIGS_V2.sensitive;
    const clientKey = 'sensitive-test-user';

    // Rapid requests to sensitive endpoint
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const result = await clientLimiter.check(clientKey, config);
      results.push(result.allowed);
    }

    // First 2 should pass
    expect(results.filter(r => r).length).toBe(2);
    // Remaining 3 should be blocked
    expect(results.filter(r => !r).length).toBe(3);
  });

  it('should handle API endpoint correctly (60 req/min)', async () => {
    const config = RATE_LIMIT_CONFIGS_V2.api;
    const clientKey = 'api-test-user';

    // Simulate API usage
    const results: boolean[] = [];
    for (let i = 0; i < 65; i++) {
      const result = await clientLimiter.check(clientKey, config);
      results.push(result.allowed);
    }

    // First 60 should pass
    expect(results.slice(0, 60).every(r => r)).toBe(true);
    // Remaining 5 should be blocked
    expect(results.slice(60).every(r => !r)).toBe(true);
  });
});
