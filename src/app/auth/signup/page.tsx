"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import SignupForm from "@/components/auth/SignupForm"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isEmailVerified) {
        // Determine dashboard based on user role
        const userRole = (user as { role?: string })?.role || 'user';
        const dashboardUrl = userRole === 'admin' 
          ? '/protected/admin/dashboard' 
          : '/protected/user/dashboard';
        router.push(dashboardUrl)
      } else {
        router.push("/auth/verify")
      }
    }
  }, [isAuthenticated, isEmailVerified, loading, router, user])
  
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
