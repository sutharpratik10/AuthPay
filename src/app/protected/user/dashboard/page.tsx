"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import SubscriptionDashboard from "@/components/SubscriptionDashboard"
import JobSearchContainer from "@/components/JobSearch/JobSearchContainer"
import { useSubscription } from "@/contexts/SubscriptionContext"

export default function UserDashboardPage() {
  const { data: session, status } = useSession()
  const [userName, setUserName] = useState("User")
  const { subscriptionStatus, isLoading } = useSubscription() // Use context

  // Update user name when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [status, session])

  // Show loading while session is being checked or subscription data is loading
  if (status === 'loading' || isLoading) {
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

  // Determine if the user has an active subscription
  const isActiveSub = !!subscriptionStatus && subscriptionStatus.isActive === true;

  return (
    <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {userName}! {isActiveSub
              ? `You have an active ${subscriptionStatus?.planName ?? ''} subscription.`
              : 'Manage your subscription and explore our features.'}
          </p>
        </div>
      </div>

      {!isActiveSub && (
        <SubscriptionDashboard />
      )}

      {isActiveSub && (
        <div>
          <JobSearchContainer />
        </div>
      )}
    </div>
  )
}
