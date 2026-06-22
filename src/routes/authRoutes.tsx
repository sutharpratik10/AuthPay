"use client"

import { ReactNode } from "react"
import Loading from "@/components/Loading"
import { useAuth } from "@/contexts/auth-context"

export interface AuthRouteProps {
  children: ReactNode
  redirectIfAuthenticated?: boolean
  redirectPath?: string
}

/**
 * A component for auth pages (login, signup, forgot-password)
 * Middleware handles all authentication routing
 * This component just renders the content without client-side redirects
 * @param children - The components/content to render
 */
export function AuthRoute({ 
  children, 
}: AuthRouteProps) {
  const { loading } = useAuth()
  
  // Show loading only while initial session check is in progress
  if (loading) {
    return <Loading text="Loading..." />
  }
  
  // Render the auth page content
  // Middleware has already handled any necessary redirects
  return <>{children}</>
}
