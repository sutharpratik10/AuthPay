"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/routes/routeUtils"

export default function LoginPage() {  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      
      // Redirect to the returnTo URL if provided, otherwise go to dashboard
      const redirectPath = returnTo ? decodeURIComponent(returnTo) : ROUTES.PROTECTED.DASHBOARD
      router.push(redirectPath)
    } catch (err) {
      console.error(err)
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-1">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <div className="text-sm text-right">              <Link href={ROUTES.AUTH.FORGOT_PASSWORD} className="font-semibold text-primary hover:text-primary/90">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Don&#39;t have an account?{' '}          <Link href={ROUTES.AUTH.SIGNUP} className="font-semibold leading-6 text-primary hover:text-primary/90">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
