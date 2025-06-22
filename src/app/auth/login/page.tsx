"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isEmailVerified) {
        const redirectPath = returnTo ? decodeURIComponent(returnTo) : "/protected/dashboard"
        router.push(redirectPath)
      } else {
        router.push("/auth/verify-request")
      }
    }
  }, [isAuthenticated, isEmailVerified, loading, returnTo, router])
  
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
<<<<<<< HEAD
=======
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Sign in to your account
        </h2>
      </div>

>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
