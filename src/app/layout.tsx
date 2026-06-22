import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./style/globals.css";
import { ClientLayout } from "@/components/layout/client-layout";
import { APP_CONFIG } from "@/lib/utils/constants";
import AuthLayout from "./auth/layout";
import ProtectedLayout from "./protected/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.APP_NAME,
  description: APP_CONFIG.APP_DESCRIPTION,
};
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine which layout to use based on the current pathname
  // This is a simple example; in a real app, use Next.js middleware or segment config
  const isAuthRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/auth");
  const isProtectedRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/protected");

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {isAuthRoute ? (
          <AuthLayout>{children}</AuthLayout>
        ) : isProtectedRoute ? (
          <ProtectedLayout>{children}</ProtectedLayout>
        ) : (
          <ClientLayout>{children}</ClientLayout>
        )}
      </body>
    </html>
  );
}