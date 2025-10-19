"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import UserDashboard from "@/components/user/UserDashboard"

export default function UserDashboardPage() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login")
    }
  }, [status])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  // Don't render until authenticated
  if (status !== "authenticated") {
    return null
  }

  return <UserDashboard />
}
