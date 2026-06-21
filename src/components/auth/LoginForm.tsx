"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Mail, CreditCard, Github, Eye, EyeOff } from "lucide-react"
import { hasSQLInjectionPatterns, EMAIL_REGEX } from "@/lib/utils/sanitize"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, socialLogin, loading } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  })

  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<"error" | "warning" | "info">("error")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [isCheckingSuspension, setIsCheckingSuspension] = useState(false)
  const [emailStatus, setEmailStatus] = useState<"unknown" | "checking" | "registered" | "not-registered">("unknown")
  const [loginMethod, setLoginMethod] = useState<"password" | "passwordless">("password")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  const [emailMessage, setEmailMessage] = useState("")

  // Track last checked email to avoid duplicate API calls
  const lastCheckedEmail = useRef<string>("")
  // Track validated emails to avoid re-checking the same email
  const validatedEmails = useRef<Map<string, { status: "registered" | "not-registered", isSuspended: boolean }>>(new Map())

  // Helper function to check if email format is valid
  const isValidEmailFormat = useCallback((email: string): boolean => {
    return email.length > 0 && EMAIL_REGEX.test(email) && !hasSQLInjectionPatterns(email)
  }, [])

  // Function to check if email is suspended
  const checkSuspensionStatus = useCallback(async (email: string) => {
    // Only check if email format is valid
    if (!isValidEmailFormat(email)) {
      setIsSuspended(false)
      return
    }

    // Skip if already checked this email
    if (email === lastCheckedEmail.current) {
      return
    }

    // Check cache first
    const cachedResult = validatedEmails.current.get(email)
    if (cachedResult) {
      setIsSuspended(cachedResult.isSuspended)
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
  }, [isValidEmailFormat])

  // Function to check if email is registered
  const checkEmailRegistration = useCallback(async (email: string) => {
    // Only check if email format is valid
    if (!isValidEmailFormat(email)) {
      setEmailStatus("unknown")
      setEmailMessage("")
      return
    }

    // Skip if already checked this email
    if (email === lastCheckedEmail.current) {
      return
    }

    // Check cache first - if we've already validated this email, use cached result
    const cachedResult = validatedEmails.current.get(email)
    if (cachedResult) {
      setEmailStatus(cachedResult.status)
      if (cachedResult.status === "not-registered") {
        setEmailMessage("This email is not registered with us. Please sign up!")
      } else {
        setEmailMessage("")
      }
      setIsSuspended(cachedResult.isSuspended)
      lastCheckedEmail.current = email
      return
    }

    setEmailStatus("checking")
    setEmailMessage("")

    // Update last checked email
    lastCheckedEmail.current = email

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
        const status = data.emailExists ? "registered" : "not-registered"

        // Cache the result
        validatedEmails.current.set(email, {
          status,
          isSuspended: isSuspended
        })

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
  }, [isValidEmailFormat, isSuspended])

  // Debounce email check - only check when email format is valid
  useEffect(() => {
    // Only proceed if email has valid format
    if (!isValidEmailFormat(formData.email)) {
      return
    }

    // Skip if already validated this exact email
    if (validatedEmails.current.has(formData.email)) {
      const cachedResult = validatedEmails.current.get(formData.email)!
      setEmailStatus(cachedResult.status)
      setIsSuspended(cachedResult.isSuspended)
      if (cachedResult.status === "not-registered") {
        setEmailMessage("This email is not registered with us. Please sign up!")
      } else {
        setEmailMessage("")
      }
      lastCheckedEmail.current = formData.email
      return
    }

    const timeoutId = setTimeout(() => {
      checkSuspensionStatus(formData.email)
      checkEmailRegistration(formData.email)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.email, checkSuspensionStatus, checkEmailRegistration, isValidEmailFormat])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (error) {
      setError("")
      setErrorType("error")
    }

    // Validate field and set inline error
    validateField(name, value)

    // Reset email status when user modifies email
    if (name === "email") {
      // Check if the new value is already in cache
      const cachedResult = validatedEmails.current.get(value)
      if (cachedResult) {
        setEmailStatus(cachedResult.status)
        setIsSuspended(cachedResult.isSuspended)
        if (cachedResult.status === "not-registered") {
          setEmailMessage("This email is not registered with us. Please sign up!")
        } else {
          setEmailMessage("")
        }
        lastCheckedEmail.current = value
      } else {
        // Only reset if not in cache and value changed
        if (value !== lastCheckedEmail.current) {
          setEmailStatus("unknown")
          setEmailMessage("")
          // Reset last checked email to allow re-checking after modification
          lastCheckedEmail.current = ""
        }
      }
    }
  }

  // Field validation function
  const validateField = (name: string, value: string) => {
    let errorMessage = ""

    if (name === "email") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid email address."
      } else if (value && !EMAIL_REGEX.test(value)) {
        errorMessage = "Please enter a valid email address (e.g., user@example.com)"
      }
    } else if (name === "password") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid password."
      }
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMessage }))
  }

  const handlePasswordlessSubmit = async (type: 'magic_link' | 'otp') => {
    if (!formData.email || !EMAIL_REGEX.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
      return
    }

    if (isSuspended) {
      setError("Your account has been suspended. Please contact support for assistance.")
      setErrorType("error")
      return
    }

    try {
      setIsSending(true)
      setError("")

      const res = await fetch('/api/auth/passwordless/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, type }),
      })

      const data = await res.json()

      if (res.ok) {
        if (type === 'magic_link') {
          setError("Magic link sent! Please check your email inbox to sign in.")
          setErrorType("info")
        } else {
          setOtpSent(true)
          setError("Login code sent! Please check your email.")
          setErrorType("info")
        }
      } else {
        setError(data.error || "Failed to send. Please try again.")
        setErrorType("error")
      }
    } catch (err) {
      setError("A network error occurred. Please try again.")
      setErrorType("error")
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit code.")
      setErrorType("warning")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      const res = await fetch('/api/auth/passwordless/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, token: otp }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.credentials) {
        // Sign in using bypass credentials
        const signInResult = await login(data.credentials.email, data.credentials.password, data.credentials.skipPasswordCheck)
        
        if (signInResult.requires2FA) {
          return // handled by login function
        }

        if (signInResult.error) {
          setError(`Sign in failed: ${signInResult.error}`)
          setErrorType("error")
        } else {
          let callbackUrl = searchParams.get('callbackUrl') || '/protected/user/dashboard'
          if (callbackUrl.includes('/auth/login')) callbackUrl = '/protected/user/dashboard'
          window.location.href = callbackUrl
        }
      } else {
        setError(data.error || "Invalid or expired code.")
        setErrorType("error")
      }
    } catch (err) {
      setError("A network error occurred. Please try again.")
      setErrorType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    setError("")
    setErrorType("error")

    // Check for field-level validation errors
    if (fieldErrors.email || fieldErrors.password) {
      setError("Please fix the validation errors before submitting.")
      setErrorType("warning")
      return
    }

    if (!formData.email || !formData.password) {
      setError("Please enter both your email and password.")
      setErrorType("warning")
      return
    }

    // Validate email format
    if (!EMAIL_REGEX.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
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

      if (result.requires2FA) {
        // The router.push to the 2FA screen is handled inside the login function
        return
      }

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
          case "Too Many Requests":
            setError("Too many login attempts. Please wait a few minutes before trying again.")
            setErrorType("warning")
            break
          case "Please enter both your email and password.":
            setError("Please enter both your email and password.")
            setErrorType("warning")
            break
          case "Password must be at least 8 characters":
            setFieldErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }))
            setIsSubmitting(false)
            return
          case "Password is required":
            setFieldErrors(prev => ({ ...prev, password: "Password is required" }))
            setIsSubmitting(false)
            return
          case "Invalid email format":
            setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
            setIsSubmitting(false)
            return
          case "Invalid input detected":
            setError("Invalid input detected. Please check your email and password.")
            setErrorType("error")
            break
          default:
            // Log unknown errors in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Unhandled login error:', result.error)
            }
            setError(result.error || "We're having trouble signing you in. Please check your credentials and try again.")
            setErrorType("error")
        }
      } else {
        // Login successful - redirect to callbackUrl or default dashboard
        let callbackUrl = searchParams.get('callbackUrl') || '/protected/user/dashboard'
        if (callbackUrl.includes('/auth/login')) {
          callbackUrl = '/protected/user/dashboard'
        }
        window.location.href = callbackUrl
      }
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
      const callbackUrl = searchParams.get('callbackUrl') || '/protected/user/dashboard'
      await socialLogin(provider, callbackUrl)
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
            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="#000" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Login</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Enter your details to login.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`mb-4 p-3 rounded-md border ${errorType === "error"
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

      {/* Tabs */}
      <div className="flex rounded-md border border-gray-200 dark:border-gray-800 p-1 mb-6 bg-gray-50 dark:bg-neutral-900">
        <button
          type="button"
          className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${loginMethod === 'password' ? 'bg-white dark:bg-neutral-800 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
          onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
        >
          Password
        </button>
        <button
          type="button"
          className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${loginMethod === 'passwordless' ? 'bg-white dark:bg-neutral-800 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
          onClick={() => setLoginMethod('passwordless')}
        >
          Passwordless
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={otpSent ? handleVerifyOTP : handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              className={`w-full transition-colors ${fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                : emailStatus === "registered"
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-600"
                  : emailStatus === "not-registered"
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                    : ""
                }`}
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
          {/* Inline field error for email */}
          {fieldErrors.email && (
            <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.email}
            </p>
          )}
          {emailMessage && !fieldErrors.email && (
            <p className={`text-sm mt-1 ${emailStatus === "registered"
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

        {loginMethod === 'password' && (
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
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full pr-10 ${fieldErrors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                  : ""
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.password}
              </p>
            )}
          </div>
        )}

        {loginMethod === 'passwordless' && otpSent && (
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              6-Digit Login Code
            </label>
            <Input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full text-center tracking-widest text-lg"
            />
          </div>
        )}

        {loginMethod === 'password' && (
          <Button
            type="submit"
            className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || loading || isSuspended || isCheckingSuspension || emailStatus === "not-registered" || !!fieldErrors.email || !!fieldErrors.password}
          >
            {isSubmitting ? "Signing in..." :
              isCheckingSuspension ? "Checking..." :
                isSuspended ? "Account Suspended" :
                  emailStatus === "not-registered" ? "Email Not Registered" :
                    "Log In"}
          </Button>
        )}

        {loginMethod === 'passwordless' && !otpSent && (
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => handlePasswordlessSubmit('magic_link')}
              className="w-full bg-white text-black border border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || isSuspended || isCheckingSuspension || !!fieldErrors.email || !formData.email}
            >
              {isSending ? "Sending..." : "Send Magic Link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePasswordlessSubmit('otp')}
              className="w-full text-gray-700 dark:text-gray-300"
              disabled={isSending || isSuspended || isCheckingSuspension || !!fieldErrors.email || !formData.email}
            >
              {isSending ? "Sending..." : "Send Login Code"}
            </Button>
          </div>
        )}

        {loginMethod === 'passwordless' && otpSent && (
          <Button
            type="submit"
            className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || otp.length < 6}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </Button>
        )}
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