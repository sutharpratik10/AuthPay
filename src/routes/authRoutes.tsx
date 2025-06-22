"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  redirectPath = ROUTES.PROTECTED.DASHBOARD
}: AuthRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  
  // Use useEffect to handle redirection instead of doing it during render
  useEffect(() => {
    // Only redirect if authentication state is confirmed (not loading)
    // and the user is authenticated and we want to redirect
    if (!loading && isAuthenticated && redirectIfAuthenticated) {
      router.push(redirectPath)
    }
  }, [loading, isAuthenticated, redirectIfAuthenticated, redirectPath, router])
  
  // Show nothing while loading or when authenticated and should redirect
  if (loading || (isAuthenticated && redirectIfAuthenticated)) {
    return null
  }
  
  // Otherwise, render the auth page content
  return <>{children}</>
}
