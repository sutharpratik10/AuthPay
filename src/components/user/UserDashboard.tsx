"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import SubscriptionDashboard from "@/components/user/SubscriptionDashboard"
import { useSubscription } from "@/contexts/SubscriptionContext"
import EmailVerificationBanner from "@/components/shared/EmailVerificationBanner"
import { Button } from "@/components/ui/button"
import { Code2, Settings, ShieldCheck, CreditCard, Zap, ArrowRight, Sparkles } from "lucide-react"

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

        {/* Subscribed User Dashboard Area - Template Placeholder View */}
        {isActiveSub && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-black border border-white/10 p-8 sm:p-12 shadow-2xl mb-12 group">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/20 blur-[80px] group-hover:bg-purple-500/30 transition-all duration-700" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white backdrop-blur-md mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  Premium Access Granted
                </div>

                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                  Your App's Premium Features <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Unlock Here</span>
                </h2>

                <p className="text-lg text-neutral-300 mb-8 max-w-2xl leading-relaxed">
                  This space is a placeholder for companies using this boilerplate. Once your end-users subscribe, this is where you can showcase and grant them access to your SaaS app's core services and integrations.
                </p>
              </div>

              {/* Abstract illustration element */}
              <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none opacity-80">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[spin_60s_linear_infinite]">
                  <path fill="none" stroke="url(#gradient)" strokeWidth="1" d="M44.7,-76.4C58.3,-69.2,70.1,-58.1,79.5,-45.1C88.9,-32.1,95.9,-17.1,96.8,-1.7C97.7,13.8,92.5,29.7,83.1,43.2C73.7,56.7,60.1,67.8,45.4,75.4C30.7,83.1,14.9,87.4,-0.4,88.1C-15.8,88.8,-31.6,85.8,-45.8,78.2C-60,70.6,-72.6,58.3,-81.4,44.1C-90.2,29.8,-95.2,13.6,-94.1,-1.9C-93,-17.4,-85.9,-32.2,-75.6,-44C-65.3,-55.8,-51.9,-64.6,-38.1,-71.4C-24.3,-78.2,-10.1,-83,3.3,-87.8C16.8,-92.5,31.1,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-10 h-10 text-white opacity-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">Your App's Services (Placeholder)</h3>
              <div className="h-px flex-1 bg-border ml-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "SaaS Service 1",
                  description: "Describe the first premium service or integration your subscribed users get access to here.",
                  color: "text-blue-500 dark:text-blue-400",
                  bg: "bg-blue-100 dark:bg-blue-500/10",
                  borderColor: "hover:border-blue-500/50"
                },
                {
                  icon: CreditCard,
                  title: "SaaS Service 2",
                  description: "Describe another powerful tool or feature that provides value to your customers.",
                  color: "text-green-600 dark:text-green-400",
                  bg: "bg-green-100 dark:bg-green-500/10",
                  borderColor: "hover:border-green-500/50"
                },
                {
                  icon: Zap,
                  title: "SaaS Service 3",
                  description: "List a third exclusive capability that users unlock with their active subscription.",
                  color: "text-purple-500 dark:text-purple-400",
                  bg: "bg-purple-100 dark:bg-purple-500/10",
                  borderColor: "hover:border-purple-500/50"
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`group relative p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${feature.borderColor}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-sm font-semibold text-neutral-900 dark:text-white opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                    Replace this <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not subscribed - show subscription options */}
        {!isActiveSub && (
          <SubscriptionDashboard />
        )}
      </div>
    </div>
  )
}
