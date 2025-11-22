/**
 * Next.js Instrumentation
 * 
 * This file runs when the Next.js server starts up.
 * It's the perfect place to initialize caches and services.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Next.js] Instrumentation hook triggered');
    
    // Initialize New Relic APM monitoring
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      console.log('[New Relic] Loading APM agent...');
      await import('newrelic');
      console.log('[New Relic] ✅ APM monitoring initialized successfully');
      console.log('[New Relic] App Name:', process.env.NEW_RELIC_APP_NAME || 'Auth-Pay');
      console.log('[New Relic] Dashboard: https://one.newrelic.com/');
    } else {
      console.log('[New Relic] ⚠️  Skipped - NEW_RELIC_LICENSE_KEY not set');
    }
    
    // Initialize server-side caches and services
    const { initializeServer } = await import('@/lib/utils/initialize-server');
    await initializeServer();
  }
}
