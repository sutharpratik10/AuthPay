"use client"

import { useEffect } from "react";

interface ForceRedirectProps {
  userId: string;
  redirectTo?: string;
}

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4">
          <div className="h-12 w-12 border-t-2 border-red-500 animate-spin rounded-full mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Invalid</h2>
        <p className="text-gray-600 mb-4">
          Your account was not found. Redirecting to login...
        </p>
        <div className="text-sm text-gray-500">
          If you&apos;re not redirected automatically, 
          <a href="/auth/login" className="text-blue-600 hover:underline ml-1">
            click here
          </a>
        </div>
      </div>
    </div>
  );
}