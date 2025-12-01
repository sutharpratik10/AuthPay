import React from 'react';

// Inline SVG icon components for performance
const ShieldIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ServerIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const oauthProviders = [
  { name: "Google", color: "bg-red-500" },
  { name: "GitHub", color: "bg-gray-800" },
  { name: "Facebook", color: "bg-blue-600" },
  { name: "Microsoft", color: "bg-blue-500" },
  { name: "Apple", color: "bg-black" }
];

export default function HomePage() {

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-neutral-800/20 dark:to-neutral-950/20" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium bg-blue-50/60 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-200/20 hover:ring-blue-300 transition-all">
            <div className="w-4 h-4"><ShieldIcon /></div>
            Trusted Authentication & Payment
          </div>

          {/* Main Title */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200">
            <span className="block">AuthPay</span>
            <span className="mt-2 text-3xl sm:text-4xl font-semibold text-gray-700 dark:text-gray-300/80">Setup and start accepting payments</span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
            A friendly system that helps your customers sign in, subscribe, and pay — clear dashboards
            and helpful controls so anyone on your team can manage it.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 mb-10 flex items-center justify-center gap-3">
            <a href="/auth/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-md transform transition hover:-translate-y-0.5 font-medium">
              Get Started — Free Trial
            </a>
            <a href="/docs" className="inline-block bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-600/10 px-6 py-3 rounded-lg transition font-medium">
              View Documentation
            </a>
          </div>

          <div className="text-xs text-gray-500 mb-8">No credit card required • 14-day free trial</div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto justify-center place-items-center">
            <div className="flex flex-col items-center justify-start text-center min-h-[120px]">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">Easy</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Connect social logins in minutes</div>
            </div>
            <div className="flex flex-col items-center justify-start text-center min-h-[120px]">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">Secure</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Automatic session & password protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Panel & RBAC Section */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Admin Panel & Role-Based Access</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mt-4">
              Easy admin controls let you manage who can do what. Give people only the access they need
              and keep a clear log of actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                  <div className="w-6 h-6"><UsersIcon /></div>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">User & Role Management</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create roles (Admin, Manager, Support), assign permissions with a few clicks, and invite or
                remove team members easily.
              </p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                  <div className="w-6 h-6"><ShieldIcon /></div>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Fine-Grained Permissions</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control access to billing, user data, settings and reports — allow only the actions each role needs.
              </p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                  <div className="w-6 h-6"><CheckCircleIcon /></div>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Audit & Activity Logs</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See who changed what and when — exportable records help with support and compliance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Admin Dashboard</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>Overview of users, revenue and recent activity</li>
                <li>Quick links to manage subscriptions and payments</li>
                <li>At-a-glance health and webhook status</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Admin Tools</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>User invite & onboarding controls</li>
                <li>Role templates and permission presets</li>
                <li>Manual subscriptions, refunds and invoice downloads</li>
                <li>Exportable logs and data for auditing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email/Password Authentication Section */}
      <section className="px-6 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <div className="w-8 h-8"><LockIcon /></div>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Email/Password Authentication
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Sign up and sign in flows that protect your users — passwords are stored safely and
                accounts are verified by email so only real people get access.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Blowfish-based Password Hashing", desc: "Industry-standard password encryption with salt rounds" },
                  { title: "Email Verification", desc: "Automated verification process during user registration" },
                  { title: "Password Reset", desc: "Secure password reset functionality via email tokens" },
                  { title: "Account Protection", desc: "Account lockout protection against brute force attacks" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                      <div className="w-4 h-4 text-white"><CheckCircleIcon /></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Login Form</div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-8 bg-blue-500 rounded w-1/2"></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>✓ Passwords are protected and unreadable if someone looks at our database</div>
                <div>✓ New users confirm their email so signups are genuine</div>
                <div>✓ Automated protection against repeated login attempts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Factor Authentication Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <div className="w-8 h-8 text-green-600 dark:text-green-400"><ShieldIcon /></div>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Email One-Time Codes</h4>
                          <div className="grid grid-cols-3 gap-1 max-w-32 mx-auto">
                            {[7, 3, 8, 2, 9, 1].map((digit, i) => (
                              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-lg font-mono">
                                {digit}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">One-time code sent to your email</p>
                </div>
                      <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <div>✓ Email one-time codes delivered instantly</div>
                        <div>✓ Users can require OTP on every login for extra security</div>
                        <div>✓ No external app required — codes arrive in the inbox</div>
                      </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <div className="w-8 h-8"><ShieldIcon /></div>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Add an extra layer of protection — we currently send a one-time code to the user’s email. Users
                (or admins) can choose to require this code on every login for stronger protection.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Email OTP", desc: "One-time codes are sent to the user's email address" },
                  { title: "Optional per-login", desc: "Users or admins can require OTP on every login" },
                  { title: "No app needed", desc: "Users receive codes directly in their inbox" },
                  { title: "Simple setup", desc: "Enable from the user's account settings or admin panel" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <div className="w-4 h-4 text-white"><CheckCircleIcon /></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OAuth Integration Section */}
      <section className="px-6 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <div className="w-8 h-8"><GlobeIcon /></div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                OAuth Integration
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Let customers sign in with accounts they already use — faster onboarding and fewer passwords.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {oauthProviders.map((provider, index) => (
              <div 
                key={index}
                className="group bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg text-center"
              >
                <div className={`w-12 h-12 ${provider.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">
                    {provider.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {provider.name}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">OAuth 2.0 — one-click login</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-purple-600 dark:text-purple-400"><ZapIcon /></div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">One-Click Login</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Users can sign in with their existing accounts from major platforms
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-purple-600 dark:text-purple-400"><ShieldIcon /></div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Flow</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OAuth 2.0 standard with PKCE for enhanced security
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-purple-600 dark:text-purple-400"><UsersIcon /></div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User Profiles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatic profile data import from OAuth providers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Integration Section */}
      <section className="px-6 py-20 ">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Payment Dashboard</h4>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">R</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">$12,450</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">1,284</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Active Subscriptions</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subscription Plans</span>
                    <span className="text-gray-900 dark:text-white font-medium">3 Active</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Payment Methods</span>
                    <span className="text-gray-900 dark:text-white font-medium">Cards, Bank</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subscription Management</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">✓ Enabled</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <div className="w-8 h-8"><ZapIcon /></div>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Payment Integration
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Built-in Razorpay gateway — quick to set up and reliable for collecting payments.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Recurring subscriptions", desc: "Charge customers automatically each billing period" },
                  { title: "Razorpay gateway", desc: "Built-in Razorpay connection with a simple setup" },
                  { title: "Clear subscriptions", desc: "Keep each customer's subscriptions easy to understand" },
                  { title: "Live updates", desc: "Instant notifications when payments succeed or need attention" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <div className="w-4 h-4 text-white"><CheckCircleIcon /></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JWT Session Management Section */}
      <section className="px-6 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <div className="w-8 h-8"><LockIcon /></div>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  JWT Session Management
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Scalable session handling with JWT tokens for enhanced security and performance.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Stateless Authentication", desc: "No server-side session storage required for scalability" },
                  { title: "Refresh Tokens", desc: "Automatic token refresh for seamless user experience" },
                  { title: "Session Expiration", desc: "Configurable expiry times with automatic cleanup" },
                  { title: "Multi-Device Support", desc: "Concurrent sessions across multiple devices and browsers" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mt-1">
                      <div className="w-4 h-4 text-white"><CheckCircleIcon /></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-8 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-6">JWT Token Structure</h4>
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-red-400">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Header</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">{"{ alg: 'HS256', typ: 'JWT' }"}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payload</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">
                    {"{ userId, tenantId, roles, exp }"}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-green-400">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signature</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">HMACSHA256(...)</div>
                </div>
              </div>
              
              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>✓ 15min access token expiry</div>
                <div>✓ 7-day refresh token validity</div>
                <div>✓ Automatic rotation on refresh</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DDoS Protection & Traffic Protection Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <div className="w-8 h-8"><ShieldIcon /></div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                DDoS & Traffic Protection
              </h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Multi-layered protection system that handles 10,000+ concurrent users while defending against abuse, 
              brute force attacks, and resource exhaustion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Rate Limiting Card */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  <div className="w-6 h-6"><LockIcon /></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rate Limiting</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  { tier: "Auth Routes", limit: "45 req/15min", desc: "Per IP — stops credential stuffing" },
                  { tier: "Sensitive Routes", limit: "2 req/sec", desc: "Per IP — protects critical actions" },
                  { tier: "API Routes", limit: "100 req/min", desc: "Per IP — standard API access" },
                  { tier: "Read-Only", limit: "200 req/min", desc: "Per IP — GET requests" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{item.tier}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                    </div>
                    <div className="text-sm font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                      {item.limit}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>✓ 43 API routes protected with per-client rate limiting</div>
                <div>✓ Token bucket algorithm for smooth rate limiting</div>
                <div>✓ Limits apply per IP — server handles millions total</div>
              </div>
            </div>

            {/* Traffic Protection Card */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
                  <div className="w-6 h-6"><ServerIcon /></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Traffic Protection</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  { component: "Global Rate Limiter", status: "10M req/sec", color: "text-green-600" },
                  { component: "Burst Capacity", status: "15M requests", color: "text-blue-600" },
                  { component: "Client Tracking", status: "1M unique clients", color: "text-purple-600" },
                  { component: "Circuit Breaker", status: "Cascade prevention", color: "text-red-600" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{item.component}</div>
                    <div className={`text-sm font-medium ${item.color}`}>{item.status}</div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>✓ Hyperscale: 10 million requests/second</div>
                <div>✓ Token Bucket algorithm with burst support</div>
                <div>✓ Redis-compatible for production scaling</div>
              </div>
            </div>
          </div>

          {/* Protection Flow Diagram */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-6 text-center">Request Protection Flow</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Global Limit", desc: "System capacity check", icon: <ActivityIcon /> },
                { step: "2", title: "IP Rate Limit", desc: "Per-client limiting", icon: <UsersIcon /> },
                { step: "3", title: "Cache Check", desc: "Return cached response", icon: <ZapIcon /> },
                { step: "4", title: "Circuit Breaker", desc: "Service health check", icon: <ShieldIcon /> }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="w-5 h-5">{item.icon}</div>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Step {item.step}</div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-400 dark:text-gray-600">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">43</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Routes Protected</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">5K</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Req/sec Capacity</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">10K</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Burst Allowance</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">4</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Protection Layers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Enterprise Architecture
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg mt-1">
                    <div className="w-5 h-5"><ShieldIcon /></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Multi-Tenant Security
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Isolated tenant data with route-level resolution ensuring data privacy and security
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg mt-1">
                    <div className="w-5 h-5"><ZapIcon /></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Payment Gateway Integration
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Built-in support for Stripe, Razorpay with subscription management and invoicing
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mt-1">
                    <div className="w-5 h-5"><LockIcon /></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Protected API Routes
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Middleware-based protection with role-based access control for API endpoints
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Tech Stack
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="text-gray-600 dark:text-gray-400">Framework</div>
                  <div className="font-medium text-gray-900 dark:text-white">Next.js</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600 dark:text-gray-400">Database</div>
                  <div className="font-medium text-gray-900 dark:text-white">PostgreSQL</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600 dark:text-gray-400">Auth</div>
                  <div className="font-medium text-gray-900 dark:text-white">NextAuth.js</div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-600 dark:text-gray-400">ORM</div>
                  <div className="font-medium text-gray-900 dark:text-white">Drizzle</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="px-6 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Ready to Get Started?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">1</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Try it quickly</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Create an account and see how sign-in and subscriptions work in a few clicks.</p>
            </div>
            
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">2</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Customize</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Choose payment providers and branding — no developer required for basic setup.</p>
            </div>
            
            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-xl transform transition-transform duration-300 hover:-translate-y-2 shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">3</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Go live</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Launch your secure login and subscriptions to customers with confidence.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signup" className="inline-block px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-transform duration-200 transform hover:scale-105">
              Get Started — Free Trial
            </a>
          </div>
        </div>
      </section> 
    </main>
  );
}
