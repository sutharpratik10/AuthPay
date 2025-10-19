/**
 * Server Initialization Script
 * 
 * This script should run when the server starts to:
 * - Preload frequently accessed data into cache
 * - Verify database connections
 * - Initialize background services
 * 
 * Usage:
 * - For Next.js 15+: Use instrumentation.ts
 * - For older versions: Call from layout.tsx or API initialization
 */

import { preloadAllCaches } from '@/lib/cache/query-cache';
import { db } from '@/server/db';

let isInitialized = false;

/**
 * Initialize server-side caches and services
 * This should run once on server startup
 */
export async function initializeServer() {
  if (isInitialized) {
    console.log('[Init] Server already initialized, skipping...');
    return;
  }

  console.log('[Init] Starting server initialization...');
  const startTime = Date.now();

  try {
    // 1. Verify database connection
    await verifyDatabaseConnection();

    // 2. Preload query caches
    await preloadAllCaches();

    // 3. Any other initialization tasks...
    // await initializeEmailQueue();
    // await loadConfiguration();

    isInitialized = true;
    const duration = Date.now() - startTime;
    console.log(`[Init] ✅ Server initialization complete (${duration}ms)`);
  } catch (error) {
    console.error('[Init] ❌ Server initialization failed:', error);
    // Don't block server startup on cache failures
    isInitialized = true;
  }
}

/**
 * Verify database connection is working
 */
async function verifyDatabaseConnection(): Promise<void> {
  try {
    // Simple query to verify connection
    await db.execute('SELECT 1');
    console.log('[Init] ✅ Database connection verified');
  } catch (error) {
    console.error('[Init] ❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * For Next.js 15+ with instrumentation.ts
 * Place this in: instrumentation.ts (root of project)
 * 
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === 'nodejs') {
 *     const { initializeServer } = await import('@/lib/utils/initialize-server');
 *     await initializeServer();
 *   }
 * }
 */

// For older Next.js versions or immediate initialization
if (typeof window === 'undefined') {
  // Server-side only
  initializeServer().catch(console.error);
}
