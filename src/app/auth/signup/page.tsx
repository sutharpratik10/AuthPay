"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import SignupForm from "@/components/auth/SignupForm"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isEmailVerified) {
        router.push("/protected/dashboard")
      } else {
        router.push("/auth/verify-request")
      }
    }
  }, [isAuthenticated, isEmailVerified, loading, router])
  
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
<<<<<<< HEAD
=======
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Create your account
        </h2>
      </div>

>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
