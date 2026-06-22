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
      let provider: string | null = null;
      
      // Common OAuth providers
      const providers = ['google', 'github', 'facebook', 'azure-ad', 'apple'];
      for (const p of providers) {
        if (currentUrl.includes(p) || currentUrl.includes(p.replace('-', ''))) {
          provider = p;
          break;
        }
      }

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Tracking OAuth session:', {
          provider,
          userId: session?.user?.id,
          email: session?.user?.email,
          url: currentUrl
        });
      }

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
        if (process.env.NODE_ENV === 'development') {
          console.log('OAuth session tracking result:', result);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to track OAuth session:', response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error tracking OAuth session:', error);
      }
    }
  }, [session?.user?.id, session?.user?.email]);

  useEffect(() => {
    // Only track once per session and only for authenticated users
    if (
      status === 'authenticated' && 
      session?.user?.id && 
      !hasTrackedRef.current
    ) {
      // Check if this is an OAuth callback by looking for provider in URL
      const currentUrl = window.location.href;
      const providers = ['google', 'github', 'facebook', 'azure-ad', 'apple'];
      const isOAuth = providers.some(p => 
        currentUrl.includes(p) || currentUrl.includes(p.replace('-', ''))
      );
      
      // Only track if this is actually an OAuth login
      if (isOAuth) {
        const error = searchParams?.get('error');
        
        // If there's no error and we have a session, track it
        if (!error) {
          // Add a small delay to allow the main login session to be created first
          // This prevents race condition with credentials login
          setTimeout(() => {
            trackOAuthSession();
          }, 100);
          hasTrackedRef.current = true;
        }
      }
    }
  }, [status, session, searchParams, trackOAuthSession]);

  return {
    isTracking: status === 'loading' || (status === 'authenticated' && !hasTrackedRef.current),
    hasTracked: hasTrackedRef.current,
  };
}
