import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar } from "../ui/avatar";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-gray-100 to-neutral-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image src="/globe.svg" alt="Secure background" fill className="object-cover opacity-10" />
        </div>
        <div className="container relative z-10 flex flex-col items-center">
          <Badge className="mb-4 px-4 py-2 text-base bg-blue-100 text-blue-700 dark:bg-neutral-900 dark:text-neutral-300 rounded-full">
            #1 Choice for Secure Authentication
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-blue-700 dark:text-neutral-300 drop-shadow-xl leading-tight">
            Simplify Secure Access —
            <br className="sm:hidden" /> Enterprise‑Grade Authentication,
            <br className="sm:hidden" /> Email‑Based OTP
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto text-gray-700 dark:text-gray-200 font-medium">
          <span className="font-semibold text-blue-700 dark:text-blue-300">The fastest, most reliable</span> way to secure your business and delight your users.{" "}
          </p>
          <Button size="lg" className="px-10 py-5 text-xl font-bold rounded-full bg-gradient-to-r from-blue-700 to-purple-900 hover:from-blue-800 hover:to-blue-600 text-white shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400">
            Get Started — Try Free
          </Button>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">No credit card required. Instant setup.</div>
        </div>
      </section>

      <div className="container">
          {/* Features Section */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-16 px-4">
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/file.svg" alt="OTP Login" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">OTP‑Verified Login</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                Secure, passwordless access via email-based OTP. No more forgotten passwords.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/window.svg" alt="Unlimited Email" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">Unlimited Free Email</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                No limits on email-based authentication for your users. Scale as you grow.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/vercel.svg" alt="Security" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">Enterprise‑Grade Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                End-to-end encryption, audit logs, and compliance. Peace of mind for you and your customers.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/next.svg" alt="Cloud Scalability" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">Cloud Scalability</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                Effortlessly scale to millions of users worldwide. Built for growth.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/globe.svg" alt="Dashboard" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                Intuitive admin dashboard for user and security management. Control at your fingertips.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl border border-gray-200 dark:border-neutral-800 hover:scale-[1.03] transition-transform">
            <CardHeader>
              <Image src="/file.svg" alt="Integrations" width={48} height={48} />
              <CardTitle className="mt-4 text-xl font-bold">Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-600 dark:text-neutral-400 text-center">
                Connect with popular platforms and developer tools. Fast, flexible, future-proof.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Compliance Badges */}
        <section className="w-full flex flex-wrap justify-center gap-4 py-6 px-4">
          <Badge className="bg-blue-100 text-blue-700 dark:bg-neutral-900 dark:text-neutral-300 px-4 py-2 text-base font-semibold">
            GDPR
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-neutral-900 dark:text-neutral-300 px-4 py-2 text-base font-semibold">
            SOC 2
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-neutral-900 dark:text-neutral-300 px-4 py-2 text-base font-semibold">
            ISO 27001
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-neutral-900 dark:text-neutral-300 px-4 py-2 text-base font-semibold">
            HIPAA
          </Badge>
        </section>

        {/* How It Works Flow */}
        <section className="w-full py-16 px-4 flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-8 text-blue-700 dark:text-blue-300">How It Works</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
            <Card className="flex flex-col items-center p-6 shadow-md">
              <Avatar className="bg-gradient-to-br from-blue-400 to-blue-700 text-white text-xl font-bold">1</Avatar>
              <p className="mt-4 text-base font-semibold">User enters email</p>
            </Card>
            <span className="text-3xl text-blue-400">→</span>
            <Card className="flex flex-col items-center p-6 shadow-md">
              <Avatar className="bg-gradient-to-br from-blue-400 to-blue-700 text-white text-xl font-bold">2</Avatar>
              <p className="mt-4 text-base font-semibold">Receives OTP</p>
            </Card>
            <span className="text-3xl text-blue-400">→</span>
            <Card className="flex flex-col items-center p-6 shadow-md">
              <Avatar className="bg-gradient-to-br from-blue-400 to-blue-700 text-white text-xl font-bold">3</Avatar>
              <p className="mt-4 text-base font-semibold">Access granted</p>
            </Card>
          </div>
        </section>

        {/* Client Logos / Testimonials */}
        <section className="w-full py-12 px-4 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Trusted by Leading Enterprises</h2>
          <div className="flex flex-wrap gap-8 justify-center items-center mb-6">
            <Image src="/vercel.svg" alt="Vercel" width={64} height={64} />
            <Image src="/next.svg" alt="Next.js" width={64} height={64} />
            <Image src="/globe.svg" alt="Global" width={64} height={64} />
          </div>
          <Card className="max-w-xl p-6 bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium italic">
              “TrueAuth has transformed our onboarding experience. Secure, simple, and scalable.”
            </p>
            <div className="mt-4 flex items-center gap-2 justify-center">
              <Avatar className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">T</Avatar>
              <span className="font-semibold text-gray-800 dark:text-gray-100">TechLead, Fortune 500</span>
            </div>
          </Card>
        </section>

        {/* Integration Icons */}
        <section className="w-full py-12 px-4 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Integrates With</h2>
          <div className="flex flex-wrap gap-8 justify-center items-center">
            <Image src="/file.svg" alt="API" width={48} height={48} />
            <Image src="/window.svg" alt="Webhooks" width={48} height={48} />
            <Image src="/vercel.svg" alt="Vercel" width={48} height={48} />
            <Image src="/next.svg" alt="Next.js" width={48} height={48} />
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-16 px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          <Card className="flex flex-col gap-6 p-10 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-2 text-gray-800 dark:text-neutral-100">Basic Licence</CardTitle>
              <CardDescription className="text-4xl font-extrabold text-blue-700 dark:text-neutral-300 mb-2">
                $499{" "}
                <span className="text-base font-normal">perpetual (one‑time)</span>
              </CardDescription>
              <CardContent className="text-base text-gray-700 dark:text-neutral-300 mb-2">
                For internal business use, startups, and SMBs.
              </CardContent>
            </CardHeader>
            <ul className="list-disc list-inside text-base text-gray-700 dark:text-neutral-300 mb-2">
              <li>OTP login, unlimited email</li>
              <li>Admin dashboard</li>
              <li>Compliance badges</li>
              <li>Cloud scalability</li>
            </ul>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Perpetual licence for internal use only. No resale or bundling permitted.
            </div>
            <Button size="lg" className="mt-4 px-8 py-3 text-lg font-bold rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-lg">
              Buy Basic
            </Button>
          </Card>
          <Card className="flex flex-col gap-6 p-10 bg-blue-50 dark:bg-neutral-900 border-2 border-blue-700 dark:border-neutral-300 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-2 text-blue-700 dark:text-neutral-300">Extended Licence</CardTitle>
              <CardDescription className="text-4xl font-extrabold text-blue-700 dark:text-neutral-300 mb-2">
                $1499{" "}
                <span className="text-base font-normal">perpetual (one‑time)</span>
              </CardDescription>
              <CardContent className="text-base text-blue-700 dark:text-neutral-300 mb-2">
                For agencies, resellers, SaaS platforms.
              </CardContent>
            </CardHeader>
            <ul className="list-disc list-inside text-base text-blue-700 dark:text-neutral-300 mb-2">
              <li>All Basic features</li>
              <li>Resale and bundling rights</li>
              <li>Priority support</li>
              <li>White-label option</li>
            </ul>
            <div className="text-xs text-blue-700 dark:text-neutral-300">
              Perpetual licence for resale/bundling. See terms for details.
            </div>
            <Button size="lg" className="mt-4 px-8 py-3 text-lg font-bold rounded-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg">
              Buy Extended
            </Button>
          </Card>
        </section>
        <div className="w-full px-4 pb-8 text-xs text-gray-600 dark:text-gray-400 text-center">
          No recurring fees. Support included for 1 year from purchase. See licence terms for details.
        </div>
      </div>
    </main>
  );
}