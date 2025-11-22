#!/usr/bin/env node

/**
 * Load Testing Script for AuthPay API Routes
 * 
 * This script simulates high-traffic scenarios to test application resilience
 * Usage: node scripts/load-test.js [intensity]
 * 
 * Intensity levels:
 * - low: 10 connections, 10 seconds
 * - medium: 50 connections, 30 seconds
 * - high: 100 connections, 60 seconds
 * - extreme: 500 connections, 120 seconds
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const autocannon = require('autocannon');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const intensity = process.argv[2] || 'low';

const INTENSITY_CONFIGS = {
  low: {
    connections: 10,
    duration: 10,
    pipelining: 1,
    description: 'Light load - Normal traffic simulation'
  },
  medium: {
    connections: 50,
    duration: 30,
    pipelining: 5,
    description: 'Medium load - Busy period simulation'
  },
  high: {
    connections: 100,
    duration: 60,
    pipelining: 10,
    description: 'High load - Peak traffic simulation'
  },
  extreme: {
    connections: 500,
    duration: 120,
    pipelining: 20,
    description: 'Extreme load - DDoS-like scenario'
  },
  stress: {
    connections: 1000,
    duration: 60,
    pipelining: 50,
    description: 'Stress test - 1000+ RPS target across all routes'
  },
  extreme: {
    connections: 2000,
    duration: 30,
    pipelining: 100,
    description: 'Extreme stress - 10,000+ RPS target (Rate limit protection test)'
  }
};

// API routes to test
const API_ROUTES = [
  '/api/auth/check-email',
  '/api/user/admin-status',
  '/api/user/subscription-status',
  '/api/subscription-plans',
  '/api/rbac/check-permission',
  '/api/auth/check-suspension',
  '/api/user/data',
];

const config = INTENSITY_CONFIGS[intensity] || INTENSITY_CONFIGS.low;

console.log(chalk.blue.bold('\n🔥 AuthPay Load Testing Tool\n'));
console.log(chalk.yellow(`Intensity: ${intensity.toUpperCase()}`));
console.log(chalk.yellow(`Description: ${config.description}`));
console.log(chalk.yellow(`Target: ${BASE_URL}`));
console.log(chalk.yellow(`Connections: ${config.connections}`));
console.log(chalk.yellow(`Duration: ${config.duration}s`));
console.log(chalk.yellow(`Pipelining: ${config.pipelining}\n`));

const results = [];

function runTest(route) {
  return new Promise((resolve) => {
    console.log(chalk.cyan(`\n📊 Testing: ${route}`));
    
    const instance = autocannon({
      url: `${BASE_URL}${route}`,
      connections: config.connections,
      duration: config.duration,
      pipelining: config.pipelining,
      method: 'GET',
      headers: {
        'User-Agent': 'LoadTest/1.0',
      },
    }, (err, result) => {
      if (err) {
        console.error(chalk.red(`❌ Error testing ${route}:`), err.message);
        resolve({ route, error: err.message });
      } else {
        const summary = {
          route,
          requests: result.requests.total,
          duration: result.duration,
          rps: Math.round(result.requests.average),
          latency: {
            avg: result.latency.mean,
            p50: result.latency.p50,
            p95: result.latency.p95,
            p99: result.latency.p99,
          },
          throughput: Math.round(result.throughput.average),
          errors: result.errors,
          timeouts: result.timeouts,
          non2xx: result.non2xx,
        };
        
        results.push(summary);
        
        console.log(chalk.green(`✅ Completed: ${route}`));
        console.log(chalk.white(`   Requests: ${summary.requests} (${summary.rps} req/sec)`));
        console.log(chalk.white(`   Latency: avg=${summary.latency.avg}ms, p95=${summary.latency.p95}ms`));
        console.log(chalk.white(`   Errors: ${summary.errors}, Timeouts: ${summary.timeouts}, Non-2xx: ${summary.non2xx}`));
        
        if (summary.errors > 0 || summary.timeouts > 0) {
          console.log(chalk.red(`   ⚠️  Warning: Detected ${summary.errors} errors and ${summary.timeouts} timeouts`));
        }
        
        resolve(summary);
      }
    });

    // Progress tracking
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function runAllTests() {
  console.log(chalk.blue.bold(`\n🚀 Starting load tests on ${API_ROUTES.length} routes...\n`));
  
  for (const route of API_ROUTES) {
    await runTest(route);
    // Small delay between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n\n📈 LOAD TEST SUMMARY'));
  console.log(chalk.blue('═'.repeat(80)));
  
  results.forEach((result, idx) => {
    console.log(chalk.white(`\n${idx + 1}. ${result.route}`));
    console.log(chalk.white(`   Total Requests: ${result.requests}`));
    console.log(chalk.white(`   Avg RPS: ${result.rps}`));
    console.log(chalk.white(`   Avg Latency: ${result.latency.avg}ms`));
    console.log(chalk.white(`   P95 Latency: ${result.latency.p95}ms`));
    console.log(chalk.white(`   P99 Latency: ${result.latency.p99}ms`));
    
    if (result.errors > 0 || result.timeouts > 0 || result.non2xx > 0) {
      console.log(chalk.red(`   ❌ Issues: ${result.errors} errors, ${result.timeouts} timeouts, ${result.non2xx} non-2xx`));
    } else {
      console.log(chalk.green(`   ✅ No errors detected`));
    }
  });
  
  // Overall statistics
  const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
  const avgRPS = Math.round(results.reduce((sum, r) => sum + r.rps, 0) / results.length);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const totalTimeouts = results.reduce((sum, r) => sum + r.timeouts, 0);
  
  console.log(chalk.blue('\n' + '═'.repeat(80)));
  console.log(chalk.yellow.bold('\n📊 OVERALL STATISTICS'));
  console.log(chalk.white(`   Total Requests Sent: ${totalRequests}`));
  console.log(chalk.white(`   Average RPS: ${avgRPS}`));
  console.log(chalk.white(`   Total Errors: ${totalErrors}`));
  console.log(chalk.white(`   Total Timeouts: ${totalTimeouts}`));
  
  if (totalErrors === 0 && totalTimeouts === 0) {
    console.log(chalk.green.bold('\n✅ All tests passed! Application is resilient to this load level.'));
  } else {
    console.log(chalk.red.bold('\n⚠️  Warning: Application showed signs of stress. Consider implementing rate limiting.'));
  }
  
  console.log(chalk.blue('\n' + '═'.repeat(80) + '\n'));
}

// Run tests
runAllTests().catch(err => {
  console.error(chalk.red.bold('\n❌ Fatal Error:'), err);
  process.exit(1);
});
