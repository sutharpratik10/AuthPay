"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ROUTES } from "@/routes/routeUtils"
import { Button } from "@/components/ui/button"

interface StatCardProps { title: string; value: string | number; subtitle?: string }

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [adminName, setAdminName] = useState("admin")
  const [loading, setLoading] = useState(true)

  // demo stats; wire to DB later
  const [stats, setStats] = useState({
    activeUsers: 0,
    revenue: "$0",
    errors24h: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect(ROUTES.AUTH.LOGIN)
    }
    if (status === 'authenticated') {
      setAdminName(session?.user?.name || 'admin')

      ;(async () => {
        try {
          const res = await fetch('/api/admin/dashboard-stats');
          const data = await res.json();
          if (data.success) {
            setStats(data.data);
          }
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [status, session])

  if (loading) {
    return (
      <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome back, {adminName}. Here is the system overview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Refresh</Button>
          <Button>New Announcement</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Active Users" value={stats.activeUsers} />
        <StatCard title="Revenue (MTD)" value={stats.revenue} />
        <StatCard title="Errors (24h)" value={stats.errors24h} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-2">Connect to audit_logs for real data.</p>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">System Health</h3>
          <p className="text-sm text-muted-foreground mt-2">Wire to system_health_logs.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
