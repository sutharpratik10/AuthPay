"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import EmailVerificationForm from "@/components/auth/EmailVerificationForm"

export default function VerifyPage() {
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  const router = useRouter()
    // Redirect if user is already verified
  useEffect(() => {
    if (!loading) {
      // If user is authenticated and already verified, redirect to dashboard
      if (isAuthenticated && isEmailVerified) {
        // Determine dashboard based on user role
        const userRole = (user as { role?: string })?.role || 'user';
        const dashboardUrl = userRole === 'admin' 
          ? '/protected/admin/dashboard' 
          : '/protected/user/dashboard';
        router.push(dashboardUrl)
        return
      }
      // Allow both authenticated and unauthenticated users to access verification
      // Unauthenticated users might be verifying after registration from another session
    }
  }, [isAuthenticated, isEmailVerified, loading, router, user])

  // Show loading while checking authentication state
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
