"use client"

import { useEffect, useState } from "react"
import Loading from '@/components/Loading'
import { useAuth } from "@/contexts/auth-context"
import EmailVerificationForm from "@/components/auth/EmailVerificationForm"

export default function VerifyPage() {
  const { isAuthenticated, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure we only run effects after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // No client-side redirect logic - middleware handles routing
  // If user is already verified, middleware will redirect them automatically

  // Show loading while checking authentication state
  if (!mounted || loading) {
    return <Loading text="Loading..." />
  }
  
  return (
    <div>
      <EmailVerificationForm 
        requiresAuth={isAuthenticated}
        title="Verify Your Email"
        description={
          isAuthenticated 
            ? "We've sent an 8-digit verification code to your email address. Please enter it below to verify your account."
            : "Enter the verification code we sent to your email address."
        }
      />
    </div>  
  )
}
