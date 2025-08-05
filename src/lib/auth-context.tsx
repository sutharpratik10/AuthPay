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
  role?: string; // Add role property
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
  login: (email: string, password: string) => Promise<{ error?: string; requires2FA?: boolean }>;
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
  
  // Cast the session to our extended type
  const session = sessionData as ExtendedSession | null
  
  useEffect(() => {
    // Immediately set loading to false for faster initial render
    // Only keep loading true if session is actually being fetched
    if (status !== "loading") {
      setLoading(false)
    } else {
      // Set a maximum loading timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setLoading(false)
      }, 1000) // Maximum 1 second loading
          return () => clearTimeout(timeout)
    }
  }, [status])

  const isAuthenticated = !!session;
  const isEmailVerified = !!session?.user?.isEmailVerified;
  const login = async (email: string, password: string): Promise<{ error?: string; requires2FA?: boolean }> => {
    try {
      // For NextAuth v5, we need to call signIn with proper parameters
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log('Login result:', result); // Debug log
      console.log('Login result error:', result?.error); // Debug log
      console.log('Login result type of error:', typeof result?.error); // Debug log

      if (result?.error) {
        console.log('Login error detected:', result.error); // Debug log
        
        // For any credential error, check if the user has 2FA enabled
        // This is more reliable than trying to parse NextAuth's error formats
        try {
          const check2FAResponse = await fetch('/api/auth/check-2fa-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (check2FAResponse.ok) {
            const { has2FA } = await check2FAResponse.json();
            
            if (has2FA) {
              // If user has 2FA enabled, this login failure might be due to 2FA being required
              try {
                // Generate temporary token for 2FA flow
                const tempToken = await fetch('/api/auth/generate-temp-token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email, password }),
                });

                if (tempToken.ok) {
                  const tokenData = await tempToken.json();
                  // Redirect to 2FA verification page with proper error handling
                  try {
                    router.push(`/auth/2fa-verify?email=${encodeURIComponent(email)}&token=${tokenData.tempToken}`);
                    return { requires2FA: true };
                  } catch (routerError) {
                    console.error('Failed to redirect to 2FA page:', routerError);
                    return { error: "Failed to redirect to verification page" };
                  }
                } else {
                  const errorData = await tempToken.json().catch(() => ({ error: 'Unknown error' }));
                  return { error: errorData.error || "Failed to initiate 2FA verification" };
                }
              } catch (tempTokenError) {
                console.error('Failed to generate temp token:', tempTokenError);
                return { error: "Failed to initiate 2FA verification" };
              }
            }
          }
        } catch (check2FAError) {
          console.error('Failed to check 2FA status:', check2FAError);
          // Continue with normal error handling if 2FA check fails
        }
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
        console.warn('Failed to create session record:', sessionError);        // Don't fail the login process if session recording fails
      }
      
      // Don't redirect here - let middleware handle the redirect based on email verification status
      return {}
    } catch (error) {
      console.error("Login error:", error)
      return { error: "An unexpected error occurred" }
    }
  }
    const socialLogin = async (provider: string) => {
    await signIn(provider, { callbackUrl: "/protected" })
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
      }      // After successful registration, automatically sign in the user
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // If auto-login fails, still redirect to verify page but user won't be logged in
        console.warn("Auto-login after registration failed:", loginResult.error)
        try {
          router.push("/auth/verify?email=" + encodeURIComponent(email))
        } catch (routerError) {
          console.error("Failed to redirect after registration:", routerError)
        }
        return { error: "Registration successful but auto-login failed. Please sign in manually." }
      }

      // Create session record after successful auto-login
      try {
        await fetch('/api/auth/track-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (sessionError) {
        console.warn('Failed to create session record:', sessionError);
        // Don't fail the registration process if session recording fails
      }

      // User is now authenticated but email not verified - redirect to verify page
      try {
        router.push("/auth/verify")
      } catch (routerError) {        console.error("Failed to redirect to verification page:", routerError)
      }
      return {}
    } catch (error) {
      console.error("Registration error:", error)
      return { error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    await signOut({ callbackUrl: "/" })
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
      }      // After successful verification, update the session and redirect
      // Use router instead of window.location.href to prevent unhandled rejections
      setTimeout(() => {
        try {
          // Get user role to determine correct dashboard
          // After verification, we should refresh the session to get updated user data
          const currentUser = session?.user;
          const userRole = currentUser?.role || 'user';
          const dashboardUrl = userRole === 'admin' 
            ? '/protected/admin/dashboard' 
            : '/protected/user/dashboard';
          router.push(dashboardUrl)
        } catch (routerError) {
          console.error("Failed to redirect after verification:", routerError)
          // Fallback to window.location if router fails
          const currentUser = session?.user;
          const userRole = currentUser?.role || 'user';
          const dashboardUrl = userRole === 'admin' 
            ? '/protected/admin/dashboard' 
            : '/protected/user/dashboard';
          window.location.href = dashboardUrl
        }
      }, 1500)

      return { success: true }
    } catch (error) {
      console.error("Email verification error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const res = await fetch("/api/auth/send-otp", {
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
      console.error("Resend verification email error:", error)
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
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      return { success: true, userId: data.userId, email: data.email }
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
