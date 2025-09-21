"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Mail, Facebook, CreditCard, Github } from "lucide-react"

export default function LoginForm() {
  const { login, socialLogin, loading } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [isCheckingSuspension, setIsCheckingSuspension] = useState(false)

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

  // Debounce email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkSuspensionStatus(formData.email)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.email, checkSuspensionStatus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Please enter both your email and password.")
      return
    }

    if (isSuspended) {
      setError("Your account has been suspended. Please contact support for assistance.")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await login(formData.email, formData.password)
      if (result.error) {
        // Map backend errors to user-friendly messages
        switch (result.error) {
          case "Invalid credentials":
            setError("The password you entered is incorrect.")
            break
          case "Email not verified":
            setError("Your email address is not verified. Please check your inbox for a verification link.")
            break
          case "Account disabled":
            setError("Your account has been disabled. Please contact support for assistance.")
            break
          case "Account does not exist":
            setError(`Account with email ${formData.email} doesn't exist`)
            break
          default:
            setError("Unable to sign in. Please try again or reset your password.")
        }
      }
      // Let the LoginPage handle redirection based on auth state
    } catch (err) {
      setError("A network error occurred. Please check your connection and try again.")
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
        <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {/* Suspension Warning */}
      {isSuspended && !error && (
        <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="h-4 w-4" />
          <p>Your account has been suspended. Please contact support for assistance.</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your Email"
            className="w-full"
            required
          />
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
          disabled={isSubmitting || loading || isSuspended || isCheckingSuspension}
        >
          {isSubmitting ? "Signing in..." : 
           isCheckingSuspension ? "Checking..." : 
           isSuspended ? "Account Suspended" : 
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
          onClick={() => handleSocialLogin("facebook")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
          disabled={isSuspended}
        >
          <Facebook className="h-5 w-5" />
          Continue with Facebook
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