"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import LoginForm from "@/components/auth/LoginForm"
import Loading from "@/components/Loading"

function LoginContent() {  
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')
  
  // Middleware handles all authentication routing
  // If user is already authenticated, middleware will redirect them automatically
    return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          Sign in to your account
        </h2>
        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error === 'SessionExpired' 
              ? 'Your session has expired. Please log in again.' 
              : error === 'SecurityUpdate'
              ? 'Please log in again for security reasons.'
              : decodeURIComponent(error)
            }
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-200">
            {decodeURIComponent(message)}
          </div>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading text="Loading login..." />}>
      <LoginContent />
    </Suspense>
  )
}
