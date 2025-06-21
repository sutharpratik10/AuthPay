"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Check if user is authenticated on mount
  useEffect(() => {
    // In a real app, this would check a token in localStorage or cookies
    const checkAuth = () => {
      // For demo purposes, we'll use localStorage
      const token = localStorage.getItem("auth_token")
      setIsAuthenticated(!!token)
      setLoading(false)
    }
    
    checkAuth()
  }, [])
    const login = async (email: string, password: string) => {
    // This would be an API call in a real app
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo, only fail if email is test@example.com or password is empty
    if (email === "test@example.com" || !password.trim()) {
      setLoading(false)
      throw new Error("Invalid credentials")
    }
    
    // Set token in localStorage with encoded email (simulating JWT)
    localStorage.setItem("auth_token", "demo_token_" + btoa(email + ":" + password) + "_" + Date.now())
    setIsAuthenticated(true)
    setLoading(false)
  }
  
  const logout = () => {
    localStorage.removeItem("auth_token")
    setIsAuthenticated(false)
  }
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
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
