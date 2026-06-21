/**
 * Rate Limiter Tests
 * 
 * Tests for rate limiting configuration and functionality
 */

import { RATE_LIMIT_CONFIGS, RateLimiterCompat as RateLimiter } from '../src/lib/utils/rate-limiter';

describe('Rate Limiter Configuration', () => {
  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have auth config with 45 requests per 15 minutes', () => {
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(45);
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should have sensitive config with 2 requests per second', () => {
      expect(RATE_LIMIT_CONFIGS.sensitive.maxRequests).toBe(2);
      expect(RATE_LIMIT_CONFIGS.sensitive.windowMs).toBe(1000); // 1 second
    });

    it('should have validation config with 30 requests per minute', () => {
      expect(RATE_LIMIT_CONFIGS.validation.maxRequests).toBe(30);
      expect(RATE_LIMIT_CONFIGS.validation.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('should have api config with 60 requests per minute', () => {
      expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(60);
      expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('should have readOnly config with 100 requests per minute', () => {
      expect(RATE_LIMIT_CONFIGS.readOnly.maxRequests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.readOnly.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('should have appropriate error messages for each config', () => {
      expect(RATE_LIMIT_CONFIGS.auth.message).toContain('authentication');
      expect(RATE_LIMIT_CONFIGS.sensitive.message).toContain('sensitive');
      expect(RATE_LIMIT_CONFIGS.validation.message).toContain('validation');
      expect(RATE_LIMIT_CONFIGS.api.message).toContain('requests');
      expect(RATE_LIMIT_CONFIGS.readOnly.message).toContain('requests');
    });
  });

  describe('RateLimiter class', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter();
    });

    afterEach(() => {
      limiter.destroy();
    });

    it('should allow requests within the limit', async () => {
      const config = { windowMs: 1000, maxRequests: 5 };
      const clientId = 'test-client-1';

      for (let i = 0; i < 5; i++) {
        const result = await limiter.check(clientId, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding the limit', async () => {
      const config = { windowMs: 1000, maxRequests: 3 };
      const clientId = 'test-client-2';

      // Use up all allowed requests
      for (let i = 0; i < 3; i++) {
        await limiter.check(clientId, config);
      }

      // This one should be blocked
      const result = await limiter.check(clientId, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track separate limits for different clients', async () => {
      const config = { windowMs: 1000, maxRequests: 2 };
      const client1 = 'client-1';
      const client2 = 'client-2';

      // Client 1 uses up their limit
      await limiter.check(client1, config);
      await limiter.check(client1, config);
      const result1 = await limiter.check(client1, config);
      expect(result1.allowed).toBe(false);

      // Client 2 should still be able to make requests
      const result2 = await limiter.check(client2, config);
      expect(result2.allowed).toBe(true);
    });

    it('should reset limit after window expires', async () => {
      const config = { windowMs: 100, maxRequests: 2 }; // 100ms window
      const clientId = 'test-client-3';

      // Use up the limit
      await limiter.check(clientId, config);
      await limiter.check(clientId, config);
      expect((await limiter.check(clientId, config)).allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      const result = await limiter.check(clientId, config);
      expect(result.allowed).toBe(true);
    });

    it('should handle auth rate limit (45 req/15min)', async () => {
      const clientId = 'auth-client';
      
      // Should allow 45 requests
      for (let i = 0; i < 45; i++) {
        const result = await limiter.check(clientId, RATE_LIMIT_CONFIGS.auth);
        expect(result.allowed).toBe(true);
      }

      // 46th request should be blocked
      const result = await limiter.check(clientId, RATE_LIMIT_CONFIGS.auth);
      expect(result.allowed).toBe(false);
    });

    it('should handle sensitive rate limit (2 req/sec)', async () => {
      const clientId = 'sensitive-client';
      
      // Should allow 2 requests
      expect((await limiter.check(clientId, RATE_LIMIT_CONFIGS.sensitive)).allowed).toBe(true);
      expect((await limiter.check(clientId, RATE_LIMIT_CONFIGS.sensitive)).allowed).toBe(true);

      // 3rd request should be blocked
      expect((await limiter.check(clientId, RATE_LIMIT_CONFIGS.sensitive)).allowed).toBe(false);
    });

    it('should reset client limit when reset() is called', async () => {
      const config = { windowMs: 1000, maxRequests: 1 };
      const clientId = 'reset-client';

      // Use up the limit
      await limiter.check(clientId, config);
      expect((await limiter.check(clientId, config)).allowed).toBe(false);

      // Reset the client
      await limiter.reset(clientId);

      // Should be allowed again
      expect((await limiter.check(clientId, config)).allowed).toBe(true);
    });
  });
});
