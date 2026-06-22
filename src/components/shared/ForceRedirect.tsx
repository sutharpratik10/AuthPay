"use client"

import { useEffect } from "react";

interface ForceRedirectProps {
  userId: string;
  redirectTo?: string;
}

import Loading from '@/components/Loading'

export function ForceRedirect({ userId, redirectTo = '/auth/login' }: ForceRedirectProps) {
  useEffect(() => {
    const forceLogout = async () => {
      try {
        console.log('[FORCE_REDIRECT] Forcing logout for user:', userId);
        
        // Call force logout API
        await fetch('/api/auth/force-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        
        // Clear all browser storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          });
          
          // Force redirect with page reload
          window.location.replace(redirectTo);
        }
      } catch (error) {
        console.error('[FORCE_REDIRECT] Error during force logout:', error);
        // Force redirect anyway
        if (typeof window !== 'undefined') {
          window.location.replace(redirectTo);
        }
      }
    };

    forceLogout();
  }, [userId, redirectTo]);

  return <Loading text="Account invalid. Redirecting..." />;
}