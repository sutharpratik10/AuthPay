"use client"

import { ReactNode, useEffect } from "react"
import Loading from "@/components/Loading"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"

export interface AuthRouteProps {
  children: ReactNode
  redirectIfAuthenticated?: boolean
  redirectPath?: string
}

/**
 * Helper function to get the correct dashboard URL based on user's policies
 * This calls the API to get the policy-based dashboard
 */
export function getRoleDashboard(): string {
  // Return default path - actual routing is handled server-side
  return ROUTE_POLICIES.USER_DASHBOARD.path;
}

/**
 * A component for auth pages (login, signup, forgot-password)
 * Can optionally redirect authenticated users elsewhere
 * @param children - The components/content to render
 * @param redirectIfAuthenticated - Whether to redirect authenticated users
 * @param redirectPath - Where to redirect authenticated users (defaults to role-based dashboard)
 */
export function AuthRoute({ 
  children, 
  redirectIfAuthenticated = true,
  redirectPath,
}: AuthRouteProps) {
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Use useEffect to handle redirection instead of doing it during render
  useEffect(() => {
    async function handleAuthRedirect() {
      // Only redirect if authentication state is confirmed (not loading)
      // and the user is authenticated and we want to redirect
      if (!loading && isAuthenticated && redirectIfAuthenticated) {
        // Special case: Allow authenticated but unverified users to stay on verify page
        if (!isEmailVerified && pathname === ROUTE_POLICIES.AUTH_VERIFY.path) {
          console.log('[AUTH_ROUTE] Allowing unverified user to stay on verify page')
          return
        }
        
        // For verified users, redirect to dashboard
        if (isEmailVerified) {
          try {
            // Fetch user's dashboard URL from API
            const response = await fetch('/api/rbac/user/dashboard');
            const data = await response.json();
            
            const targetPath = redirectPath || data.dashboardUrl || ROUTE_POLICIES.USER_DASHBOARD.path;
            console.log('[AUTH_ROUTE] Redirecting verified user to dashboard:', targetPath)
            router.push(targetPath)
            return
          } catch (error) {
            console.error('Error fetching dashboard URL:', error);
            // Fallback to user dashboard
            router.push(ROUTE_POLICIES.USER_DASHBOARD.path);
          }
        }
        
        // For unverified users on other auth pages, redirect to verify
        if (isAuthenticated && !isEmailVerified) {
          console.log('[AUTH_ROUTE] Redirecting unverified user to verify')
          router.push(ROUTE_POLICIES.AUTH_VERIFY.path)
          return
        }
      }
    }
    
    handleAuthRedirect()
  }, [loading, isAuthenticated, isEmailVerified, redirectIfAuthenticated, redirectPath, router, pathname, user])
  
  // Show loading while checking authentication
  if (loading) {
    return <Loading text="Loading..." />
  }
  
  // If authenticated and verified, and should redirect, show loading while redirect happens
  if (isAuthenticated && isEmailVerified && redirectIfAuthenticated) {
    return <Loading text="Redirecting to dashboard..." />
  }
  
  // Otherwise, render the auth page content
  return <>{children}</>
}
