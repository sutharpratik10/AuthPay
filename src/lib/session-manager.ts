import { SessionService } from '@/services/session';

/**
 * Initialize session management system
 * Call this when your application starts
 */
export function initializeSessionManagement(): void {
  console.log('🔧 Initializing session management system...');
  
  try {
    // Start automatic session cleanup
    SessionService.startAutomaticCleanup(1); // Run every hour
    
    console.log('✅ Session management system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize session management:', error);
  }
}

/**
 * Graceful shutdown cleanup
 * Call this when your application is shutting down
 */
export async function shutdownSessionManagement(): Promise<void> {
  console.log('🔧 Shutting down session management system...');
  
  try {
    // Perform final cleanup
    const cleanupResult = await SessionService.cleanupExpiredSessions();
    console.log(`✅ Final cleanup completed: ${cleanupResult.deletedCount} sessions removed`);
  } catch (error) {
    console.error('❌ Error during session management shutdown:', error);
  }
}
