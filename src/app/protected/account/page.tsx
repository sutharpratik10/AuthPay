"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import AccountPage from "@/components/user/AccountPage"

export default function AccountPageWrapper() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login")
    }
  }, [status])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  // Don't render until authenticated
  if (status !== "authenticated") {
    return null
  }

  return <AccountPage />
}
