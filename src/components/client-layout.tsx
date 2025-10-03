"use client"

import { useEffect, Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigationbar } from "@/components/navigationbar";
import { AuthProvider } from "@/lib/auth-context";
import { SessionProvider, useSession } from "next-auth/react";
import { Footer } from "@/components/footer"; // Import the Footer component
import { Toaster } from "@/components/ui/toaster";
import { useOAuthSessionTracking } from "@/hooks/use-oauth-session-tracking";
import CookieBanner from "@/components/CookieBanner";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0}  // Disable automatic session polling
      refetchOnWindowFocus={false}  // Disable refetch on window focus
    >
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </SessionProvider>
  );
}

// Component wrapper for OAuth session tracking to handle Suspense boundary
function OAuthSessionTracker() {
  useOAuthSessionTracking();
  return null;
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default behavior (which would log to console)
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SubscriptionProvider>
          {/* Track OAuth sessions with Suspense boundary for useSearchParams */}
          <Suspense fallback={null}>
            <OAuthSessionTracker />
          </Suspense>
          <Navigationbar />
          <div className="h-16"></div>
          <main className="min-h-[calc(100vh-148px)]">
            {children}
          </main>
          {!isAuthenticated && <Footer />}
          <CookieBanner />
          <Toaster />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
