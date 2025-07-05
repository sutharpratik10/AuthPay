"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Session } from "next-auth"
import { useTheme } from "next-themes"

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
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  socialLogin: (provider: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  // Password reset functions
  initiatePasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyPasswordResetCode: (code: string) => Promise<{ success: boolean; error?: string; userId?: string; email?: string }>;
  resetPassword: (code: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, status } = useSession()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { setTheme } = useTheme()
  // Cast the session to our extended type
  const session = sessionData as ExtendedSession | null
  
  useEffect(() => {
    // Update loading state based on session status
    setLoading(status === "loading")
  }, [status])

  // Load user preferences and apply theme when user is authenticated
  useEffect(() => {
    const loadUserTheme = async () => {
      if (session?.user?.id && status === "authenticated") {
        try {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const preferences = await response.json()
            if (preferences.theme) {
              setTheme(preferences.theme)
            }
          }
        } catch (error) {
          console.warn('Failed to load user theme preference:', error)
        }
      }
    }

    loadUserTheme()  }, [session?.user?.id, status, setTheme])
  
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

      // Create session record after successful login
      try {
        await fetch('/api/auth/track-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (sessionError) {
        console.warn('Failed to create session record:', sessionError);
        // Don't fail the login process if session recording fails
      }

      // Load and apply user theme preference immediately after login
      try {
        const preferencesResponse = await fetch('/api/user/preferences')
        if (preferencesResponse.ok) {
          const preferences = await preferencesResponse.json()
          if (preferences.theme) {
            setTheme(preferences.theme)
          }
        }
      } catch (themeError) {
        console.warn('Failed to load user theme preference:', themeError)
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
      }      // After successful registration, automatically log the user in
      const loginResult = await signIn("credentials", {        redirect: false,
        email,
        password,
      })

      if (loginResult?.error) {
        // If auto-login fails, still redirect to verify but user will need to login manually
        console.warn("Auto-login after registration failed:", loginResult.error)
        router.push("/auth/login?message=Registration successful. Please login to verify your email.")
        return {}
      }

      // Create session record after successful auto-login
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (sessionError) {
        console.warn('Failed to create session record:', sessionError);
        // Don't fail the registration process if session recording fails
      }

      // If auto-login succeeds, redirect to verification page
      router.push("/auth/verify")
      return {}
    } catch (error) {
      console.error("Registration error:", error)
      return { error: "An unexpected error occurred" }
    }
  }
    const logout = async () => {
    // Reset theme to system default on logout
    setTheme('system')
    await signOut({ redirect: false })
    router.push("/")
  }
  const verifyEmail = async (code: string) => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      // Force session update after successful verification
      window.location.reload()
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

  // Password reset functions
  const initiatePasswordReset = async (email: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error("Password reset initiation error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }
  const verifyPasswordResetCode = async (code: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { 
        success: true, 
        userId: data.userId, 
        email: data.email 
      }
    } catch (error) {
      console.error("Password reset code verification error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const resetPassword = async (code: string, newPassword: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error("Password reset error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }
  return (
    <AuthContext.Provider 
      value={{ 
        session,
        user: session?.user || null,
        isAuthenticated, 
        isEmailVerified,
        login, 
        socialLogin,
        register,
        logout, 
        verifyEmail,
        resendVerificationEmail,
        // Password reset functions
        initiatePasswordReset,
        verifyPasswordResetCode,
        resetPassword,
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
