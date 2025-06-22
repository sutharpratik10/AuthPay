"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerificationPending() {
  const { logout } = useAuth()
  
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="text-center">
        <svg 
          className="mx-auto h-12 w-12 text-yellow-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Verify your email address
        </h2>
        
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          We&#39;ve sent you an email with a verification code.
          Please check your inbox and enter the code to verify your account.
        </p>
          <div className="mt-6">
          <Link href="/auth/verify" className="w-full">
            <Button className="w-full">
              Enter Verification Code
            </Button>
          </Link>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Didn&#39;t receive the email?
          </p>
          
          <div className="flex flex-col space-y-3 mt-3">
            <Link href="/auth/verify" className="w-full">
              <Button
                variant="outline"
                className="w-full"
              >
                Resend Verification Email
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
