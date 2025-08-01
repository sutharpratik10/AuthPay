"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Shield, ArrowLeft } from "lucide-react"

export default function TwoFactorVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const tempToken = searchParams.get('token') // Temporary token from initial login
  
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Redirect if no email or token
  useEffect(() => {
    if (!email || !tempToken) {
      router.push('/auth/login')
    }
  }, [email, tempToken, router])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    
    if (!otp || otp.length !== 6) {
      return setError("Please enter a valid 6-digit code")
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          tempToken
        }),
      })

      const data = await response.json();      if (!response.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      // Successful 2FA verification - now sign in with the verified credentials
      if (data.credentials) {
        const signInResult = await signIn("credentials", {
          email: data.credentials.email,
          password: data.credentials.password,
          skipPasswordCheck: data.credentials.skipPasswordCheck,
          redirect: false,
        });

        if (signInResult?.error) {
          setError('Failed to complete authentication after verification')
          return
        }

        // Authentication successful - redirect to dashboard
        router.push('/protected/dashboard')
      } else {
        setError('Invalid response from server')
      }
      
    } catch (err) {
      setError('An error occurred during verification')
      console.error('2FA verification error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || countdown > 0) return
    
    try {
      setCountdown(60) // Start 60 second countdown
      setError("")
      
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({ email, tempToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(data.error || 'Failed to resend code')
        setCountdown(0)
      }
    } catch (err) {
      setError('Failed to resend code')
      setCountdown(0)
      console.error('Resend 2FA error:', err)
    }
  }

  const handleBackToLogin = () => {
    router.push('/auth/login')
  }

  if (!email || !tempToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-primary animate-spin rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 text-center mt-2">
              Enter the 6-digit code sent to your email address to complete login
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {email}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {/* 2FA Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || otp.length !== 6}
            >
              {isSubmitting ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>

          {/* Resend and Back options */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={countdown > 0}
            >
              {countdown > 0 
                ? `Resend code (${countdown}s)` 
                : "Resend verification code"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
