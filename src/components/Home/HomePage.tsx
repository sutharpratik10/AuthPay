"use client"

import React, { useState } from 'react';

export default function HomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    {
      question: "How secure is the OTP system?",
      answer: "Our OTP system uses industry-standard algorithms with time-based expiry, rate limiting, and anti-replay protection. All OTPs are cryptographically secure and transmitted over encrypted channels."
    },
    {
      question: "Can I customize the authentication flow?",
      answer: "Yes, the system is highly customizable. You can modify email templates, adjust OTP expiry times, configure 2FA requirements, and integrate with your existing user interface."
    },
    {
      question: "What compliance standards does it meet?",
      answer: "The system is designed to meet GDPR, SOC 2, ISO 27001, and HIPAA compliance requirements. We provide audit logs, data encryption, and privacy controls out of the box."
    },
    {
      question: "Is there ongoing support included?",
      answer: "Yes, both licenses include 12 months of support covering bug fixes, security updates, and technical assistance. Extended support plans are available for purchase."
    },
    {
      question: "Can I white-label the solution?",
      answer: "The Extended License includes white-labeling rights, allowing you to rebrand the solution and integrate it seamlessly with your products or services."
    }
  ];

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="mb-6 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white border-0 shadow-lg rounded-full inline-block">
              🚀 Production-Ready Authentication System
            </div>            {/* Main Headline */}            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-slate-900 dark:text-white leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-gray-200 dark:to-zinc-200 bg-clip-text text-transparent">
                Enterprise-Grade
              </span>
              <br />
              <span className="relative bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-gray-200 dark:to-zinc-200 bg-clip-text text-transparent">
                Authentication System
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600 rounded-full" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-12 text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Complete, secure, and scalable authentication solution with{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">email-based OTP</span>,{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">2FA</span>, and{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">enterprise security</span> features.
              Ready to deploy and customize for your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 dark:from-slate-600 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-900 text-white shadow-xl rounded-xl transition-all duration-300 hover:scale-105">
                Purchase & Download
              </button>
              <button className="px-8 py-4 text-lg font-semibold border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300">
                Live Demo
              </button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">99.9%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">10M+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Auth Requests/Day</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">SOC 2</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Showcase */}
      <section className="py-20 bg-white/50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Comprehensive Authentication Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Everything you need for secure, scalable authentication in one complete solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Email OTP Authentication",
                description: "Secure, passwordless login with email-based one-time passwords. No more forgotten passwords or credential theft.",
                details: ["Time-based OTP tokens", "Customizable expiry", "Rate limiting protection", "Anti-spam measures"]
              },
              {
                title: "Two-Factor Authentication",
                description: "Enhanced security with TOTP-based 2FA using popular authenticator apps like Google Authenticator.",
                details: ["TOTP support", "Backup codes", "Recovery options", "App-based generation"]
              },
              {
                title: "Session Management",
                description: "Advanced session handling with secure tokens, automatic expiry, and device tracking.",
                details: ["JWT tokens", "Refresh tokens", "Device fingerprinting", "Concurrent session limits"]
              },
              {
                title: "User Management",
                description: "Complete user lifecycle management with roles, permissions, and profile customization.",
                details: ["Role-based access", "Custom fields", "User import/export", "Profile management"]
              },
              {
                title: "Admin Dashboard",
                description: "Comprehensive admin interface for monitoring, managing users, and configuring security settings.",
                details: ["Real-time analytics", "User activity logs", "Security monitoring", "Configuration management"]
              },
              {
                title: "API-First Architecture",
                description: "RESTful APIs with comprehensive documentation for seamless integration with any application.",
                details: ["REST APIs", "Webhook support", "SDK libraries", "OpenAPI documentation"]
              }
            ].map((feature, index) => (
              <div key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-slate-900 border-0 shadow-lg rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                </div>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <span className="w-4 h-4 text-green-500 mr-2 flex-shrink-0">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Built with security-first principles and compliance requirements in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                title: "End-to-End Encryption",
                description: "AES-256 encryption for data at rest and TLS 1.3 for data in transit"
              },
              {
                title: "Threat Detection",
                description: "Real-time monitoring for suspicious activities and automated threat response"
              },
              {
                title: "Device Fingerprinting",
                description: "Advanced device identification and tracking for enhanced security"
              },
              {
                title: "Audit Logging",
                description: "Comprehensive audit trails for compliance and security investigations"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 border border-white/20 backdrop-blur-sm text-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-blue-100">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Compliance Badges */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Compliance & Standards</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {['GDPR', 'SOC 2', 'ISO 27001', 'HIPAA', 'PCI DSS'].map((standard) => (
                <span key={standard} className="bg-white/20 text-white border border-white/30 px-6 py-3 text-lg font-semibold rounded-full">
                  {standard}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Choose Your License
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              One-time purchase, perpetual license. No recurring fees or hidden costs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Developer License */}
            <div className="relative p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
              <div className="w-fit mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Developer License
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-blue-600">$499</span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">one-time</span>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                Perfect for individual developers, startups, and internal business use
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Complete authentication system',
                  'Email OTP & 2FA support',
                  'Admin dashboard included',
                  'PostgreSQL & Redis setup',
                  'Docker containerization',
                  'API documentation',
                  '12 months support',
                  'Free updates for 1 year'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="w-5 h-5 text-green-500 mr-3 flex-shrink-0">✓</span>
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  For internal use only. No resale or redistribution rights.
                </p>
              </div>
              <button className="w-full py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                Purchase Developer License
              </button>
            </div>            {/* Commercial License */}
            <div className="relative p-8 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-2 border-slate-300 dark:border-slate-600 shadow-2xl rounded-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white px-6 py-2 text-sm font-bold rounded-full">
                  ⭐ COMMERCIAL
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 mt-4">
                Commercial License
              </h3>              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent">$1,499</span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">one-time</span>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                For agencies, SaaS platforms, and commercial products
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Developer License',
                  'Commercial redistribution rights',
                  'White-label customization',
                  'Priority support & consultation',
                  'Custom branding options',
                  'Extended documentation',
                  'Resale & bundling permitted',
                  'Lifetime updates included'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="w-5 h-5 text-green-500 mr-3 flex-shrink-0">✓</span>
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Full commercial rights including resale and redistribution.
                </p>
              </div>
              <button className="w-full py-4 text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 dark:from-slate-600 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-900 text-white rounded-xl transition-colors">
                Purchase Commercial License
              </button>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-6 py-3 rounded-full">
              <span className="mr-2">🛡️</span>
              30-day money-back guarantee
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Everything you need to know about our authentication system
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-lg shadow-lg">
                <div 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors p-6"
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {faq.question}
                    </h3>
                    <span className="text-slate-600 dark:text-slate-400 text-xl">
                      {faqOpen === index ? "−" : "+"}
                    </span>
                  </div>
                </div>
                {faqOpen === index && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Secure Your Application?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-slate-200">
            Join thousands of developers who trust our authentication system for their mission-critical applications.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button className="px-8 py-4 text-lg font-bold bg-white text-blue-600 hover:bg-blue-50 shadow-xl rounded-xl transition-all duration-300 hover:scale-105">
              Get Started Today
            </button>
            <button className="px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white/10 rounded-xl transition-all duration-300">
              Talk to Sales
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              30-day money-back guarantee
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              No recurring fees
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              Instant download
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
