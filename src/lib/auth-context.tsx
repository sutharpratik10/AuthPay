"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Session } from "next-auth"

// Extended user interface with our custom properties
interface ExtendedUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isEmailVerified?: boolean;
}

// Extended session interface
interface ExtendedSession extends Session {
  user?: ExtendedUser;
}

interface AuthContextType {
  session: ExtendedSession | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  socialLogin: (provider: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, status } = useSession()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Cast the session to our extended type
  const session = sessionData as ExtendedSession | null
  
  useEffect(() => {
    // Update loading state based on session status
    setLoading(status === "loading")
  }, [status])
  
  const isAuthenticated = !!session
  const isEmailVerified = !!session?.user?.isEmailVerified

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        return { error: result.error }
      }

      return {}
    } catch (error) {
      console.error("Login error:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const socialLogin = async (provider: string) => {
    await signIn(provider, { callbackUrl: "/protected/dashboard" })
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { error: data.error }
      }

      router.push("/auth/verify-request")
      return {}
    } catch (error) {
      console.error("Registration error:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const verifyEmail = async (code: string) => {
    try {
      const res = await fetch(`/api/auth/verify?code=${code}`)
      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { success: true }
    } catch (error) {
      console.error("Email verification error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { success: true }
    } catch (error) {
      console.error("Resend verification error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }
    return (
    <AuthContext.Provider 
      value={{ 
        session, 
        isAuthenticated, 
        isEmailVerified,
        login, 
        socialLogin,
        register,
        logout, 
        verifyEmail,
        resendVerificationEmail,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
