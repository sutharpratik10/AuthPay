"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function VerificationForm() {
  const { verifyEmail, resendVerificationEmail, loading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
    const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const handleVerify = useCallback(async (verificationCode = code) => {
    if (!verificationCode) {
      return setError("Please enter your verification code")
    }
    
    try {
      setIsSubmitting(true)
      setError("")
      setSuccess("")
      
      const result = await verifyEmail(verificationCode)
      
      if (result.success) {
        setSuccess("Email verified successfully. Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/protected/dashboard")
        }, 2000)
      } else {
        setError(result.error || "Verification failed")
      }
    } catch (err) {
      setError("An error occurred during verification")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }, [code, verifyEmail, router])
  
  // Use the code from URL if available
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setCode(codeFromUrl)
      handleVerify(codeFromUrl)
    }
    
    const emailFromUrl = searchParams.get("email")
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [searchParams, handleVerify])  // Add handleVerify to dependency array
  
  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false)
    }  }, [countdown, resendDisabled])
  
  const handleResend = async () => {
    if (!email) {
      return setError("Email is required for resending verification code")
    }
    
    try {
      setError("")
      setSuccess("")
      setResendDisabled(true)
      setCountdown(60) // Disable resend for 60 seconds
      
      const result = await resendVerificationEmail(email)
      
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
  
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-white">
        Verify Your Email
      </h2>
      
      <p className="mb-4 text-center text-gray-600 dark:text-gray-400">
        Please enter the verification code we sent to your email address.
      </p>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
          {success}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="code" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Verification Code
          </label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            required
            maxLength={6}
          />
        </div>
        
        <Button
          type="button"
          className="w-full"
          onClick={() => handleVerify()}
          disabled={isSubmitting || loading || !code}
        >
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </Button>
        
        <div className="mt-2">
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Your Email (for resending)
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={handleResend}
          disabled={resendDisabled || loading || !email}
        >
          {resendDisabled 
            ? `Resend code (${countdown}s)` 
            : "Resend verification code"}
        </Button>
      </div>
    </div>
  )
}
