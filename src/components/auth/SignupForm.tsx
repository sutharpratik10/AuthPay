"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Mail, Github, Facebook, CreditCard } from "lucide-react"

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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    
    // Basic validation
    if (!formData.email || !formData.password) {
      return setError("Email and password are required")
    }
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match")
    }
    
    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters")
    }
    
    try {
      setIsSubmitting(true)
      const result = await register(formData.email, formData.password, formData.name)
        if (result.error) {
        setError(result.error)
      }
      // Auth context will handle redirection after successful registration
    } catch (err) {
      setError("An error occurred during registration")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSocialLogin = async (provider: string) => {
    try {
      await socialLogin(provider)
    } catch (err) {
      setError("Failed to login with social provider")
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full"
          />
        </div>
        
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
            placeholder="your@email.com"
            className="w-full"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="********"
            className="w-full"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="********"
            className="w-full"
            required
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-white text-black border-1 border-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-neutral-700 transition-colors"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? "Creating account..." : "Sign Up"}
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
          onClick={() => handleSocialLogin("facebook")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300"
        >
          <Facebook className="h-5 w-5" />
          Continue with Facebook
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
