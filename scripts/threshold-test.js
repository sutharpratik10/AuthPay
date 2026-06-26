const autocannon = require('autocannon');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const route = '/api/user/data';

async function runThresholdTest(connections, pipelining) {
  return new Promise((resolve) => {
    console.log(`\nTesting with ${connections} connections and ${pipelining} pipelining...`);
    const instance = autocannon({
      url: `${BASE_URL}${route}`,
      connections: connections,
      duration: 5, // short test
      pipelining: pipelining,
      method: 'GET',
    }, (err, result) => {
      if (err) {
        console.error(`Error: ${err.message}`);
        resolve({ error: true });
      } else {
        console.log(`Requests: ${result.requests.total}`);
        console.log(`Errors: ${result.errors}, Timeouts: ${result.timeouts}, Non-2xx: ${result.non2xx}`);
        resolve({
          errors: result.errors,
          timeouts: result.timeouts
        });
      }
    });
  });
}

async function main() {
  const thresholds = [
    { c: 50, p: 1 },
    { c: 100, p: 5 },
    { c: 200, p: 10 },
    { c: 300, p: 10 },
    { c: 500, p: 20 },
  ];

  for (const t of thresholds) {
    const res = await runThresholdTest(t.c, t.p);
    if (res.errors > 0 || res.timeouts > 0) {
      console.log(`\n❌ THRESHOLD REACHED AT: ${t.c} connections, ${t.p} pipelining.`);
      break;
    }
  }
}

main();
