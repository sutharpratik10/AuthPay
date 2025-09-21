"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function NotFound() {
  const { theme, systemTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  if (!mounted) {
    // Return a fallback during SSR to prevent hydration mismatch
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-8xl font-bold text-muted-foreground/30">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
      {/* Subtle gradient background */}
      <div className={`
        absolute inset-0 transition-all duration-700
        ${isDark 
          ? "bg-gradient-to-br from-background via-background to-muted/20" 
          : "bg-gradient-to-br from-white via-white to-muted/10"
        }
      `}>
        {/* Subtle animated background pattern */}
        <div className={`
          absolute inset-0 opacity-5 transition-opacity duration-700
          ${isDark ? "opacity-10" : "opacity-5"}
        `}>
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-muted-foreground/20 animate-pulse" />
          <div className="absolute top-40 right-32 w-24 h-24 rounded-full border border-muted-foreground/20 animate-pulse animation-delay-1000" />
          <div className="absolute bottom-32 left-32 w-20 h-20 rounded-full border border-muted-foreground/20 animate-pulse animation-delay-2000" />
          <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full border border-muted-foreground/20 animate-pulse animation-delay-3000" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 p-8 max-w-2xl mx-auto">
        {/* 404 Number with subtle shadow */}
        <div className="relative">
          <h1 className={`
            text-9xl font-bold transition-all duration-700 select-none
            ${isDark 
              ? "text-muted-foreground/20 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]" 
              : "text-muted-foreground/15 drop-shadow-[0_0_30px_rgba(0,0,0,0.05)]"
            }
          `}>
            404
          </h1>
          {/* Subtle glow effect */}
          <div className={`
            absolute inset-0 text-9xl font-bold blur-3xl transition-all duration-700
            ${isDark 
              ? "text-white/5" 
              : "text-black/5"
            }
          `}>
            404
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-4">
          <h2 className={`
            text-3xl font-semibold transition-colors duration-500
            ${isDark ? "text-foreground" : "text-foreground"}
          `}>
            Page Not Found
          </h2>          <p className={`
            text-lg leading-relaxed max-w-md mx-auto transition-colors duration-500
            ${isDark ? "text-muted-foreground" : "text-muted-foreground"}
          `}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            size="lg"
            className={`
              group transition-all duration-300 hover:scale-105 active:scale-95
              ${isDark 
                ? "border-muted/30 hover:border-muted-foreground/30 hover:bg-muted/10" 
                : "border-muted hover:border-muted-foreground/30 hover:bg-muted/20"
              }
            `}
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>

          <Link href="/">
            <Button 
              size="lg"
              className={`
                group transition-all duration-300 hover:scale-105 active:scale-95
                ${isDark 
                  ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                  : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                }
              `}
            >
              <Home className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Go Home
            </Button>
          </Link>

          <Button 
            onClick={() => window.location.reload()}
            variant="ghost" 
            size="lg"
            className={`
              group transition-all duration-300 hover:scale-105 active:scale-95
              ${isDark 
                ? "hover:bg-muted/10 text-muted-foreground hover:text-foreground" 
                : "hover:bg-muted/20 text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180" />
            Refresh
          </Button>
        </div>

        {/* Additional help text */}
        <div className={`
          pt-8 text-sm transition-colors duration-500
          ${isDark ? "text-muted-foreground/70" : "text-muted-foreground/70"}
        `}>
          <p>
            If you believe this is an error, please{" "}
            <Link 
              href="/contact" 
              className={`
                underline decoration-1 underline-offset-2 transition-all duration-300
                ${isDark 
                  ? "text-primary/80 hover:text-primary decoration-primary/40 hover:decoration-primary" 
                  : "text-primary/80 hover:text-primary decoration-primary/40 hover:decoration-primary"
                }
              `}
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
