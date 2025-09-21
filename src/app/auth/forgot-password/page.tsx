"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/routes/routeUtils"
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

type Step = 'email' | 'verify' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Initialize from URL params
  useEffect(() => {
    const step = searchParams.get('step') as Step
    const emailParam = searchParams.get('email')
    
    if (step && ['email', 'verify', 'reset', 'success'].includes(step)) {
      setCurrentStep(step)
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false)
    }
  }, [countdown, resendDisabled])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess("Password reset code sent to your email")
        setCurrentStep('verify')
        // Update URL without page reload
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('step', 'verify')
        newUrl.searchParams.set('email', encodeURIComponent(email))
        window.history.pushState({}, '', newUrl.toString())
      } else {
        setError(data.error || 'Failed to send reset code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
      try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess("Code verified successfully")
        setCurrentStep('reset')
        // Update URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('step', 'reset')
        window.history.pushState({}, '', newUrl.toString())
      } else {
        setError(data.error || 'Invalid or expired code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess("Password reset successfully")
        setCurrentStep('success')
        // Update URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('step', 'success')
        window.history.pushState({}, '', newUrl.toString())
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError("")
    setSuccess("")
    setResendDisabled(true)
    setCountdown(60) // Disable resend for 60 seconds
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess("New verification code sent successfully")
      } else {
        setError(data.error || 'Failed to resend code')
        setResendDisabled(false)
        setCountdown(0)
      }
    } catch (err) {
      setError('An error occurred while resending code')
      console.error(err)
      setResendDisabled(false)
      setCountdown(0)
    }
  }

  const handleBackToEmail = () => {
    setCurrentStep('email')
    setCode("")
    setError("")
    setSuccess("")
    // Update URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('step')
    newUrl.searchParams.delete('email')
    window.history.pushState({}, '', newUrl.toString())
  }

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
          Email address
        </label>
        <div className="mt-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center"
        >
          {isLoading ? "Sending reset code..." : "Send password reset code"}
        </Button>
      </div>
      
      <div className="text-center mt-4">
        <Link href={ROUTES.AUTH.LOGIN} className="font-semibold text-sm text-primary hover:text-primary/90">
          Back to login
        </Link>
      </div>
    </form>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>
      
      <form onSubmit={handleCodeVerification} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-foreground">
            Verification Code
          </label>
          <div className="mt-2">
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(value)
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
              autoComplete="one-time-code"
              required
            />
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </form>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResendCode}
          disabled={resendDisabled}
        >
          {resendDisabled 
            ? `Resend code (${countdown}s)` 
            : "Resend verification code"}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={handleBackToEmail}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Use different email
        </Button>
      </div>
    </div>
  )

  const renderResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
          New Password
        </label>
        <div className="mt-2">
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm New Password
        </label>
        <div className="mt-2">
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center"
        >
          {isLoading ? "Resetting password..." : "Reset Password"}
        </Button>
      </div>
    </form>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">Password Reset Successful!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Your password has been successfully reset. You can now login with your new password.
        </p>
      </div>
      <div>
        <Link href={ROUTES.AUTH.LOGIN}>
          <Button className="w-full">
            Continue to Login
          </Button>
        </Link>
      </div>
    </div>
  )
  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Reset your password'
      case 'verify': return 'Verify your email'
      case 'reset': return 'Set new password'
      case 'success': return 'Password reset successful'
      default: return 'Reset your password'
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          {getStepTitle()}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <div className="text-sm text-green-700 dark:text-green-300">{success}</div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'email' && renderEmailStep()}
        {currentStep === 'verify' && renderVerifyStep()}
        {currentStep === 'reset' && renderResetStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
}
