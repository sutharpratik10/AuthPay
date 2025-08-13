"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import SubscriptionDashboard from "@/components/SubscriptionDashboard"
import { Button } from "@/components/ui/button"

interface UserSubscriptionStatus {
  hasSubscription: boolean;
  planName?: string;
  role?: string;
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

  const hasSub = !!subscriptionStatus?.hasSubscription

  return (
    <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {userName}! {hasSub
              ? `You have an active ${subscriptionStatus?.planName ?? ''} subscription.`
              : 'Manage your subscription and explore our features.'}
          </p>
        </div>
        {hasSub ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Active Subscription
          </span>
        ) : (
          <Button variant="default" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
            View Plans
          </Button>
        )}
      </div>

      {!hasSub && (
        <SubscriptionDashboard />
      )}

      {hasSub && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold">Quick Start</h3>
            <p className="text-sm text-muted-foreground mt-2">Jump back into your recent activity.</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">My Resources</Button>
              <Button size="sm" variant="outline">Notifications</Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold">Account</h3>
            <p className="text-sm text-muted-foreground mt-2">Manage profile and security.</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">Profile</Button>
              <Button size="sm" variant="outline">Security</Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold">Subscription</h3>
            <p className="text-sm text-muted-foreground mt-2">Plan: {subscriptionStatus?.planName ?? '—'}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">Manage</Button>
              <Button size="sm" variant="outline">Invoices</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
