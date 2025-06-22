"use client"

import { useState } from "react"
<<<<<<< HEAD
import { useRouter } from "next/navigation"
=======
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
<<<<<<< HEAD
import { AlertCircle, Mail, Github, Facebook, CreditCard } from "lucide-react"
=======
import { useRouter } from "next/navigation"
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)

export default function SignupForm() {
  const { register, socialLogin, loading } = useAuth()
  const router = useRouter()
  
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
      } else {
        // Redirect to verification page on successful registration
        router.push("/auth/verify-request")
      }
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
<<<<<<< HEAD
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
=======
  
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-white">
        Sign Up
      </h2>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
<<<<<<< HEAD
            placeholder="Enter your name"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
=======
            placeholder="Your name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
<<<<<<< HEAD
            placeholder="Enter your email"
            className="w-full"
=======
            placeholder="your@email.com"
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            required
          />
        </div>
        
<<<<<<< HEAD
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
=======
        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
<<<<<<< HEAD
            placeholder="Create a password"
            className="w-full"
=======
            placeholder="********"
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            required
          />
        </div>
        
<<<<<<< HEAD
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
=======
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
<<<<<<< HEAD
            placeholder="Confirm your password"
            className="w-full"
=======
            placeholder="********"
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
            required
          />
        </div>
        
        <Button
          type="submit"
<<<<<<< HEAD
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
=======
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? "Registering..." : "Sign Up"}
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:text-gray-400 dark:bg-gray-800">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("google")}
            className="flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("github")}
            className="flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            GitHub
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("facebook")}
            className="flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-1.745 0-2.513.829-2.513 2.437v1.543h3.34l-.499 3.667h-2.843v7.98H9.101z"
              />
            </svg>
            Facebook
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("azure-ad")}
            className="flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M11.4 24H0L7.1 12.3 0 0H11.4L18.6 12.3z"
              />
            </svg>
            Microsoft
          </Button>
        </div>
      </div>
      
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
          Sign In
        </Link>
      </p>
    </div>
  )
}
