"use client"

import { ThemeProvider } from "@/components/theme-provider";
import { Navigationbar } from "@/components/navigationbar";
import { AuthProvider } from "@/lib/auth-context";
import { SessionProvider, useSession } from "next-auth/react";
import { Footer } from "@/components/footer"; // Import the Footer component


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </SessionProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <Navigationbar />
        <div className="h-16"></div>
        <main className="min-h-[calc(100vh-148px)]">
          {children}
        </main>
        {!isAuthenticated && <Footer />}
      </AuthProvider>
    </ThemeProvider>
  );
}
