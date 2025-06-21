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
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // If no specific redirect path is provided, create one with returnTo parameter
      const redirectUrl = redirectPath || getLoginRedirectUrl(pathname)
      router.push(redirectUrl)
    }
  }, [isAuthenticated, loading, router, redirectPath, pathname])
  
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
  
  // If not authenticated, render nothing (redirect happens in useEffect)
  if (!isAuthenticated) {
    return null
  }
  
  // If authenticated, render children
  return <>{children}</>
}
