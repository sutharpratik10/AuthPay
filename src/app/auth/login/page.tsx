"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getRoleName } from "@/lib/role-utils"
import { ROUTES } from "@/routes/routeUtils"
import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const message = searchParams.get('message')
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
    
  // Redirect if already authenticated
  useEffect(() => {    
      if (!loading && isAuthenticated) {
      // Add a small delay to ensure session data is fully loaded
      const redirectTimer = setTimeout(() => {
        if (isEmailVerified) {
          if (returnTo) {
            const redirectPath = decodeURIComponent(returnTo);
            console.log('[LOGIN] Redirecting verified user to:', redirectPath)
            router.push(redirectPath)
          } else {
            // Determine dashboard based on user role
            const userRole = getRoleName(user as { role?: string; roleName?: string; roleId?: string });
            const dashboardUrl = userRole === 'admin' 
              ? ROUTES.PROTECTED.ADMIN_DASHBOARD : ROUTES.PROTECTED.USER_DASHBOARD;
            router.push(dashboardUrl)
          }
        } else {          
          console.log('[LOGIN] Redirecting unverified user to verify')
          router.push("/auth/verify")
        }
      }, 100) // Small delay to ensure session is fully updated
      
      return () => clearTimeout(redirectTimer)
    }
  }, [isAuthenticated, isEmailVerified, loading, returnTo, router, user])
    return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Sign in to your account
        </h2>
        {message && (
          <div className="mt-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
            {decodeURIComponent(message)}
          </div>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
