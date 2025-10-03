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
    
    // Initialize server-side caches and services
    const { initializeServer } = await import('@/lib/initialize-server');
    await initializeServer();
  }
}
