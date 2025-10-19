"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"
import { useEffect, useState } from "react"

export function AuthLinks() {
  const { isAuthenticated, logout, loading, user } = useAuth()
  const router = useRouter()
  const [dashboardPath, setDashboardPath] = useState(ROUTE_POLICIES.USER_DASHBOARD.path)

  useEffect(() => {
    async function fetchDashboard() {
      if (user?.id) {
        try {
          // Call API to get dashboard URL based on user's policies
          const response = await fetch('/api/rbac/user/dashboard');
          const data = await response.json();
          if (data.dashboardUrl) {
            setDashboardPath(data.dashboardUrl);
          }
        } catch (error) {
          console.error('Error fetching dashboard URL:', error);
        }
      }
    }
    fetchDashboard();
  }, [user]);

  const handleLogout = () => {
    logout()
    router.push(ROUTE_POLICIES.AUTH_LOGIN.path)
  }

  // Show skeleton/placeholder during loading to prevent layout shift
  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-9 w-12 bg-muted animate-pulse rounded"></div>
        <div className="h-9 w-16 bg-muted animate-pulse rounded"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link href={dashboardPath} className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href={ROUTE_POLICIES.AUTH_LOGIN.path} className="text-sm font-medium hover:text-primary transition-colors">
        Login
      </Link>
      <Button asChild size="sm">
        <Link href={ROUTE_POLICIES.AUTH_SIGNUP.path}>
          Sign Up
        </Link>
      </Button>
    </div>
  )
}

