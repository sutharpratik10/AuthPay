"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/routes/routeUtils"

export default function SignUpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [formSuccess, setFormSuccess] = useState(false)

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return false
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswords()) {
      return
    }
    
    setIsLoading(true)
    try {
      // Here you would add your registration logic
      // For example: await createUser({ name, email, password })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message
      setFormSuccess(true)
      
      // Reset form 
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        // Automatically log in after signup
        login(email, password).then(() => {
          router.push(ROUTES.PROTECTED.DASHBOARD)
        })
      }, 1500)
    } catch (error) {
      // Handle errors
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {formSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm dark:bg-green-900/30 dark:border-green-900/30 dark:text-green-400">
            Account created successfully! You can now <Link href={ROUTES.AUTH.LOGIN} className="underline font-medium">sign in</Link>.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="name"
            name="name"
            type="text"
            label="Full name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordError}
          />

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{' '}          <Link href={ROUTES.AUTH.LOGIN} className="font-semibold leading-6 text-primary hover:text-primary/90">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
