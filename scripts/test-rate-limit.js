#!/usr/bin/env node

/**
 * Quick Rate Limit Test
 * 
 * This script quickly tests if rate limiting is working on a specific endpoint
 * Usage: node scripts/test-rate-limit.js <endpoint> <requests>
 * 
 * Example:
 *   node scripts/test-rate-limit.js /api/auth/check-email 10
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');

const endpoint = process.argv[2] || '/api/subscription-plans';
const numRequests = parseInt(process.argv[3] || '20');

// Ensure endpoint starts with /
const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

console.log(`\n🔍 Testing Rate Limit on: ${normalizedEndpoint}`);
console.log(`📊 Sending ${numRequests} requests...\n`);

let successCount = 0;
let rateLimitedCount = 0;
let errorCount = 0;

function makeRequest(index) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: normalizedEndpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'RateLimitTest/1.0',
      },
    };

    const req = http.request(options, (res) => {
      res.on('data', () => {
        // Consume the data stream but don't need to store it
      });

      res.on('end', () => {
        const status = res.statusCode;
        const rateLimitHeaders = {
          limit: res.headers['x-ratelimit-limit'],
          remaining: res.headers['x-ratelimit-remaining'],
          reset: res.headers['x-ratelimit-reset'],
        };

        if (status === 200) {
          successCount++;
          console.log(`✅ Request ${index + 1}: SUCCESS (Remaining: ${rateLimitHeaders.remaining || 'N/A'})`);
        } else if (status === 429) {
          rateLimitedCount++;
          const retryAfter = res.headers['retry-after'];
          console.log(`⛔ Request ${index + 1}: RATE LIMITED (Retry after: ${retryAfter}s)`);
        } else {
          errorCount++;
          console.log(`❌ Request ${index + 1}: ERROR ${status}`);
        }

        resolve({ status, headers: rateLimitHeaders });
      });
    });

    req.on('error', (err) => {
      errorCount++;
      console.log(`❌ Request ${index + 1}: ERROR - ${err.message}`);
      resolve({ error: err.message });
    });

    req.end();
  });
}

async function runTest() {
  const startTime = Date.now();

  for (let i = 0; i < numRequests; i++) {
    await makeRequest(i);
    // Small delay to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('📈 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Requests:    ${numRequests}`);
  console.log(`Successful:        ${successCount} ✅`);
  console.log(`Rate Limited:      ${rateLimitedCount} ⛔`);
  console.log(`Errors:            ${errorCount} ❌`);
  console.log(`Duration:          ${duration}s`);
  console.log('═'.repeat(60));

  if (rateLimitedCount > 0) {
    console.log('\n✅ Rate limiting is ACTIVE on this endpoint!');
  } else {
    console.log('\n⚠️  No rate limiting detected. Consider implementing it for this endpoint.');
  }

  console.log('');
}

runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
