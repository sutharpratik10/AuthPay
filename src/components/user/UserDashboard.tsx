"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import SubscriptionDashboard from "@/components/user/SubscriptionDashboard"
import { useSubscription } from "@/contexts/SubscriptionContext"
import EmailVerificationBanner from "@/components/shared/EmailVerificationBanner"

export default function UserDashboard() {
  const { data: session } = useSession()
  const [userName, setUserName] = useState("User")
  const [showBanner, setShowBanner] = useState(true)
  const { subscriptionStatus, isLoading } = useSubscription()

  // Check if email is verified
  const isEmailVerified = session?.user?.isEmailVerified === true
  const userEmail = session?.user?.email || ""

  // Update user name when session is available
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  // Determine if the user has an active subscription
  const isActiveSub = !!subscriptionStatus && subscriptionStatus.isActive === true

  // Show loading while subscription data is loading
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

  return (
    <div className="w-full max-w-full mx-auto">
      {/* Email Verification Banner - shown at the very top if email is not verified */}
      {!isEmailVerified && userEmail && showBanner && (
        <EmailVerificationBanner
          email={userEmail}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <div className="px-2 sm:px-4 py-6">
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

        {/* Not subscribed - show subscription options */}
        {!isActiveSub && (
          <SubscriptionDashboard />
        )}
      </div>
    </div>
  )
}
