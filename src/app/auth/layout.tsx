"use client"

import { usePathname } from "next/navigation"
import { ROUTE_POLICIES } from "@/lib/rbac/routing-utils"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  
  // Don't wrap verify page with AuthRoute since users should be authenticated there
  const isVerifyPage = pathname === ROUTE_POLICIES.AUTH_VERIFY.path;
  
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
    <section className="flex flex-col items-center justify-center py-8 md:py-12">
      <div className="container max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}
