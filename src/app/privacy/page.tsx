"use client"

import React from 'react';
import { Shield, Lock, Eye, Users, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
              <p className="text-gray-600 dark:text-gray-400">How {APP_CONFIG.APP_NAME} protects and handles your personal data</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Our Commitment to Your Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              At {APP_CONFIG.APP_NAME}, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              authentication and payment services.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Last Updated:</strong> September 20, 2025
            </p>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Information We Collect</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Email address</li>
                <li>• Name and profile information</li>
                <li>• Authentication credentials</li>
                <li>• Two-factor authentication data</li>
                <li>• Payment information (encrypted)</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Usage Information</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Login timestamps and IP addresses</li>
                <li>• Device and browser information</li>
                <li>• Session data and preferences</li>
                <li>• API usage and access patterns</li>
                <li>• Security events and logs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How We Use Your Information</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Authentication & Security
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                We use your information to provide secure authentication services, verify your identity, 
                and protect your account from unauthorized access.
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Verify user identity and manage sessions</li>
                <li>• Enable two-factor authentication</li>
                <li>• Detect and prevent fraud</li>
                <li>• Monitor for security threats</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Service Provision
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                We process your data to deliver our authentication and payment services effectively.
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Process payments and subscriptions</li>
                <li>• Manage user accounts and preferences</li>
                <li>• Provide customer support</li>
                <li>• Send important service notifications</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How We Protect Your Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Encryption</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All data is encrypted in transit and at rest using industry-standard AES-256 encryption.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Access Control</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Strict access controls ensure only authorized personnel can access your data.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Monitoring</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Continuous monitoring and logging to detect and respond to security incidents.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Sharing and Disclosure</h2>
          
          <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">We DO NOT sell your personal data</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {APP_CONFIG.APP_NAME} will never sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
            
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">We may share data only in these limited circumstances:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>Service Providers:</strong> Trusted partners who help us operate our services (payment processors, cloud providers)</li>
              <li>• <strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li>• <strong>Security:</strong> To protect our users&apos; safety and investigate fraud or security issues</li>
              <li>• <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with user notification)</li>
            </ul>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Privacy Rights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Access & Control</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Access your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Delete your account and data</li>
                <li>• Export your data</li>
                <li>• Opt-out of communications</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">GDPR Rights (EU Users)</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Right to rectification</li>
                <li>• Right to erasure (&ldquo;right to be forgotten&rdquo;)</li>
                <li>• Right to restrict processing</li>
                <li>• Right to data portability</li>
                <li>• Right to object to processing</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Retention</h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We retain your personal data only as long as necessary for the purposes outlined in this privacy policy:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>Account Data:</strong> Retained while your account is active</li>
              <li>• <strong>Authentication Logs:</strong> 90 days for security purposes</li>
              <li>• <strong>Payment Data:</strong> As required by financial regulations (typically 7 years)</li>
              <li>• <strong>Support Records:</strong> 3 years after case closure</li>
              <li>• <strong>Marketing Data:</strong> Until you unsubscribe or object</li>
            </ul>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cookies and Tracking</h2>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your experience. For detailed information about our cookie usage, 
              please see our dedicated <Link href="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline">Cookie Policy</Link>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can manage your cookie preferences through our cookie settings or your browser settings.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Email</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">privacy@authpay.dev</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Data Protection Officer</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">support@authpay.dev</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">For general inquiries</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Policy Updates</h2>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <li>• Posting the updated policy on our website</li>
              <li>• Sending an email notification for significant changes</li>
              <li>• Displaying a notice in our application</li>
            </ul>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your continued use of our services after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </div>
        </section>

        {/* Return Home */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
