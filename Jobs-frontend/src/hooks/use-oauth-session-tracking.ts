'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Hook to track OAuth sessions on the client-side.
 * This ensures we capture the proper IP address and user agent for OAuth logins.
 */
export function useOAuthSessionTracking() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const hasTrackedRef = useRef(false);

  const trackOAuthSession = useCallback(async () => {
    try {
      // Detect OAuth provider from URL or session
      const currentUrl = window.location.href;
      let provider = null;
      
      // Common OAuth providers
      const providers = ['google', 'github', 'facebook', 'azure-ad', 'apple'];
      for (const p of providers) {
        if (currentUrl.includes(p) || currentUrl.includes(p.replace('-', ''))) {
          provider = p;
          break;
        }
      }

      console.log('Tracking OAuth session:', {
        provider,
        userId: session?.user?.id,
        email: session?.user?.email,
        url: currentUrl
      });

      const response = await fetch('/api/auth/track-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          skipIfExists: true, // Don't create duplicate sessions
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('OAuth session tracking result:', result);
      } else {
        console.warn('Failed to track OAuth session:', response.status);
      }
    } catch (error) {
      console.error('Error tracking OAuth session:', error);
    }
  }, [session?.user?.id, session?.user?.email]);

  useEffect(() => {
    // Only track once per session and only for authenticated users
    if (
      status === 'authenticated' && 
      session?.user?.id && 
      !hasTrackedRef.current
    ) {
      // Check if this is an OAuth callback
      const error = searchParams?.get('error');
      
      // If there's no error and we have a session, this might be an OAuth login
      if (!error) {
        trackOAuthSession();
        hasTrackedRef.current = true;
      }
    }
  }, [status, session, searchParams, trackOAuthSession]);

  return {
    isTracking: status === 'loading' || (status === 'authenticated' && !hasTrackedRef.current),
    hasTracked: hasTrackedRef.current,
  };
}
