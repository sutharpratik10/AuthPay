"use client"

import { ReactNode, useEffect, useMemo, useState } from "react"
import Loading from '@/components/Loading';
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ForceRedirect } from "@/components/shared/ForceRedirect"

// Extended user interface with our custom properties
interface ExtendedUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isEmailVerified?: boolean;
  role?: string;
}

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
  const { loading, user, logout } = useAuth()
  const pathname = usePathname()
  const [userValidated, setUserValidated] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    isAuthenticated: !!user,
    isEmailVerified: !!(user as ExtendedUser)?.isEmailVerified,
    loading,
    user
  }), [user, loading]);

  // Validate user exists in database when authenticated - run only once per session
  useEffect(() => {
    let isMounted = true;
    let isValidating = false;
    
    async function checkUserInDatabase() {
      // Prevent concurrent validations
      if (isValidating) {
        return;
      }
      
      // Skip validation if user is on verify page
      if (pathname === '/auth/verify') {
        if (isMounted && userValidated === null) {
          setUserValidated(true); // Assume valid on verify page
        }
        return;
      }
      
      // Only validate once per session, not on every render
      if (
        authState.isAuthenticated && 
        authState.user?.id && 
        !authState.loading &&
        userValidated === null // Only run if we haven't validated yet
      ) {
        isValidating = true;
        
        try {
          const { exists, shouldSignOut } = await validateUserInDatabase(authState.user.id);
          
          if (!isMounted) return;
          
          if (!exists) {
            setValidationError('Your account was not found. Please sign in again.');
            setUserValidated(false);
            
            if (shouldSignOut && logout) {
              try {
                await logout();
              } catch (error) {
                console.error('[PROTECTED_ROUTE] Error signing out:', error);
              }
            }
            
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return;
          }
          
          setUserValidated(true);
          setValidationError(null);
        } catch (error) {
          if (!isMounted) return;
          console.error('[PROTECTED_ROUTE] User validation failed:', error);
          setValidationError('Unable to verify your account. Please try again.');
          setUserValidated(false);
        } finally {
          isValidating = false;
        }
      } else if (!authState.isAuthenticated && !authState.loading) {
        if (isMounted) {
          setUserValidated(false);
        }
      }
    }

    checkUserInDatabase();
    
    return () => {
      isMounted = false;
    };
  }, [authState.isAuthenticated, authState.user?.id, authState.loading, logout, userValidated, pathname]);

  // Show loading only during initial authentication check or database validation
  if (authState.loading || (authState.isAuthenticated && userValidated === null)) {
    return <Loading text={authState.loading ? 'Loading...' : 'Validating account...'} />
  }

  // Show force redirect component for invalid users (deleted accounts)
  if (!authState.loading && userValidated === false && authState.user?.id && validationError) {
    return <ForceRedirect userId={authState.user.id} />;
  }

  // If middleware allowed us to reach here, trust it and render children
  return <>{children}</>
}