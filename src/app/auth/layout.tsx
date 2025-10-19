"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { getAuthPageRedirect, ROUTE_POLICIES } from "@/lib/rbac/routing-utils"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  useEffect(() => {
    async function checkAuthRedirect() {
      if (!user?.id) return;

      const isEmailVerified = (user as { isEmailVerified?: boolean })?.isEmailVerified ?? false;
      const redirectTo = await getAuthPageRedirect(user.id, isEmailVerified, pathname);

      if (redirectTo) {
        router.replace(redirectTo);
      }
    }

    checkAuthRedirect();
  }, [user, pathname, router, isAuthenticated]);

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
