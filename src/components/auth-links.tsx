"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/routes/routeUtils"

export function AuthLinks() {
  const { isAuthenticated, logout, loading } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push(ROUTES.PUBLIC.HOME)
  }

  if (loading) {
    return null
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link href={ROUTES.PROTECTED.DASHBOARD} className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    )
  }  return (
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
