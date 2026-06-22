"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"
import SignupForm from "@/components/auth/SignupForm"

export default function SignupPage() {
  const router = useRouter()
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
      if (isEmailVerified) {
        router.push(dashboardUrl)
      } else {
        router.push(ROUTE_POLICIES.AUTH_VERIFY.path)
      }
    }
  }, [isAuthenticated, isEmailVerified, loading, router, dashboardUrl])
  
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
