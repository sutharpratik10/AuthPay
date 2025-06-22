"use client"

import { ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getLoginRedirectUrl } from "./routeUtils"

export interface ProtectedRouteProps {
  children: ReactNode
  redirectPath?: string
}

/**
 * A component that protects routes by checking authentication status
 * @param children - The components/content to render if authenticated
 * @param redirectPath - Where to redirect if not authenticated (defaults to /auth/login)
 */
export function ProtectedRoute({ 
  children, 
  redirectPath
}: ProtectedRouteProps) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // If no specific redirect path is provided, create one with returnTo parameter
        const redirectUrl = redirectPath || getLoginRedirectUrl(pathname)
        router.push(redirectUrl)
      } else if (!isEmailVerified) {
        // If authenticated but email not verified, redirect to verification page
        router.push("/auth/verify-request")
      }
    }
  }, [isAuthenticated, isEmailVerified, loading, router, redirectPath, pathname])
  
  // Show loading state if still checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }
    // If not authenticated or email not verified, render nothing (redirect happens in useEffect)
  if (!isAuthenticated || !isEmailVerified) {
    return null
  }
  
  // If authenticated and email verified, render children
  return <>{children}</>
}
