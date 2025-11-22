// filepath: d:\Pratik\work\ByteLoom\Web Applications\rsvp\rsvp\src\app\page.tsx
import HomePage from "@/components/Home/HomePage";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AuthPay - Authentication & Payment Platform',
  description: 'Secure authentication and payment gateway solution with OAuth, 2FA, and subscription management.',
};

// Force static generation for optimal performance
export const dynamic = 'force-static';
export const revalidate = false;

export default function Home() {
  return <HomePage />;
}
