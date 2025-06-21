"use client"

import { AuthRoute } from "@/routes/authRoutes"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
