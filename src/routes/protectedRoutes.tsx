"use client"

import { ReactNode, useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ForceRedirect } from "@/components/ForceRedirect"

export interface ProtectedRouteProps {
  children: ReactNode
  redirectPath?: string
}

/**
 * Validate user exists in database
 */
async function validateUserInDatabase(userId: string): Promise<{ exists: boolean; shouldSignOut: boolean }> {
  try {
    const response = await fetch('/api/auth/validate-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { exists: false, shouldSignOut: true };
    }
    
    const data = await response.json();
    return { 
      exists: data.exists === true, 
      shouldSignOut: data.shouldSignOut === true 
    };
  } catch (error) {
    console.error('[PROTECTED_ROUTE] Error validating user:', error);
    return { exists: false, shouldSignOut: true };
  }
}

/**
 * A component that protects routes by checking authentication status
 * Enhanced with database validation to handle deleted users
 */
export function ProtectedRoute({ 
  children
}: ProtectedRouteProps) {
  const { isAuthenticated, isEmailVerified, loading, user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userValidated, setUserValidated] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    isAuthenticated,
    isEmailVerified,
    loading,
    user
  }), [isAuthenticated, isEmailVerified, loading, user]);

  // Validate user exists in database when authenticated
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    async function checkUserInDatabase() {
      if (authState.isAuthenticated && authState.user?.id && !authState.loading) {
        console.log('[PROTECTED_ROUTE] Validating user in database...');
        
        try {
          const { exists, shouldSignOut } = await validateUserInDatabase(authState.user.id);
          
          if (!isMounted) return; // Component unmounted, don't update state
          
          if (!exists) {
            console.log('[PROTECTED_ROUTE] User not found in database, clearing auth');
            setValidationError('Your account was not found. Please sign in again.');
            setUserValidated(false);
            
            if (shouldSignOut && signOut) {
              try {
                await signOut();
              } catch (error) {
                console.error('[PROTECTED_ROUTE] Error signing out:', error);
              }
            }
            
            // Force reload to clear any cached state
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return;
          }
          
          setUserValidated(true);
          setValidationError(null);
          console.log('[PROTECTED_ROUTE] User validation successful');
        } catch (error) {
          if (!isMounted) return;
          
          console.error('[PROTECTED_ROUTE] User validation failed:', error);
          setValidationError('Unable to verify your account. Please try again.');
          setUserValidated(false);
        }
      } else if (!authState.isAuthenticated && !authState.loading) {
        if (isMounted) {
          setUserValidated(false);
        }
      }
    }

    // Add a small delay to prevent immediate validation loops
    const timeoutId = setTimeout(checkUserInDatabase, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [authState.isAuthenticated, authState.user?.id, authState.loading, signOut]);

  useEffect(() => {
    // Only process redirects when loading is complete and user is validated
    // Add extra check to prevent loops
    if (!authState.loading && userValidated !== null && !validationError) {
      if (!authState.isAuthenticated || userValidated === false) {
        console.log('[PROTECTED_ROUTE] Redirecting unauthenticated or invalid user to login')
        
        // Use window.location for hard redirect to break any loops
        if (typeof window !== 'undefined' && pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        return
      }

      // Prevent redirect loop: don't redirect to verify if already there
      if (!authState.isEmailVerified && pathname !== '/auth/verify') {
        console.log('[PROTECTED_ROUTE] Redirecting unverified user to verify')
        router.replace('/auth/verify')
        return
      }
    }
  }, [authState.isAuthenticated, authState.isEmailVerified, authState.loading, userValidated, validationError, router, pathname])

  // Show loading state if still checking authentication or validating user
  if (authState.loading || (authState.isAuthenticated && userValidated === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {authState.loading ? 'Loading...' : 'Validating account...'}
          </p>
        </div>
      </div>
    )
  }

  // Show force redirect component for invalid users
  if (!authState.loading && userValidated === false && authState.user?.id) {
    return <ForceRedirect userId={authState.user.id} />;
  }

  // If not authenticated or user validation failed, show loading while redirect happens
  if (!authState.isAuthenticated || userValidated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If email not verified and NOT on verify page, show loading while redirect happens
  if (!authState.isEmailVerified && pathname !== '/auth/verify') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p>Redirecting to verification...</p>
        </div>
      </div>
    )
  }
  
  // If authenticated, email verified, and user validated, render children
  return <>{children}</>
}