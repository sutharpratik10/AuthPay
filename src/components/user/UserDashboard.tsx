"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import SubscriptionDashboard from "@/components/user/SubscriptionDashboard"
import { useSubscription } from "@/contexts/SubscriptionContext"
import EmailVerificationBanner from "@/components/shared/EmailVerificationBanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BusinessCreationWizard } from "@/components/ui/business-creation-wizard"

interface Business {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Appointment {
  id: string;
  customerName: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  service: {
    name: string;
  };
}

// Business Analytics Dashboard Component
function BusinessAnalyticsDashboard({
  business,
  appointments
}: {
  business: Business;
  appointments: Appointment[];
}) {
  const upcomingCount = appointments.filter(a =>
    a.status === 'confirmed' && new Date(a.appointmentDate) >= new Date()
  ).length;

  const todayCount = appointments.filter(a => {
    const aptDate = new Date(a.appointmentDate);
    const today = new Date();
    return a.status === 'confirmed' &&
      aptDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-border">
        <CardContent className="py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {business.name}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Booking link: <code className="bg-muted px-2 py-0.5 rounded text-xs">/book/{business.slug}</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${business.slug}`);
                  alert('Link copied!');
                }}
              >
                Copy Link
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(`/book/${business.slug}`, '_blank')}
              >
                View Booking Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-3xl font-bold">{todayCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-green-500">{upcomingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold text-purple-500">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`mt-1 ${business.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`}>
                  {business.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/protected/business'}>
              View All →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground">No appointments yet</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Share your booking link to start receiving appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500' :
                        apt.status === 'completed' ? 'bg-primary' :
                          apt.status === 'cancelled' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`} />
                    <div>
                      <p className="font-medium text-sm">{apt.customerName}</p>
                      <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{apt.startTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => window.location.href = '/protected/business'}
        >
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Services</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => window.location.href = '/protected/business'}
        >
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Manage Appointments</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/book/${business.slug}`);
            alert('Booking link copied!');
          }}
        >
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share Booking Link</span>
        </Button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [userName, setUserName] = useState("User")
  const [showBanner, setShowBanner] = useState(true)
  const { subscriptionStatus, isLoading } = useSubscription()

  // Business state
  const [business, setBusiness] = useState<Business | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businessLoading, setBusinessLoading] = useState(true)
  const [hasBusiness, setHasBusiness] = useState(false)

  // Check if email is verified
  const isEmailVerified = session?.user?.isEmailVerified === true
  const userEmail = session?.user?.email || ""

  // Update user name when session is available
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  // Fetch business data for subscribed users
  const fetchBusiness = useCallback(async () => {
    try {
      const res = await fetch('/api/business')
      if (res.status === 404) {
        setHasBusiness(false)
        setBusinessLoading(false)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setBusiness(data.business)
      setHasBusiness(true)
    } catch {
      setHasBusiness(false)
    } finally {
      setBusinessLoading(false)
    }
  }, [])

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/business/appointments?limit=10')
      if (!res.ok) return
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch {
      console.error('Failed to fetch appointments')
    }
  }, [])

  // Determine if the user has an active subscription
  const isActiveSub = !!subscriptionStatus && subscriptionStatus.isActive === true

  useEffect(() => {
    if (isActiveSub && !isLoading) {
      fetchBusiness()
    }
  }, [isActiveSub, isLoading, fetchBusiness])

  useEffect(() => {
    if (hasBusiness) {
      fetchAppointments()
    }
  }, [hasBusiness, fetchAppointments])

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

        {/* Subscribed but no business - show creation wizard */}
        {isActiveSub && !businessLoading && !hasBusiness && (
          <div className="max-w-2xl mx-auto">
            <BusinessCreationWizard
              onComplete={() => {
                fetchBusiness()
              }}
            />
          </div>
        )}

        {/* Subscribed with business - show analytics dashboard */}
        {isActiveSub && !businessLoading && hasBusiness && business && (
          <BusinessAnalyticsDashboard
            business={business}
            appointments={appointments}
          />
        )}

        {/* Loading business data */}
        {isActiveSub && businessLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  )
}
