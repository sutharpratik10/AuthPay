"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ROUTES } from "@/routes/routeUtils"
import { getRoleDashboard } from "@/routes/authRoutes"

export function AuthLinks() {
  const { isAuthenticated, logout, loading, user } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push(ROUTES.PUBLIC.HOME)
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
        <Link href={getRoleDashboard(user)} className="text-sm font-medium hover:text-primary transition-colors">
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
      <Link href={ROUTES.AUTH.LOGIN} className="text-sm font-medium hover:text-primary transition-colors">
        Login
      </Link>
      <Button asChild size="sm">
        <Link href={ROUTES.AUTH.SIGNUP}>
          Sign Up
        </Link>
      </Button>
    </div>
  )
}
