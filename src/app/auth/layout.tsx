"use client"

import { usePathname } from "next/navigation"
import { AuthRoute } from "@/routes/authRoutes"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
    // Don't wrap verify page with AuthRoute since users should be authenticated there
  const isVerifyPage = pathname === '/auth/verify'
  
  if (isVerifyPage) {
    return (
      <section className="flex flex-col items-center justify-center py-8 md:py-12">
        <div className="container max-w-6xl mx-auto">
          {children}
        </div>
      </section>
    )
  }
  
  return (
    <AuthRoute>
      <section className="flex flex-col items-center justify-center py-8 md:py-12">
        <div className="container max-w-6xl mx-auto">
          {children}
        </div>
      </section>
    </AuthRoute>
  );
}
