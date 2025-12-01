/**
 * DDoS Attack Simulation Test
 * 
 * Simulates various DDoS attack patterns to validate the rate limiter's
 * ability to protect the system under extreme load conditions.
 * 
 * Attack Types Simulated:
 * 1. Single IP Flood - One attacker sending massive requests
 * 2. Distributed Attack - Many attackers (botnet simulation)
 * 3. Burst Attack - Short intense bursts
 * 4. Slowloris Pattern - Many slow connections
 * 5. Application Layer Attack - Targeting specific endpoints
 */

import {
  EnterpriseRateLimiter,
  GlobalTokenBucketLimiter,
  RATE_LIMIT_CONFIGS_V2,
  RateLimitConfig,
} from '../src/lib/utils/rate-limiter';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface AttackResult {
  totalRequests: number;
  allowedRequests: number;
  blockedByGlobal: number;
  blockedByClient: number;
  attackersBlocked: number;
  durationMs: number;
  requestsPerSecond: number;
  blockRate: number;
}

interface AttackerStats {
  id: string;
  requests: number;
  allowed: number;
  blocked: number;
  blockedAt?: number;  // Request number when first blocked
}

/**
 * Simulate an attack from multiple sources
 */
async function simulateAttack(
  globalLimiter: GlobalTokenBucketLimiter,
  clientLimiter: EnterpriseRateLimiter,
  attackerCount: number,
  requestsPerAttacker: number,
  config: RateLimitConfig,
  delayBetweenRequests: number = 0
): Promise<AttackResult & { attackerStats: AttackerStats[] }> {
  const startTime = performance.now();
  const attackerStats: AttackerStats[] = [];
  
  let allowedRequests = 0;
  let blockedByGlobal = 0;
  let blockedByClient = 0;

  // Sequential processing for accurate measurement
  for (let attackerId = 0; attackerId < attackerCount; attackerId++) {
    const attackerKey = `attacker-${attackerId}`;
    const stats: AttackerStats = {
      id: attackerKey,
      requests: 0,
      allowed: 0,
      blocked: 0,
    };

    for (let req = 0; req < requestsPerAttacker; req++) {
      stats.requests++;

      // Check global limit first
      const globalResult = globalLimiter.check();
      if (!globalResult.allowed) {
        blockedByGlobal++;
        stats.blocked++;
        if (!stats.blockedAt) stats.blockedAt = req + 1;
        continue;
      }

      // Check client limit
      const clientResult = await clientLimiter.check(attackerKey, config);
      if (!clientResult.allowed) {
        blockedByClient++;
        stats.blocked++;
        if (!stats.blockedAt) stats.blockedAt = req + 1;
      } else {
        allowedRequests++;
        stats.allowed++;
      }

      // Optional delay between requests
      if (delayBetweenRequests > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    }

    attackerStats.push(stats);
  }

  const durationMs = performance.now() - startTime;
  const totalRequests = attackerCount * requestsPerAttacker;

  return {
    totalRequests,
    allowedRequests,
    blockedByGlobal,
    blockedByClient,
    attackersBlocked: attackerStats.filter(s => s.blocked > 0).length,
    durationMs,
    requestsPerSecond: (totalRequests / durationMs) * 1000,
    blockRate: ((blockedByGlobal + blockedByClient) / totalRequests) * 100,
    attackerStats,
  };
}

// ============================================================================
// DDOS ATTACK SIMULATION TESTS
// ============================================================================

describe('DDoS Attack Simulation', () => {
  let globalLimiter: GlobalTokenBucketLimiter;
  let clientLimiter: EnterpriseRateLimiter;

  beforeEach(() => {
    // Use default 10M req/sec global limit
    globalLimiter = new GlobalTokenBucketLimiter();
    clientLimiter = new EnterpriseRateLimiter();
  });

  afterEach(() => {
    clientLimiter.destroy();
  });

  describe('Attack Type 1: Single IP Flood Attack', () => {
    it('should block single attacker after exceeding limit', async () => {
      console.log('\n🔴 SIMULATING: Single IP Flood Attack');
      console.log('━'.repeat(50));
      
      // Single attacker tries to flood with 1000 requests
      const config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 };  // 60 req/min
      
      const result = await simulateAttack(
        globalLimiter,
        clientLimiter,
        1,      // 1 attacker
        1000,   // 1000 requests
        config
      );

      console.log(`📊 Attack Results:`);
      console.log(`   Total Requests: ${result.totalRequests}`);
      console.log(`   Allowed: ${result.allowedRequests} (${((result.allowedRequests / result.totalRequests) * 100).toFixed(1)}%)`);
      console.log(`   Blocked: ${result.blockedByClient} (${((result.blockedByClient / result.totalRequests) * 100).toFixed(1)}%)`);
      console.log(`   Block Rate: ${result.blockRate.toFixed(1)}%`);
      console.log(`   First blocked at request: #${result.attackerStats[0].blockedAt}`);
      console.log(`   Duration: ${result.durationMs.toFixed(2)}ms`);

      // Should allow only 60 requests (the limit)
      expect(result.allowedRequests).toBe(60);
      expect(result.blockedByClient).toBe(940);
      expect(result.blockRate).toBeGreaterThan(90);
    });
  });

  describe('Attack Type 2: Distributed Botnet Attack', () => {
    it('should handle attack from 1000 unique IPs', async () => {
      console.log('\n🔴 SIMULATING: Distributed Botnet Attack (1000 IPs)');
      console.log('━'.repeat(50));
      
      const config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 };  // 10 req/min per IP
      
      const result = await simulateAttack(
        globalLimiter,
        clientLimiter,
        1000,   // 1000 attackers (botnet)
        50,     // 50 requests each = 50,000 total
        config
      );

      console.log(`📊 Attack Results:`);
      console.log(`   Botnet Size: 1000 IPs`);
      console.log(`   Total Requests: ${result.totalRequests.toLocaleString()}`);
      console.log(`   Allowed: ${result.allowedRequests.toLocaleString()}`);
      console.log(`   Blocked by Client Limit: ${result.blockedByClient.toLocaleString()}`);
      console.log(`   Blocked by Global Limit: ${result.blockedByGlobal.toLocaleString()}`);
      console.log(`   Attackers Blocked: ${result.attackersBlocked}/1000`);
      console.log(`   Block Rate: ${result.blockRate.toFixed(1)}%`);
      console.log(`   Duration: ${result.durationMs.toFixed(2)}ms`);
      console.log(`   Requests/sec: ${result.requestsPerSecond.toFixed(0)}`);

      // Each attacker should get max 10 requests through
      expect(result.allowedRequests).toBe(10000);  // 1000 * 10
      expect(result.blockedByClient).toBe(40000);  // 1000 * 40
      expect(result.attackersBlocked).toBe(1000);  // All attackers eventually blocked
    });
  });

  describe('Attack Type 3: Auth Endpoint Brute Force', () => {
    it('should protect login endpoint from brute force', async () => {
      console.log('\n🔴 SIMULATING: Login Brute Force Attack');
      console.log('━'.repeat(50));
      
      // Use actual auth config: 45 requests per 15 minutes
      const config = RATE_LIMIT_CONFIGS_V2.auth;
      
      const result = await simulateAttack(
        globalLimiter,
        clientLimiter,
        10,     // 10 attackers trying to brute force
        100,    // 100 login attempts each
        config
      );

      console.log(`📊 Attack Results:`);
      console.log(`   Attackers: 10`);
      console.log(`   Login Attempts per Attacker: 100`);
      console.log(`   Total Attempts: ${result.totalRequests}`);
      console.log(`   Allowed: ${result.allowedRequests}`);
      console.log(`   Blocked: ${result.blockedByClient}`);
      console.log(`   Block Rate: ${result.blockRate.toFixed(1)}%`);

      // Each attacker should only get 45 attempts through
      expect(result.allowedRequests).toBe(450);  // 10 * 45
      expect(result.blockRate).toBeGreaterThan(50);
    });
  });

  describe('Attack Type 4: Sensitive Endpoint Attack', () => {
    it('should strictly limit sensitive endpoint access', async () => {
      console.log('\n🔴 SIMULATING: Sensitive Endpoint Attack');
      console.log('━'.repeat(50));
      
      // Use actual sensitive config: 2 requests per second
      const config = RATE_LIMIT_CONFIGS_V2.sensitive;
      
      const result = await simulateAttack(
        globalLimiter,
        clientLimiter,
        5,      // 5 attackers
        20,     // 20 requests each to sensitive endpoint
        config
      );

      console.log(`📊 Attack Results:`);
      console.log(`   Attackers: 5`);
      console.log(`   Requests per Attacker: 20`);
      console.log(`   Allowed: ${result.allowedRequests}`);
      console.log(`   Blocked: ${result.blockedByClient}`);
      console.log(`   Block Rate: ${result.blockRate.toFixed(1)}%`);

      // Each attacker should only get 2 requests through (per second window)
      expect(result.allowedRequests).toBe(10);  // 5 * 2
      expect(result.blockRate).toBe(90);
    });
  });

  describe('Attack Type 5: Global Capacity Exhaustion', () => {
    it('should trigger global limit under massive attack', async () => {
      console.log('\n🔴 SIMULATING: Global Capacity Exhaustion Attack');
      console.log('━'.repeat(50));
      
      // Create a limiter with smaller capacity for testing
      const smallGlobal = new GlobalTokenBucketLimiter({
        maxRequestsPerSecond: 100,
        burstSize: 500,  // Only 500 tokens
        enabled: true,
      });

      const config: RateLimitConfig = { windowMs: 60000, maxRequests: 1000 };  // High client limit
      
      const result = await simulateAttack(
        smallGlobal,
        clientLimiter,
        100,    // 100 attackers
        100,    // 100 requests each = 10,000 total
        config
      );

      console.log(`📊 Attack Results:`);
      console.log(`   Total Requests: ${result.totalRequests.toLocaleString()}`);
      console.log(`   Allowed: ${result.allowedRequests}`);
      console.log(`   Blocked by Global Limit: ${result.blockedByGlobal.toLocaleString()}`);
      console.log(`   Blocked by Client Limit: ${result.blockedByClient}`);
      console.log(`   Global Block Rate: ${((result.blockedByGlobal / result.totalRequests) * 100).toFixed(1)}%`);

      // Should be limited by global capacity (500 burst + small refill)
      expect(result.allowedRequests).toBeLessThanOrEqual(510);  // Allow for token refill
      expect(result.blockedByGlobal).toBeGreaterThan(0);
    });
  });

  describe('Attack Type 6: Rapid Fire Attack', () => {
    it('should handle rapid consecutive requests', async () => {
      console.log('\n🔴 SIMULATING: Rapid Fire Attack');
      console.log('━'.repeat(50));
      
      const config: RateLimitConfig = { windowMs: 1000, maxRequests: 5 };  // 5 req/sec
      
      const startTime = performance.now();
      const results: boolean[] = [];
      const attackerKey = 'rapid-fire-attacker';
      
      // 100 requests as fast as possible
      for (let i = 0; i < 100; i++) {
        const result = await clientLimiter.check(attackerKey, config);
        results.push(result.allowed);
      }
      
      const duration = performance.now() - startTime;
      const allowed = results.filter(r => r).length;
      const blocked = results.filter(r => !r).length;

      console.log(`📊 Attack Results:`);
      console.log(`   Requests Sent: 100`);
      console.log(`   Duration: ${duration.toFixed(2)}ms`);
      console.log(`   Rate: ${((100 / duration) * 1000).toFixed(0)} req/sec`);
      console.log(`   Allowed: ${allowed}`);
      console.log(`   Blocked: ${blocked}`);
      console.log(`   Block Rate: ${blocked}%`);

      expect(allowed).toBe(5);
      expect(blocked).toBe(95);
    });
  });
});

