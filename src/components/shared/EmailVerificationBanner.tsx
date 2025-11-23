"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Mail, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmailVerificationBannerProps {
  email: string
  onDismiss?: () => void
}

export default function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleVerifyNow = () => {
    router.push('/auth/verify')
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setMessage("")
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("✓ Verification email sent! Check your inbox.")
      } else {
        setMessage("✗ " + (data.error || "Failed to send email"))
      }
    } catch (error) {
      console.error('Error resending verification email:', error)
      setMessage("✗ Failed to send email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="relative w-full bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 dark:border-orange-400 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icon and Content */}
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Email Verification Required
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                Your email address <span className="font-medium">{email}</span> is not verified yet. 
                Please verify your email to access all features and ensure account security.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleVerifyNow}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Verify Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>

                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  size="sm"
                  disabled={isResending}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/30"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-600 border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Resend Email
                    </>
                  )}
                </Button>

                {message && (
                  <span className={`text-xs font-medium ${
                    message.startsWith('✓') 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
