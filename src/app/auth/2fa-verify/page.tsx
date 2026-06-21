"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import Loading from '@/components/Loading'
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Shield, ArrowLeft, Smartphone, Mail, KeyRound } from "lucide-react"

function TwoFactorVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const tempToken = searchParams.get('token') // Temporary token from initial login
  const method = searchParams.get('method') || 'email' // 'app' or 'email'
  
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  
  // Prevent duplicate OTP submissions
  const lastSubmittedOtp = useRef<string>("")

  const [currentStep, setCurrentStep] = useState<'email' | 'app'>(method === 'app' ? 'app' : 'email')
  const isAppMethod = currentStep === 'app'

  // Redirect if no email or token
  useEffect(() => {
    if (!email || !tempToken) {
      router.push('/auth/login')
    }
  }, [email, tempToken, router])

  // Countdown timer for resend (only for email method)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setWarning("")
    
    const codeLength = useRecoveryCode ? 9 : 6 // Recovery codes are XXXX-XXXX (9 chars with dash)
    
    if (!otp || (!useRecoveryCode && otp.length !== 6)) {
      return setError(useRecoveryCode 
        ? "Please enter a valid recovery code" 
        : "Please enter a valid 6-digit code"
      )
    }
    
    // Prevent duplicate submission of the same OTP
    if (lastSubmittedOtp.current === otp) {
      return setError("This code has already been submitted. Please request a new code if needed.")
    }
    
    try {
      setIsSubmitting(true)
      lastSubmittedOtp.current = otp

      if (isAppMethod) {
        // TOTP / Recovery Code verification
        const response = await fetch('/api/auth/totp/verify-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            token: otp,
            tempToken,
            isRecoveryCode: useRecoveryCode,
          }),
        })

        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || 'Verification failed')
          return
        }

        // Show warning about remaining recovery codes if present
        if (data.warning) {
          setWarning(data.warning)
        }

        // Successful verification — sign in
        if (data.credentials) {
          const signInResult = await signIn("credentials", {
            email: data.credentials.email,
            password: data.credentials.password,
            skipPasswordCheck: data.credentials.skipPasswordCheck,
            redirect: false,
          })

          if (signInResult?.error) {
            setError('Failed to complete authentication after verification')
            return
          }

          router.push('/protected')
        } else {
          setError('Invalid response from server')
        }
      } else {
        // Email OTP verification (existing flow)
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

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Verification failed')
          return
        }

        if (data.requiresApp2FA) {
          // Email verified successfully, now transition to the App code step
          setCurrentStep('app')
          setOtp('')
          lastSubmittedOtp.current = ''
          return
        }

        if (data.credentials) {
          const signInResult = await signIn("credentials", {
            email: data.credentials.email,
            password: data.credentials.password,
            skipPasswordCheck: data.credentials.skipPasswordCheck,
            redirect: false,
          })

          if (signInResult?.error) {
            setError('Failed to complete authentication after verification')
            return
          }

          router.push('/protected')
        } else {
          setError('Invalid response from server')
        }
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

  const toggleRecoveryCode = () => {
    setUseRecoveryCode(!useRecoveryCode)
    setOtp("")
    setError("")
    setWarning("")
    lastSubmittedOtp.current = ""
  }

  if (!email || !tempToken) {
    return <Loading text="Redirecting..." />
  }

  // Determine UI text based on method and recovery code mode
  const getTitle = () => {
    if (useRecoveryCode) return "Enter Recovery Code"
    if (isAppMethod) return "Enter Authenticator Code"
    return "Two-Factor Authentication"
  }

  const getDescription = () => {
    if (useRecoveryCode) return "Enter one of your backup recovery codes to complete login"
    if (isAppMethod) return "Enter the 6-digit code from your authenticator app"
    return "Enter the 6-digit code sent to your email address to complete login"
  }

  const getIcon = () => {
    if (useRecoveryCode) return <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
    if (isAppMethod) return <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    return <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
  }

  const getIconBg = () => {
    if (useRecoveryCode) return "bg-amber-100 dark:bg-amber-900"
    return "bg-blue-100 dark:bg-blue-900"
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className={`${getIconBg()} p-3 rounded-full mb-3`}>
              {getIcon()}
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 text-center mt-2">
              {getDescription()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {email}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Warning Message (for recovery codes) */}
          {warning && (
            <div className="mb-4 p-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <p>{warning}</p>
            </div>
          )}

          {/* 2FA Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {useRecoveryCode ? "Recovery Code" : "Verification Code"}
              </label>
              {useRecoveryCode ? (
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9))}
                  placeholder="XXXX-XXXX"
                  className="w-full text-center text-lg tracking-widest font-mono"
                  maxLength={9}
                  autoComplete="off"
                  required
                />
              ) : (
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
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || (!useRecoveryCode && otp.length !== 6) || (useRecoveryCode && otp.length < 4)}
            >
              {isSubmitting ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {/* TOTP method: toggle recovery code / resend not needed */}
            {isAppMethod && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={toggleRecoveryCode}
              >
                {useRecoveryCode 
                  ? "Use authenticator code instead" 
                  : "Use recovery code instead"}
              </Button>
            )}

            {/* Email method: resend button */}
            {!isAppMethod && !useRecoveryCode && (
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
            )}

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

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={<Loading text="Loading verification..." />}>
      <TwoFactorVerifyContent />
    </Suspense>
  )
}
