"use client"

import { ThemeProvider } from "@/components/theme-provider";
import { Navigationbar } from "@/components/navigationbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { SessionProvider } from "next-auth/react";


export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="rolekit-theme"
      >
        <AuthProvider>
          {/* Navigationbar component is already fixed positioned */}
          <Navigationbar />
          {/* Spacer to account for fixed navigation bar */}
          <div className="h-16"></div>
          <main className="min-h-[calc(100vh-148px)]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
