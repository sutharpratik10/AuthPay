/**
 * Enterprise Rate Limiter v2 Tests
 */

import {
  EnterpriseRateLimiter,
  GlobalTokenBucketLimiter,
  RATE_LIMIT_CONFIGS_V2,
  RateLimitConfig,
} from '../src/lib/utils/rate-limiter';

describe('EnterpriseRateLimiter', () => {
  let limiter: EnterpriseRateLimiter;

  beforeEach(() => {
    limiter = new EnterpriseRateLimiter();
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };
      const key = 'test-client-1';

      for (let i = 0; i < 5; i++) {
        const result = await limiter.check(key, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 3 };
      const key = 'test-client-2';

      // Use up all allowed requests
      for (let i = 0; i < 3; i++) {
        await limiter.check(key, config);
      }

      // 4th request should be blocked
      const result = await limiter.check(key, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should track separate limits for different clients', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 2 };

      // Client 1 uses up their limit
      await limiter.check('client-1', config);
      await limiter.check('client-1', config);
      const result1 = await limiter.check('client-1', config);
      expect(result1.allowed).toBe(false);

      // Client 2 should still be able to make requests
      const result2 = await limiter.check('client-2', config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should use true sliding window (not fixed window)', async () => {
      const config: RateLimitConfig = { windowMs: 100, maxRequests: 2 };
      const key = 'sliding-window-test';

      // Make 2 requests
      await limiter.check(key, config);
      await limiter.check(key, config);

      // Wait for half the window
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should still be blocked (sliding window)
      const result1 = await limiter.check(key, config);
      expect(result1.allowed).toBe(false);

      // Wait for first request to slide out
      await new Promise(resolve => setTimeout(resolve, 50));

      // Now should be allowed
      const result2 = await limiter.check(key, config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Progressive Penalties', () => {
    it('should increase penalty level on repeated violations', async () => {
      const config: RateLimitConfig = {
        windowMs: 100,
        maxRequests: 2,
        enablePenalties: true,
        maxPenaltyMultiplier: 4,
      };
      const key = 'penalty-test';

      // Use up limit
      await limiter.check(key, config);
      await limiter.check(key, config);

      // First violation - penalty level should increase
      const violation1 = await limiter.check(key, config);
      expect(violation1.allowed).toBe(false);
      expect(violation1.penaltyLevel).toBe(2);

      // Second violation
      const violation2 = await limiter.check(key, config);
      expect(violation2.allowed).toBe(false);
      expect(violation2.penaltyLevel).toBe(3);
    });

    it('should cap penalty at maxPenaltyMultiplier', async () => {
      const config: RateLimitConfig = {
        windowMs: 50,
        maxRequests: 1,
        enablePenalties: true,
        maxPenaltyMultiplier: 3,
      };
      const key = 'penalty-cap-test';

      // Trigger many violations
      for (let i = 0; i < 10; i++) {
        await limiter.check(key, config);
      }

      const result = await limiter.check(key, config);
      expect(result.penaltyLevel).toBeLessThanOrEqual(3);
    });
  });

  describe('Compound Rate Limiting', () => {
    it('should check multiple keys and block if any exceeds limit', async () => {
      const ipConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 10 };
      const userConfig: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };

      // User limit is stricter
      for (let i = 0; i < 5; i++) {
        await limiter.checkMultiple([
          { key: 'ip:1.2.3.4', config: ipConfig },
          { key: 'user:123', config: userConfig },
        ]);
      }

      // Should be blocked by user limit
      const result = await limiter.checkMultiple([
        { key: 'ip:1.2.3.4', config: ipConfig },
        { key: 'user:123', config: userConfig },
      ]);

      expect(result.allowed).toBe(false);
      expect(result.blockedBy).toBe('user:123');
    });
  });

  describe('Metrics', () => {
    it('should track metrics correctly', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 2 };

      await limiter.check('metrics-test', config);
      await limiter.check('metrics-test', config);
      await limiter.check('metrics-test', config); // blocked

      const metrics = limiter.getMetrics();
      expect(metrics.totalChecks).toBe(3);
      expect(metrics.totalAllowed).toBe(2);
      expect(metrics.totalBlocked).toBe(1);
    });
  });

  describe('Key Stats', () => {
    it('should return detailed stats for a key', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };
      const key = 'stats-test';

      await limiter.check(key, config);
      await limiter.check(key, config);

      const stats = await limiter.getKeyStats(key);
      expect(stats).not.toBeNull();
      expect(stats?.currentCount).toBe(2);
      expect(stats?.timestamps.length).toBe(2);
    });

    it('should return null for non-existent key', async () => {
      const stats = await limiter.getKeyStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset limit for a specific key', async () => {
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 1 };
      const key = 'reset-test';

      await limiter.check(key, config);
      const blocked = await limiter.check(key, config);
      expect(blocked.allowed).toBe(false);

      // Reset the key
      await limiter.reset(key);

      // Should be allowed again
      const afterReset = await limiter.check(key, config);
      expect(afterReset.allowed).toBe(true);
    });
  });

  describe('Configuration Presets', () => {
    it('should have correct auth config', () => {
      expect(RATE_LIMIT_CONFIGS_V2.auth.maxRequests).toBe(45);
      expect(RATE_LIMIT_CONFIGS_V2.auth.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT_CONFIGS_V2.auth.enablePenalties).toBe(true);
    });

    it('should have correct sensitive config', () => {
      expect(RATE_LIMIT_CONFIGS_V2.sensitive.maxRequests).toBe(2);
      expect(RATE_LIMIT_CONFIGS_V2.sensitive.windowMs).toBe(1000);
      expect(RATE_LIMIT_CONFIGS_V2.sensitive.enablePenalties).toBe(true);
    });
  });
});

