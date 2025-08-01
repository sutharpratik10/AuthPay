"use client"

import { ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "./routeUtils"

export interface AuthRouteProps {
  children: ReactNode
  redirectIfAuthenticated?: boolean
  redirectPath?: string
}

/**
 * A component for auth pages (login, signup, forgot-password)
 * Can optionally redirect authenticated users elsewhere
 * @param children - The components/content to render
 * @param redirectIfAuthenticated - Whether to redirect authenticated users
 * @param redirectPath - Where to redirect authenticated users (defaults to /protected/dashboard)
 */
export function AuthRoute({ 
  children, 
  redirectIfAuthenticated = true,
  redirectPath = ROUTES.PROTECTED.DASHBOARD,
}: AuthRouteProps) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
    // Use useEffect to handle redirection instead of doing it during render
  useEffect(() => {
    // Only redirect if authentication state is confirmed (not loading)
    // and the user is authenticated and we want to redirect
    if (!loading && isAuthenticated && redirectIfAuthenticated) {
      // Special case: Allow authenticated but unverified users to stay on verify page
      if (!isEmailVerified && pathname === '/auth/verify') {
        console.log('[AUTH_ROUTE] Allowing unverified user to stay on verify page')
        return
      }
      
      // For verified users, redirect to dashboard
      if (isEmailVerified) {
        console.log('[AUTH_ROUTE] Redirecting verified user to dashboard')
        router.push(redirectPath)
        return
      }
      
      // For unverified users on other auth pages, redirect to verify
      if (isAuthenticated && !isEmailVerified) {
        console.log('[AUTH_ROUTE] Redirecting unverified user to verify')
        router.push('/auth/verify')
        return
      }
    }
  }, [loading, isAuthenticated, isEmailVerified, redirectIfAuthenticated, redirectPath, router, pathname])
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If authenticated and verified, and should redirect, show loading while redirect happens
  if (isAuthenticated && isEmailVerified && redirectIfAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }
  
  // Otherwise, render the auth page content
  return <>{children}</>
}
