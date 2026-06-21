"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

function MagicLinkContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your magic link...")

  useEffect(() => {
    const verifyLink = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus("error")
        setMessage("Invalid magic link. Missing token or email.")
        return
      }

      try {
        const res = await fetch('/api/auth/passwordless/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        })

        const data = await res.json()

        if (res.ok && data.success && data.credentials) {
          setStatus("success")
          setMessage("Link verified! Signing you in...")
          
          // Sign in using the bypass credentials
          const signInResult = await signIn("credentials", {
            email: data.credentials.email,
            password: data.credentials.password,
            skipPasswordCheck: data.credentials.skipPasswordCheck,
            redirect: false,
          })

          if (signInResult?.error) {
            setStatus("error")
            setMessage(`Sign in failed: ${signInResult.error}`)
          } else {
            router.push('/protected/user/dashboard')
          }
        } else {
          setStatus("error")
          setMessage(data.error || "The magic link is invalid or has expired.")
        }
      } catch (err) {
        setStatus("error")
        setMessage("A network error occurred while verifying your link.")
      }
    }

    verifyLink()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-gray-200 border-t-black dark:border-gray-700 dark:border-t-white rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Authenticating</h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-green-600 dark:text-green-500">
            <CheckCircle2 className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Success!</h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-red-600 dark:text-red-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="text-gray-500 mt-2 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md font-medium"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10">Loading...</div>}>
      <MagicLinkContent />
    </Suspense>
  )
}