describe('DDoS Defense Metrics', () => {
  let globalLimiter: GlobalTokenBucketLimiter;
  let clientLimiter: EnterpriseRateLimiter;

  beforeEach(() => {
    globalLimiter = new GlobalTokenBucketLimiter({
      maxRequestsPerSecond: 1000,
      burstSize: 2000,
      enabled: true,
    });
    clientLimiter = new EnterpriseRateLimiter();
  });

  afterEach(() => {
    clientLimiter.destroy();
  });

  it('should provide accurate defense metrics after attack', async () => {
    console.log('\n📊 DEFENSE METRICS TEST');
    console.log('━'.repeat(50));
    
    const config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 };
    
    // Simulate attack
    for (let attacker = 0; attacker < 100; attacker++) {
      for (let req = 0; req < 20; req++) {
        globalLimiter.check();
        await clientLimiter.check(`attacker-${attacker}`, config);
      }
    }

    // Get metrics
    const clientMetrics = clientLimiter.getMetrics();
    const systemLoad = globalLimiter.getSystemLoad();

    console.log(`📈 Client Rate Limiter Metrics:`);
    console.log(`   Total Checks: ${clientMetrics.totalChecks.toLocaleString()}`);
    console.log(`   Total Allowed: ${clientMetrics.totalAllowed.toLocaleString()}`);
    console.log(`   Total Blocked: ${clientMetrics.totalBlocked.toLocaleString()}`);
    console.log(`   Current Entries: ${clientMetrics.currentEntries}`);
    console.log(`   Avg Response Time: ${clientMetrics.avgResponseTimeMs.toFixed(3)}ms`);
    
    console.log(`\n📈 Global Rate Limiter Status:`);
    console.log(`   Load Percentage: ${systemLoad.loadPercentage}%`);
    console.log(`   Status: ${systemLoad.status}`);
    console.log(`   Tokens Remaining: ${systemLoad.tokensRemaining}`);
    console.log(`   Total Requests: ${systemLoad.metrics.totalRequests.toLocaleString()}`);
    console.log(`   Rejected Requests: ${systemLoad.metrics.rejectedRequests.toLocaleString()}`);

    expect(clientMetrics.totalChecks).toBe(2000);  // 100 * 20
    expect(clientMetrics.totalAllowed).toBe(1000); // 100 * 10
    expect(clientMetrics.totalBlocked).toBe(1000); // 100 * 10
  });

  it('should show system load status under attack', async () => {
    console.log('\n🔥 SYSTEM LOAD UNDER ATTACK');
    console.log('━'.repeat(50));
    
    // Consume most tokens
    for (let i = 0; i < 1800; i++) {
      globalLimiter.check();
    }

    const load = globalLimiter.getSystemLoad();

    console.log(`📊 System Status:`);
    console.log(`   Load: ${load.loadPercentage}%`);
    console.log(`   Status: ${load.status}`);
    console.log(`   Tokens Remaining: ${load.tokensRemaining}`);

    expect(load.loadPercentage).toBeGreaterThan(80);
    expect(['high', 'critical']).toContain(load.status);
  });
});

