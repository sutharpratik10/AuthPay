"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Mail, CreditCard, Github } from "lucide-react"

export default function LoginForm() {
  const { login, socialLogin, loading } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<"error" | "warning" | "info">("error")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [isCheckingSuspension, setIsCheckingSuspension] = useState(false)
  const [emailStatus, setEmailStatus] = useState<"unknown" | "checking" | "registered" | "not-registered">("unknown")
  const [emailMessage, setEmailMessage] = useState("")

  // Function to check if email is suspended
  const checkSuspensionStatus = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setIsSuspended(false)
      return
    }

    setIsCheckingSuspension(true)
    try {
      const response = await fetch('/api/auth/check-suspension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsSuspended(data.isSuspended || false)
      }
    } catch (error) {
      console.error('Error checking suspension status:', error)
      // Don't block login on API error
      setIsSuspended(false)
    } finally {
      setIsCheckingSuspension(false)
    }
  }, [])

  // Function to check if email is registered
  const checkEmailRegistration = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus("unknown")
      setEmailMessage("")
      return
    }

    setEmailStatus("checking")
    setEmailMessage("")
    
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.emailExists) {
          setEmailStatus("registered")
        } else {
          setEmailStatus("not-registered")
          setEmailMessage("This email is not registered with us. Please sign up!")
        }
      } else {
        setEmailStatus("unknown")
        setEmailMessage("")
      }
    } catch (error) {
      console.error('Error checking email registration:', error)
      setEmailStatus("unknown")
      setEmailMessage("")
    }
  }, [])

  // Debounce email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkSuspensionStatus(formData.email)
      checkEmailRegistration(formData.email)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.email, checkSuspensionStatus, checkEmailRegistration])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (error) {
      setError("")
      setErrorType("error")
    }

    // Reset email status when user modifies email
    if (name === "email") {
      setEmailStatus("unknown")
      setEmailMessage("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setErrorType("error")

    if (!formData.email || !formData.password) {
      setError("Please enter both your email and password.")
      setErrorType("warning")
      return
    }

    if (isSuspended) {
      setError("Your account has been suspended. Please contact support for assistance.")
      setErrorType("error")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await login(formData.email, formData.password)
      if (result.error) {
        // Map backend errors to user-friendly messages
        switch (result.error) {
          case "Invalid credentials":
            setError("Password is wrong! Please try again or use 'Forgot password?' to reset it.")
            setErrorType("error")
            break
          case "Account disabled":
            setError("Your account has been disabled. Please contact our support team for assistance.")
            setErrorType("error")
            break
          case "User not found":
          case "Account does not exist":
          case "Email not registered":
            setError(`We couldn't find an account with email ${formData.email}. Would you like to create one?`)
            setErrorType("info")
            break
          case "Too many attempts":
            setError("Too many login attempts. Please wait a few minutes before trying again.")
            setErrorType("warning")
            break
          default:
            setError("We're having trouble signing you in. Please check your credentials and try again.")
            setErrorType("error")
        }
      }
      // Let the LoginPage handle redirection based on auth state
    } catch (err) {
      setError("A network error occurred. Please check your internet connection and try again.")
      setErrorType("error")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    try {
      await socialLogin(provider)
    } catch (err) {
      setError("Failed to login with social provider. Please try again.")
      console.error(err)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white border-1 border-black dark:bg-neutral-900 dark:border-white rounded-xl shadow-sm">
      {/* Header with Lightning Icon */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-gray-100 p-3 rounded-full mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="#000" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Login</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Enter your details to login.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className={`mb-4 p-3 rounded-md border ${
            errorType === "error" 
              ? "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" 
              : errorType === "warning"
              ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800"
              : "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
              {errorType === "info" && (
                <Link 
                  href="/auth/signup" 
                  className="text-sm font-medium underline hover:no-underline mt-2 inline-block"
                >
                  Sign up here →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspension Warning */}
      {isSuspended && !error && (
        <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-700 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">Account Suspended</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Your account has been suspended. Please contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              className={`w-full transition-colors ${
                emailStatus === "registered" 
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-600" 
                  : emailStatus === "not-registered"
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                  : ""
              }`}
              required
            />
            {emailStatus === "checking" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
              </div>
            )}
            {emailStatus === "registered" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {emailStatus === "not-registered" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          {emailMessage && (
            <p className={`text-sm mt-1 ${
              emailStatus === "registered" 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {emailMessage}
              {emailStatus === "not-registered" && (
                <Link href="/auth/signup" className="font-medium underline hover:no-underline ml-1">
                  Sign up here →
                </Link>
              )}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || loading || isSuspended || isCheckingSuspension || emailStatus === "not-registered"}
        >
          {isSubmitting ? "Signing in..." : 
           isCheckingSuspension ? "Checking..." : 
           isSuspended ? "Account Suspended" : 
           emailStatus === "not-registered" ? "Email Not Registered" :
           "Log In"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-gray-500 dark:bg-neutral-900 dark:text-gray-300">
            OR
          </span>
        </div>
      </div>

      {/* Social Login Options */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
          disabled={isSuspended}
        >
          <Mail className="h-5 w-5" />
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("github")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
          disabled={isSuspended}
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("azure-ad")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
          disabled={isSuspended}
        >
          <CreditCard className="h-5 w-5" />
          Continue with Microsoft
        </Button>
      </div>

      {/* Sign Up Link */}
      <p className="mt-6 text-center text-sm text-gray-900 dark:text-gray-300">
        Don&apos;t have an account yet?{" "}
        <Link href="/auth/signup" className="font-medium text-gray-900 dark:text-gray-300 hover:text-black dark:hover:text-white">
          Sign up
        </Link>
      </p>
    </div>
  )
}