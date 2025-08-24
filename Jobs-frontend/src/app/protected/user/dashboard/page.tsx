"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import SubscriptionDashboard from "@/components/SubscriptionDashboard"
import SearchPanel from "@/components/JobSearch/SearchPanel"
import JobList from "@/components/JobSearch/JobList"

interface UserSubscriptionStatus {
  hasSubscription: boolean;
  planName?: string;
  role?: string;
  isActive?: boolean;
}

export default function UserDashboardPage() {
  const { data: session, status } = useSession()
  const [userName, setUserName] = useState("User")
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    if (status === 'authenticated') {
      const nameFromSession = session?.user?.name
      setUserName(nameFromSession || 'User')

      // fetch subscription status for user dashboard
      ;(async () => {
        try {
          const res = await fetch('/api/user/subscription-status')
          const data = await res.json()
          if (data?.success) {
            setSubscriptionStatus(data.data)
          } else {
            setSubscriptionStatus({ hasSubscription: false })
          }
        } catch {
          setSubscriptionStatus({ hasSubscription: false })
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }, [status, session])

  if (isLoading) {
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
          <>
            <SearchPanel />
            <JobList />
          </>
        </div>
      )}
    </div>
  )
}
