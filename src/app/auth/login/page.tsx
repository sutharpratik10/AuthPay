"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"
import LoginForm from "@/components/auth/LoginForm"
import Loading from "@/components/Loading"

function LoginContent() {  
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const message = searchParams.get('message')
  const error = searchParams.get('error')
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth()
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)
    
  // Fetch dashboard URL when user is authenticated
  useEffect(() => {
    async function fetchDashboard() {
      if (user?.id && isAuthenticated) {
        try {
          const response = await fetch('/api/rbac/user/dashboard');
          const data = await response.json();
          if (data.dashboardUrl) {
            setDashboardUrl(data.dashboardUrl);
          }
        } catch (error) {
          console.error('Error fetching dashboard URL:', error);
          setDashboardUrl(ROUTE_POLICIES.USER_DASHBOARD.path);
        }
      }
    }
    fetchDashboard();
  }, [user, isAuthenticated]);

  // Redirect if already authenticated
  useEffect(() => {    
    if (!loading && isAuthenticated && dashboardUrl) {
      // Add a small delay to ensure session data is fully loaded
      const redirectTimer = setTimeout(() => {
        if (isEmailVerified) {
          if (returnTo) {
            const redirectPath = decodeURIComponent(returnTo);
            console.log('[LOGIN] Redirecting verified user to:', redirectPath)
            router.push(redirectPath)
          } else {
            // Use fetched dashboard URL
            router.push(dashboardUrl)
          }
        } else {          
          console.log('[LOGIN] Redirecting unverified user to verify')
          router.push(ROUTE_POLICIES.AUTH_VERIFY.path)
        }
      }, 100) // Small delay to ensure session is fully updated
      
      return () => clearTimeout(redirectTimer)
    }
  }, [isAuthenticated, isEmailVerified, loading, returnTo, router, dashboardUrl])
    return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Sign in to your account
        </h2>
        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error === 'SessionExpired' 
              ? 'Your session has expired. Please log in again.' 
              : error === 'SecurityUpdate'
              ? 'Please log in again for security reasons.'
              : decodeURIComponent(error)
            }
          </div>
        )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading text="Loading login..." />}>
      <LoginContent />
    </Suspense>
  )
}