describe('GlobalTokenBucketLimiter', () => {
  let limiter: GlobalTokenBucketLimiter;

  beforeEach(() => {
    limiter = new GlobalTokenBucketLimiter({
      maxRequestsPerSecond: 100,
      burstSize: 200,
      enabled: true,
    });
  });

  it('should allow requests when tokens available', () => {
    const result = limiter.check();
    expect(result.allowed).toBe(true);
    expect(result.tokensRemaining).toBeLessThan(200);
  });

  it('should refill tokens over time', async () => {
    // Consume some tokens
    for (let i = 0; i < 50; i++) {
      limiter.check();
    }

    const before = limiter.getSystemLoad().tokensRemaining;

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, 100));

    limiter.check(); // Trigger refill calculation
    const after = limiter.getSystemLoad().tokensRemaining;

    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('should block when tokens exhausted', () => {
    // Create a small limiter
    const smallLimiter = new GlobalTokenBucketLimiter({
      maxRequestsPerSecond: 10,
      burstSize: 5,
      enabled: true,
    });

    // Exhaust all tokens
    for (let i = 0; i < 5; i++) {
      smallLimiter.check();
    }

    const result = smallLimiter.check();
    expect(result.allowed).toBe(false);
    expect(result.loadPercentage).toBe(100);
  });

  it('should return correct system load status', () => {
    const load = limiter.getSystemLoad();
    expect(load.status).toBe('healthy');
    expect(load.loadPercentage).toBeGreaterThanOrEqual(0);
    expect(load.loadPercentage).toBeLessThanOrEqual(100);
  });

  it('should be disabled when enabled=false', () => {
    limiter.updateConfig({ enabled: false });
    const result = limiter.check();
    expect(result.allowed).toBe(true);
    expect(result.tokensRemaining).toBe(200);
  });

  it('should reset correctly', () => {
    // Consume tokens
    for (let i = 0; i < 50; i++) {
      limiter.check();
    }

    limiter.reset();

    const load = limiter.getSystemLoad();
    expect(load.tokensRemaining).toBe(200);
    expect(load.metrics.totalRequests).toBe(0);
  });
});
