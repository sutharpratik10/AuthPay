"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import EmailVerificationForm from "@/components/auth/EmailVerificationForm"

export default function VerifyPage() {
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we only run effects after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if user is already verified - but only after mounting and with delay
  useEffect(() => {
    if (!mounted || loading || hasRedirected.current) return

    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(() => {
      if (isAuthenticated && isEmailVerified && !hasRedirected.current) {
        hasRedirected.current = true
        console.log('[VERIFY PAGE] User is verified, redirecting to dashboard')
        
        // Determine dashboard based on user role
        const userRole = (user as { role?: string })?.role || 'user';
        const dashboardUrl = userRole === 'admin' 
          ? '/protected/admin/dashboard' 
          : '/protected/user/dashboard';
        
        router.push(dashboardUrl)
      }
    }, 500) // 500ms delay to allow auth state to stabilize

    return () => clearTimeout(timer)
  }, [mounted, isAuthenticated, isEmailVerified, loading, router, user])

  // Show loading while checking authentication state
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // If user is verified but we haven't redirected yet, show loading
  if (isAuthenticated && isEmailVerified && !hasRedirected.current) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    )
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
