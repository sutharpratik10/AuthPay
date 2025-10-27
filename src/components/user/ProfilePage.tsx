"use client"

import { useAuth } from "@/lib"
import { Avatar } from "@/components/ui/avatar"
import { Mail, User, Shield } from "lucide-react"

export default function ProfilePage() {
  const { user, isEmailVerified } = useAuth()

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const getDisplayName = () => {
    return user?.name || user?.email?.split("@")[0] || "User"
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center space-x-4">
            <Avatar
              src={user?.image || undefined}
              fallback={getInitials(user?.name || user?.email)}
              size="lg"
              className="h-20 w-20"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{getDisplayName()}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center space-x-2">
                {isEmailVerified ? (
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Email Verified
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Mail className="w-3 h-3 mr-1" />
                    Email Pending Verification
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="flex items-center text-lg font-semibold mb-4">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{user?.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="text-sm">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm font-mono">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <h2 className="flex items-center text-lg font-semibold mb-4">
              <Shield className="w-5 h-5 mr-2" />
              Account Status
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                <p className="text-sm">
                  {isEmailVerified ? (
                    <span className="text-green-600 dark:text-green-400">Yes</span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                <p className="text-sm">Standard User</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
