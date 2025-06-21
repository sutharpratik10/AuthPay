"use client"

import { ReactNode } from "react"
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
  
  // If user is already authenticated and we're on an auth page,
  // redirect them to the dashboard
  if (!loading && isAuthenticated && redirectIfAuthenticated) {
    router.push(redirectPath)
    return null
  }
  
  // Otherwise, render the auth page content
  return <>{children}</>
}
