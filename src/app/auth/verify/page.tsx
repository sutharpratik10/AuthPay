"use client"

import { useEffect, useRef, useState } from "react"
import Loading from '@/components/Loading'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"
import EmailVerificationForm from "@/components/auth/EmailVerificationForm"

export default function VerifyPage() {
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)

  // Ensure we only run effects after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch dashboard URL when user is authenticated
  useEffect(() => {
    async function fetchDashboard() {
      if (user?.id && isAuthenticated) {
        try {
          const response = await fetch('/api/rbac/user/dashboard');
          const data = await response.json();
          if (data.dashboardUrl) {
            setDashboardUrl(data.dashboardUrl);
          }
        } catch (error) {
          console.error('Error fetching dashboard URL:', error);
          setDashboardUrl(ROUTE_POLICIES.USER_DASHBOARD.path);
        }
      }
    }
    fetchDashboard();
  }, [user, isAuthenticated]);

  // Redirect if user is already verified - but only after mounting and with delay
  useEffect(() => {
    if (!mounted || loading || hasRedirected.current || !dashboardUrl) return

    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(() => {
      if (isAuthenticated && isEmailVerified && !hasRedirected.current) {
        hasRedirected.current = true
        console.log('[VERIFY PAGE] User is verified, redirecting to dashboard')
        router.push(dashboardUrl)
      }
    }, 500) // 500ms delay to allow auth state to stabilize

    return () => clearTimeout(timer)
  }, [mounted, isAuthenticated, isEmailVerified, loading, router, dashboardUrl])

  // Show loading while checking authentication state
  if (!mounted || loading) {
    return <Loading text="Loading..." />
  }

  // If user is verified but we haven't redirected yet, show loading
  if (isAuthenticated && isEmailVerified && !hasRedirected.current) {
    return <Loading text="Redirecting to dashboard..." />
  }
  
  return (
    <div>
      <EmailVerificationForm 
        requiresAuth={isAuthenticated}
        title="Verify Your Email"
        description={
          isAuthenticated 
            ? "We've sent a 6-digit verification code to your email address. Please enter it below to verify your account."
            : "Enter the verification code we sent to your email address."
        }
      />
    </div>  
  )
}