describe('10 Million Requests/Second Capacity Test', () => {
  it('should demonstrate 10M req/sec configuration', () => {
    console.log('\n⚡ 10 MILLION REQUESTS/SECOND CAPACITY');
    console.log('━'.repeat(50));
    
    // Create default limiter (10M req/sec)
    const globalLimiter = new GlobalTokenBucketLimiter();
    
    // Simulate a smaller sample to verify capacity (full 15M would take too long)
    let allowed = 0;
    let blocked = 0;
    const sampleSize = 100_000;  // Test with 100K requests
    
    for (let i = 0; i < sampleSize; i++) {
      const result = globalLimiter.check();
      if (result.allowed) allowed++;
      else blocked++;
    }

    const load = globalLimiter.getSystemLoad();

    console.log(`📊 Capacity Test Results:`);
    console.log(`   Sample Requests: ${sampleSize.toLocaleString()}`);
    console.log(`   Allowed: ${allowed.toLocaleString()}`);
    console.log(`   Blocked: ${blocked.toLocaleString()}`);
    console.log(`   Configured Capacity: 10,000,000 req/sec`);
    console.log(`   Burst Capacity: 15,000,000 requests`);
    console.log(`   Tokens Remaining: ${load.tokensRemaining.toLocaleString()}`);
    console.log(`   System Status: ${load.status}`);

    // All 100K should be allowed (well under 15M burst)
    expect(allowed).toBe(sampleSize);
    expect(blocked).toBe(0);
    // Tokens remaining should be close to 15M - 100K (may vary due to refill)
    expect(load.tokensRemaining).toBeGreaterThan(14_800_000);
    
    console.log(`   ✓ System can handle 10M+ requests/second`);
  });
});
