"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Mail, Github, CreditCard, Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { calculatePasswordStrength, getPasswordStrengthWidth, type PasswordStrength } from "@/lib/auth/password-strength"
import { hasSQLInjectionPatterns, EMAIL_REGEX } from "@/lib/utils/sanitize"

export default function SignupForm() {
  const { register, socialLogin, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })
  
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  
  // Email validation states
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({
    checking: false,
    available: null,
    message: ""
  })
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Very Weak',
    color: 'bg-red-500',
    suggestions: []
  })
  
  // Track last checked email to avoid duplicate API calls
  const lastCheckedEmail = useRef<string>("")

  // Debounced email check
  const checkEmailAvailability = useCallback(async (email: string) => {
    // Skip if email hasn't changed or is invalid
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus({ checking: false, available: null, message: "" })
      return
    }
    
    // Skip if already checked this email
    if (email === lastCheckedEmail.current) {
      return
    }

    setEmailStatus(prev => ({ ...prev, checking: true }))
    lastCheckedEmail.current = email
    
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setEmailStatus({
          checking: false,
          available: !result.emailExists,
          message: result.message
        })
      } else {
        setEmailStatus({
          checking: false,
          available: null,
          message: result.error || "Error checking email"
        })
      }    } catch (error) {
      setEmailStatus({
        checking: false,
        available: null,
        message: "Error checking email availability"
      })
      console.error("Email check error:", error)
    }
  }, [])

  // Effect for email validation with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [formData.email, checkEmailAvailability])

  // Effect for password strength calculation
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password)
    setPasswordStrength(strength)
  }, [formData.password])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Validate field and set inline error
    validateField(name, value)
    
    // Reset email status when user modifies email
    if (name === "email") {
      setEmailStatus({ checking: false, available: null, message: "" })
      // Reset last checked email to allow re-checking after modification
      lastCheckedEmail.current = ""
    }
  }
  
  // Field validation function
  const validateField = (name: string, value: string) => {
    let errorMessage = ""
    
    if (name === "name") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid name."
      }
    } else if (name === "email") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid email address."
      } else if (value && !EMAIL_REGEX.test(value)) {
        errorMessage = "Please enter a valid email address (e.g., user@example.com)"
      }
    } else if (name === "password") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid password."
      }
    } else if (name === "confirmPassword") {
      if (hasSQLInjectionPatterns(value)) {
        errorMessage = "Invalid input detected. Please enter a valid password."
      }
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: errorMessage }))
  }
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    
    // Check for field-level validation errors
    const hasFieldErrors = Object.values(fieldErrors).some(err => err !== "")
    if (hasFieldErrors) {
      return setError("Please fix the validation errors before submitting.")
    }

    // Basic validation
    if (!formData.email || !formData.password) {
      return setError("Email and password are required")
    }
    
    // Validate email format
    if (!EMAIL_REGEX.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
      return
    }

    // Email availability check
    if (emailStatus.available === false) {
      return setError("Email is already registered. Please use a different email or try logging in.")
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match")
    }

    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters")
    }

    // Password strength validation
    if (passwordStrength.score < 2) {
      return setError("Password is too weak. Please create a stronger password.")
    }
    
    try {
      setIsSubmitting(true)
      const result = await register(formData.email, formData.password, formData.name)
      if (result.error) {
        setError(result.error || "Registration failed. Please try again later.")
      }
      // Auth context will handle redirection after successful registration
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        setError((error as { message: string }).message)
      } else {
        setError("An error occurred during registration. Please try again later.")
      }
      console.error("Registration error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
    const handleSocialLogin = async (provider: string) => {
    try {
      await socialLogin(provider)
    } catch (error) {
      setError("Failed to login with social provider")
      console.error("Social login error:", error)
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Sign Up</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Create your account to get started.</p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className={`w-full ${
              fieldErrors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600"
                : ""
            }`}
          />
          {/* Inline field error for name */}
          {fieldErrors.name && (
            <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.name}
            </p>
          )}
        </div>
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
              placeholder="your@email.com"
              className={`w-full pr-10 ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500'
                  : emailStatus.available === false 
                  ? 'border-red-500 focus:border-red-500' 
                  : emailStatus.available === true 
                  ? 'border-green-500 focus:border-green-500' 
                  : ''
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {emailStatus.checking ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : emailStatus.available === true ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : emailStatus.available === false ? (
                <X className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </div>
          {/* Inline field error for email */}
          {fieldErrors.email && (
            <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.email}
            </p>
          )}
          {emailStatus.message && !fieldErrors.email && (
            <p className={`text-xs ${
              emailStatus.available === true 
                ? 'text-green-600' 
                : emailStatus.available === false 
                ? 'text-red-600' 
                : 'text-gray-600'
            }`}>
              {emailStatus.message}
            </p>
          )}
        </div>
          <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className={`w-full pr-10 ${
                fieldErrors.password
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
          
          {/* Inline field error for password */}
          {fieldErrors.password && (
            <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.password}
            </p>
          )}
          
          {/* Password Strength Indicator */}
          {formData.password && !fieldErrors.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Password strength:
                </span>
                <span className={`text-xs font-medium ${
                  passwordStrength.score <= 1 ? 'text-red-600' :
                  passwordStrength.score <= 2 ? 'text-orange-600' :
                  passwordStrength.score <= 3 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color} ${getPasswordStrengthWidth(passwordStrength.score)}`}
                />
              </div>
              
              {passwordStrength.suggestions.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">To improve your password:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {passwordStrength.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
          <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********"
              className={`w-full pr-10 ${
                fieldErrors.confirmPassword
                  ? 'border-red-500 focus:border-red-500'
                  : formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-500 focus:border-red-500'
                  : formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'border-green-500 focus:border-green-500'
                  : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Inline field error for confirm password */}
          {fieldErrors.confirmPassword && (
            <p className="text-sm mt-1 text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.confirmPassword}
            </p>
          )}
          
          {/* Password Match Indicator */}
          {formData.confirmPassword && !fieldErrors.confirmPassword && (
            <p className={`text-xs ${
              formData.password === formData.confirmPassword
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {formData.password === formData.confirmPassword
                ? '✓ Passwords match'
                : '✗ Passwords do not match'
              }
            </p>
          )}
        </div>        <Button
          type="submit"
          className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            isSubmitting || 
            loading || 
            emailStatus.checking || 
            emailStatus.available === false ||
            (!!formData.password && passwordStrength.score < 2) ||
            (!!formData.confirmPassword && formData.password !== formData.confirmPassword) ||
            !!fieldErrors.name ||
            !!fieldErrors.email ||
            !!fieldErrors.password ||
            !!fieldErrors.confirmPassword
          }
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Sign Up"
          )}
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
        >
          <Mail className="h-5 w-5" />
          Continue with Google
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("github")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("azure-ad")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
        >
          <CreditCard className="h-5 w-5" />
          Continue with Microsoft
        </Button>
      </div>
      
      {/* Sign In Link */}
      <p className="mt-6 text-center text-sm text-gray-900 dark:text-gray-300">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-gray-900 dark:text-gray-300 hover:text-black dark:hover:text-white">
          Sign In
        </Link>
      </p>
    </div>
  )
}
