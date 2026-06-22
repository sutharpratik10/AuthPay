'use client';

import React from 'react';
import { Footer } from '../layout/footer';
import { APP_CONFIG } from '@/lib/utils/constants';

// Minimal SVG Icons
const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const features = [
  {
    icon: ShieldIcon,
    title: "Secure Authentication",
    description: "Enterprise-grade auth with OAuth, MFA, and session management built in.",
  },
  {
    icon: CreditCardIcon,
    title: "Seamless Payments",
    description: "Accept payments globally with built-in gateway integrations and subscription billing.",
  },
  {
    icon: KeyIcon,
    title: "Role-Based Access",
    description: "Fine-grained RBAC policies to control exactly who can access what in your app.",
  },
  {
    icon: ChartIcon,
    title: "Usage Analytics",
    description: "Track authentication events, payment success rates, and user activity in real time.",
  },
];

const benefits = [
  "OAuth & social login",
  "Subscription management",
  "Multi-factor authentication",
  "Instant payment processing",
  "Role-based permissions",
  "Automated notifications",
];

const useCases = [
  { name: "SaaS Platforms", emoji: "🚀" },
  { name: "E-Commerce", emoji: "🛒" },
  { name: "Marketplaces", emoji: "🏪" },
  { name: "Fintech Apps", emoji: "💳" },
  { name: "Enterprise", emoji: "🏢" },
  { name: "Startups", emoji: "⚡" },
];

export default function HomePage() {
  const appName = APP_CONFIG.APP_NAME;

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">

        {/* Hero Section - Clean & Minimal */}
        <section className="relative px-6 pt-20 pb-32 lg:pt-28 lg:pb-40 overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] bg-gradient-to-br from-neutral-100/50 via-transparent to-stone-100/50 dark:from-neutral-800/20 dark:to-stone-800/20 blur-3xl opacity-60" />

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/50 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Trusted by 10,000+ developers & businesses
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
              Authentication & Payments,{' '}
              <span className="text-neutral-600 dark:text-neutral-300 italic">
                done right
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {appName} gives you secure auth and seamless payment processing out of the box.
              Ship faster, stay secure, and get paid — all in one platform.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="/auth/signup"
                className="group flex items-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-full shadow-lg shadow-neutral-900/10 dark:shadow-white/10 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-neutral-900/20 dark:hover:shadow-white/20 hover:-translate-y-0.5"
              >
                Get Started Free
                <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </a>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Free 14-day trial • No card required • Cancel anytime
            </p>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="px-6 py-12 border-y border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "99.9%", label: "Auth Uptime" },
                { value: "10K+", label: "Active Users" },
                { value: "<100ms", label: "Avg Response" },
                { value: "4.9★", label: "Developer Rating" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 lg:py-28">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Everything you need, nothing you don&apos;t
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                A focused platform that handles auth and payments so you can focus on building your product.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 transition-all duration-500 ease-out hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mb-4 transition-all duration-500 ease-out group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 group-hover:scale-110">
                    <feature.icon />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Checklist */}
        <section className="px-6 py-20 lg:py-28 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
                  Built for modern web applications
                </h2>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                  No complex infrastructure. No vendor lock-in. Just a robust, developer-friendly platform that grows with you.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-transform duration-300 ease-out group-hover:scale-110">
                        <CheckIcon />
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simple visual */}
              <div className="relative">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-900/50 border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-1">
                  {/* Mini payment preview */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="font-medium text-neutral-900 dark:text-white">Payment Processed</span>
                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">Success</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Plan</span>
                      <span className="text-neutral-900 dark:text-white">Pro Monthly</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Amount</span>
                      <span className="text-neutral-900 dark:text-white">$29.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Auth Method</span>
                      <span className="text-neutral-900 dark:text-white">OAuth 2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">User</span>
                      <span className="text-neutral-900 dark:text-white">sarah@example.com</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      ✓ Identity verified • ✓ Receipt sent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 py-20 lg:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Built for every kind of business
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
              From solo founders to enterprise teams, {appName} scales with your needs.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {useCases.map((useCase, i) => (
                <div
                  key={i}
                  className="group p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-500 ease-out hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:-translate-y-1 cursor-default"
                >
                  <div className="text-3xl mb-2 transition-transform duration-500 ease-out group-hover:scale-110">{useCase.emoji}</div>
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{useCase.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-20 lg:py-28 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Up and running in minutes
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Three simple steps to add auth and payments to your app
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description: "Sign up and configure your authentication providers, roles, and permissions in one place.",
                },
                {
                  step: "02",
                  title: "Connect your payment gateway",
                  description: "Link your payment provider, set up subscription plans, and define pricing in minutes.",
                },
                {
                  step: "03",
                  title: "Ship with confidence",
                  description: "Deploy with enterprise-grade security. Monitor auth events and payments from your dashboard.",
                },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className="text-6xl font-bold text-neutral-100 dark:text-neutral-800 mb-4 transition-all duration-500 ease-out group-hover:text-neutral-200 dark:group-hover:text-neutral-700">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
              Ready to ship securely?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10">
              Join thousands of developers and businesses that trust {appName} for their auth and payment needs.
              Start your free trial today — no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/auth/signup"
                className="group flex items-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-full shadow-lg shadow-neutral-900/20 dark:shadow-white/20 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-neutral-900/30 dark:hover:shadow-white/30 hover:-translate-y-0.5"
              >
                Get Started Free
                <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </a>
              <a
                href="/pricing"
                className="px-8 py-4 text-neutral-700 dark:text-neutral-300 font-medium rounded-full border border-neutral-200 dark:border-neutral-700 transition-all duration-500 ease-out hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
              >
                View pricing
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}


