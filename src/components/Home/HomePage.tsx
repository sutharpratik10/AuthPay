"use client"

import React from 'react';
import { Shield, Lock, Users, Zap, Globe, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const oauthProviders = [
    { name: "Google", color: "bg-red-500" },
    { name: "GitHub", color: "bg-gray-800" },
    { name: "Facebook", color: "bg-blue-600" },
    { name: "Microsoft", color: "bg-blue-500" },
    { name: "Apple", color: "bg-black" }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
            <Shield className="w-4 h-4" />
            Production-Ready Authentication
          </div>

          {/* Main Title */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
            AuthPay
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-4xl mx-auto">
            Next.js Authentication, Payments & Multi‑Tenant API Layer
          </p>
          
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Modular authentication, payment, and API layer with comprehensive OAuth support, 
            multi-tenant architecture, and enterprise-grade security features.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">5+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">OAuth Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">JWT</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Session Management</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">RBAC</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Multi-Tenant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Email/Password Authentication Section */}
      <section className="px-6 py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Email/Password Authentication
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Secure authentication with bcrypt hashing and comprehensive email verification system.
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
                      <CheckCircle className="w-4 h-4 text-white" />
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
                <div>✓ Secure bcrypt hashing</div>
                <div>✓ Email verification required</div>
                <div>✓ Rate limiting protection</div>
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
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Authenticator App</h4>
                  <div className="grid grid-cols-3 gap-1 max-w-32 mx-auto">
                    {Array.from({length: 6}).map((_, i) => (
                      <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-lg font-mono">
                        {Math.floor(Math.random() * 10)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Time-based OTP</p>
                </div>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>✓ Google Authenticator support</div>
                  <div>✓ Backup codes available</div>
                  <div>✓ Recovery options enabled</div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Enhanced security with TOTP-based 2FA using popular authenticator apps like Google Authenticator.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Time-based OTP", desc: "Secure time-based one-time passwords with 30-second rotation" },
                  { title: "Multiple Apps", desc: "Compatible with Google Authenticator, Authy, and more" },
                  { title: "Backup Codes", desc: "Recovery codes for account access in emergency situations" },
                  { title: "Easy Setup", desc: "Simple QR code scanning for quick authenticator setup" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-white" />
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
      <section className="px-6 py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Globe className="w-8 h-8" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                OAuth Integration
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Seamless login with multiple OAuth providers for improved user experience and faster onboarding.
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  OAuth 2.0
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">One-Click Login</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Users can sign in with their existing accounts from major platforms
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Flow</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OAuth 2.0 standard with PKCE for enhanced security
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
      <section className="px-6 py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Payment Dashboard</h4>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">S</div>
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
                    <span className="text-gray-600 dark:text-gray-400">Multi-Tenant Billing</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">✓ Enabled</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <Zap className="w-8 h-8" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Payment Integration
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Built-in payment gateway with Stripe and Razorpay support for comprehensive billing solutions.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Subscription Management", desc: "Recurring billing with automated invoice generation" },
                  { title: "Multiple Gateways", desc: "Support for Stripe, Razorpay, and custom payment providers" },
                  { title: "Tenant-Aware Billing", desc: "Isolated billing per tenant with custom pricing" },
                  { title: "Webhook Integration", desc: "Real-time payment status updates and notifications" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-white" />
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
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Lock className="w-8 h-8" />
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
                      <CheckCircle className="w-4 h-4 text-white" />
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

      {/* Architecture Highlights */}
      <section className="px-6 py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Enterprise Architecture
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg mt-1">
                    <Shield className="w-5 h-5" />
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
                    <Zap className="w-5 h-5" />
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
                    <Lock className="w-5 h-5" />
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
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Ready to Get Started?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">1</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Clone & Install</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Clone the repository and install dependencies with npm
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">2</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Configure</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Set up environment variables and OAuth providers
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">3</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Deploy</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Launch your secure authentication system
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
              View Documentation
            </button>
            <button className="px-8 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-lg transition-colors duration-200">
              GitHub Repository
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
