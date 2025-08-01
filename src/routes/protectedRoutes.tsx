"use client"

import { ReactNode, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export interface ProtectedRouteProps {
  children: ReactNode
  redirectPath?: string
}

/**
 * A component that protects routes by checking authentication status
 * Since middleware isn't working properly in Next.js 15, we handle redirects here
 */
export function ProtectedRoute({ 
  children
}: ProtectedRouteProps) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    isAuthenticated,
    isEmailVerified,
    loading
  }), [isAuthenticated, isEmailVerified, loading]);

  useEffect(() => {
    // Only process redirects when loading is complete
    if (!authState.loading) {
      if (!authState.isAuthenticated) {
        console.log('[PROTECTED_ROUTE] Redirecting unauthenticated user to login')
        router.replace('/auth/login')
        return
      }

      // Prevent redirect loop: don't redirect to verify if already there
      if (!authState.isEmailVerified && pathname !== '/auth/verify') {
        console.log('[PROTECTED_ROUTE] Redirecting unverified user to verify')
        router.replace('/auth/verify')
        return
      }
    }
  }, [authState.isAuthenticated, authState.isEmailVerified, authState.loading, router, pathname])
  // Show loading state if still checking authentication
  if (authState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show loading while redirect happens
  if (!authState.isAuthenticated) {
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
  
  // If authenticated and email verified, render children
  // OR if on verify page (let the page handle verification flow)
  return <>{children}</>
}
