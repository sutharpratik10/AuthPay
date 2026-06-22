// filepath: d:\Pratik\work\ByteLoom\Web Applications\rsvp\rsvp\src\app\page.tsx
import HomePage from "@/components/Home/HomePage";
import { Metadata } from 'next';
import { APP_CONFIG } from '@/lib/utils/constants';

export const metadata: Metadata = {
  title: `${APP_CONFIG.APP_NAME} - Secure Auth & Payments`,
  description: 'Secure authentication and payment gateway solution with OAuth, 2FA, and subscription management.',
};

// Force static generation for optimal performance
export const dynamic = 'force-static';
export const revalidate = false;

export default function Home() {
  return <HomePage />;
}
