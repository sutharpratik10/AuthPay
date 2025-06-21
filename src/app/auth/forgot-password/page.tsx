"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/routes/routeUtils"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Here you would add your password reset logic
    // For example: await sendPasswordResetEmail(email)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setFormSubmitted(true)
    setIsLoading(false)
  }
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Reset your password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {formSubmitted ? (
          <div className="space-y-6">
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20 text-sm">
              <p className="mb-2">If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.</p>
              <p>Check your email and follow the instructions to reset your password.</p>
            </div>
            <div className="text-center">              <Link href={ROUTES.AUTH.LOGIN} className="font-semibold leading-6 text-primary hover:text-primary/90">
                Return to login
              </Link>
            </div>
          </div>
        ) : (
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

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center"
              >
                {isLoading ? "Sending reset link..." : "Send password reset link"}
              </Button>
            </div>
            
            <div className="text-center mt-4">              <Link href={ROUTES.AUTH.LOGIN} className="font-semibold text-sm text-primary hover:text-primary/90">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
