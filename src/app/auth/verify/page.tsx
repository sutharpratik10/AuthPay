"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import VerificationForm from "@/components/auth/VerificationForm"

export default function VerifyPage() {
  const { isAuthenticated, isEmailVerified, loading } = useAuth()
  const router = useRouter()
  
  // Redirect if user is already verified
  useEffect(() => {
    if (!loading && isAuthenticated && isEmailVerified) {
      router.push("/protected/dashboard")
    }
  }, [isAuthenticated, isEmailVerified, loading, router])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 dark:bg-gray-900">
      <VerificationForm />
    </div>
  )
}
