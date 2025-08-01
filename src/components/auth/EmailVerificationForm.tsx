"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"

interface EmailVerificationFormProps {
  /** Whether this form requires authentication (affects logout button and email input) */
  requiresAuth?: boolean
  /** Optional title override */
  title?: string
  /** Optional description override */
  description?: string
}

export default function EmailVerificationForm({ 
  requiresAuth = true,
  title = "Verify Your Email",
  description
}: EmailVerificationFormProps) {
  const { verifyEmail, resendVerificationEmail, logout, user, loading } = useAuth()
  const searchParams = useSearchParams()
  
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Auto-populate email based on context
  useEffect(() => {
    if (requiresAuth && user?.email) {
      // For authenticated users, use the email from session
      setEmail(user.email)
    } else {
      // For non-authenticated users, try to get email from URL params
      const emailFromUrl = searchParams.get("email")
      if (emailFromUrl) {
        setEmail(emailFromUrl)
      }
    }
  }, [requiresAuth, user?.email, searchParams])

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false)
    }
  }, [countdown, resendDisabled])

  const handleVerify = useCallback(async (verificationCode = code) => {
    if (!verificationCode) {
      return setError("Please enter your verification code")
    }

    if (requiresAuth && verificationCode.length !== 6) {
      return setError("Please enter a valid 6-digit verification code")
    }
    
    try {
      setIsSubmitting(true)
      setError("")
      setSuccess("")
      
      const result = await verifyEmail(verificationCode)
      
      if (result.success) {
        const successMessage = requiresAuth 
          ? "Email verified successfully! Redirecting to dashboard..."
          : "Email verified successfully. Redirecting to dashboard..."
        setSuccess(successMessage)
        // The auth context will handle the reload and session update
      } else {
        const errorMessage = requiresAuth
          ? "Verification failed. Please check your code and try again."
          : "Verification failed"
        setError(result.error || errorMessage)
      }
    } catch (err) {
      setError("An error occurred during verification")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }, [code, verifyEmail, requiresAuth])

  const handleResend = async () => {
    const emailToUse = requiresAuth ? user?.email : email

    if (!emailToUse) {
      const errorMessage = requiresAuth 
        ? "Email not found. Please sign in again."
        : "Email is required for resending verification code"
      return setError(errorMessage)
    }
    
    try {
      setError("")
      setSuccess("")
      setResendDisabled(true)
      setCountdown(60) // Disable resend for 60 seconds
      
      const result = await resendVerificationEmail(emailToUse)
      
      if (result.success) {
        setSuccess("Verification email sent successfully. Please check your inbox.")
      } else {
        setError(result.error || "Failed to resend verification email")
        setResendDisabled(false)
        setCountdown(0)
      }
    } catch (err) {
      setError("An error occurred while resending verification email")
      console.error(err)
      setResendDisabled(false)
      setCountdown(0)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isSubmitting) {
      handleVerify()
    }
  }

  // Default description based on context
  const defaultDescription = requiresAuth 
    ? "We've sent a 6-digit verification code to your email address. Please enter it below to verify your account."
    : "Enter the verification code we sent to your email address."

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white border-1 border-black dark:bg-neutral-900 dark:border-white rounded-xl shadow-sm">
        {/* Header with Lightning Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="#000" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:fill-white dark:stroke-white"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
            {description || defaultDescription}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <p>{success}</p>
          </div>
        )}

        {/* Verification Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor={requiresAuth ? "verification-code" : "code"} 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Verification Code
            </label>
            <Input
              id={requiresAuth ? "verification-code" : "code"}
              type="text"
              value={code}
              onChange={(e) => {
                if (requiresAuth) {
                  // For authenticated users, restrict to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                } else {
                  // For non-authenticated users, allow any input
                  setCode(e.target.value)
                }
              }}
              onKeyPress={requiresAuth ? handleKeyPress : undefined}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className={requiresAuth 
                ? "w-full text-center text-lg font-mono tracking-widest"
                : "w-full"
              }
              autoComplete="one-time-code"
              required
            />
          </div>
          
          <Button
            type="button"
            className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors"
            onClick={() => handleVerify()}
            disabled={isSubmitting || loading || !code || (requiresAuth && code.length !== 6)}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500 dark:bg-neutral-900 dark:text-gray-300">
                Need help?
              </span>
            </div>
          </div>
            <div className="space-y-3">
            {/* Additional help options can be added here */}

            <Button
              variant="outline"
              className="w-full border border-gray-300"
              onClick={handleResend}
              disabled={resendDisabled || loading || (!requiresAuth && !email)}
            >
              {resendDisabled 
                ? `Resend code (${countdown}s)` 
                : "Resend verification code"}
            </Button>

            {/* Sign Out button for authenticated users */}
            {requiresAuth && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={logout}
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
