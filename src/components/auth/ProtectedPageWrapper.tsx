import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/auth/get-server-token";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
}

/**
 * @param requireEmailVerification - If true, redirects unverified users to /auth/verify
 * @param allowedRoles - Array of role names that are allowed to access this page
 */
export async function ProtectedPageWrapper({
  children,
  requireEmailVerification = true,
  allowedRoles,
}: ProtectedPageWrapperProps) {
  // Fast JWT verification - no database query!
  const token = await getServerToken();

  // Check if user has valid JWT token
  if (!token) {
    redirect("/auth/login");
  }

  // Check email verification from JWT
  if (requireEmailVerification && !token.isEmailVerified) {
    redirect("/auth/verify");
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (token.role as string) || "user";
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === "admin") {
        redirect("/protected/admin/dashboard");
      } else {
        redirect("/protected/user/dashboard");
      }
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}
