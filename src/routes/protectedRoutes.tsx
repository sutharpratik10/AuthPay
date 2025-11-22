"use client"

import { ReactNode, useMemo } from "react"
import Loading from '@/components/Loading';
import { useAuth } from "@/contexts/auth-context"
import { useUserValidation } from "@/contexts/UserValidationContext"
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
 * A component that protects routes by checking authentication status
 * Now uses centralized UserValidationContext for validation
 */
export function ProtectedRoute({
  children
}: ProtectedRouteProps) {
  const { loading, user } = useAuth()
  const { exists, isLoading: validationLoading, shouldSignOut } = useUserValidation()

  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    isAuthenticated: !!user,
    isEmailVerified: !!(user as ExtendedUser)?.isEmailVerified,
    loading,
    user
  }), [user, loading]);

  // Show loading during initial authentication check or user validation
  if (authState.loading || validationLoading) {
    return <Loading text={authState.loading ? 'Loading...' : 'Validating account...'} />
  }

  // Show force redirect component for invalid users (deleted accounts)
  // The global UserValidationProvider will handle the actual sign-out
  if (!authState.loading && !validationLoading && authState.user?.id && shouldSignOut && !exists) {
    return <ForceRedirect userId={authState.user.id} />;
  }

  // If middleware allowed us to reach here and validation passed, render children
  return <>{children}</>
}