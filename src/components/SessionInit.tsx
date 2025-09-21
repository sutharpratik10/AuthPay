/**
 * Session Management Initialization Script
 * Add this to your Next.js app startup (layout.tsx or _app.tsx)
 */

import { useEffect } from 'react';

// Initialize session management on server-side only
if (typeof window === 'undefined') {
  // Import and initialize only on server-side
  import('@/lib/session-manager').then((module) => {
    module.initializeSessionManagement();
  }).catch((error) => {
    console.error('Failed to initialize session management:', error);
  });
}

export default function SessionInit() {
  useEffect(() => {
    // Client-side initialization if needed
    console.log('Session management initialized');
  }, []);

  return null; // This component doesn't render anything
}
