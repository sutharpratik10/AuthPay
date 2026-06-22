"use client"

import { ReactNode } from "react"
import Loading from '@/components/Loading';
import { useUserValidation } from "@/contexts/UserValidationContext"
import { ForceRedirect } from "@/components/shared/ForceRedirect"

export interface ProtectedRouteProps {
  children: ReactNode
  redirectPath?: string
}

/**
 * A lightweight component for protected routes
 * 
 * NOTE: Authentication is already handled server-side in page components via auth()
 * This component only handles:
 * 1. User validation (checking if user account still exists)
 * 2. Force sign-out for deleted accounts
 * 
 * This eliminates redundant client-side auth checks that were causing
 * duplicate /api/auth/session calls
 */
export function ProtectedRoute({
  children
}: ProtectedRouteProps) {
  const { exists, isLoading: validationLoading, shouldSignOut } = useUserValidation()

  // Only show loading during user validation (not auth - that's done server-side)
  // Use a brief delay or skip loading entirely since server already validated
  if (validationLoading) {
    return <Loading text="Validating account..." />
  }

  // Show force redirect component for invalid users (deleted accounts)
  // The global UserValidationProvider will handle the actual sign-out
  if (!validationLoading && shouldSignOut && !exists) {
    return <ForceRedirect userId="unknown" />;
  }

  // Server already authenticated, validation passed - render children
  return <>{children}</>
}