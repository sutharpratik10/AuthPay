"use client"

import React, { useState } from 'react';
import { Cookie, Settings, CheckCircle, X, Shield, Eye, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCookieConsent } from '@/hooks/use-cookie-consent';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export default function CookieBanner() {
  const { shouldShowBanner, acceptAll, rejectAll, saveConsent, isLoading } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  // Debug logging
  console.log('CookieBanner render:', { isLoading, shouldShowBanner: shouldShowBanner() });

  // Don't render if loading or consent already given
  if (isLoading || !shouldShowBanner()) {
    return null;
  }

  const handleCookieToggle = (type: keyof CookieSettings) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleAcceptSelected = () => {
    saveConsent(cookieSettings);
    setShowDetails(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setShowDetails(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowDetails(false);
  };

  const cookieTypes = [
    {
      id: 'essential' as const,
      title: 'Essential Cookies',
      description: 'Required for basic website functionality, security, and user authentication.',
      icon: <Shield className="w-5 h-5" />,
      examples: 'Session management, authentication, security tokens',
      required: true,
      enabled: cookieSettings.essential,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website to improve user experience.',
      icon: <Eye className="w-5 h-5" />,
      examples: 'Page views, user behavior, performance metrics',
      required: false,
      enabled: cookieSettings.analytics,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'Used to track visitors across websites for advertising and marketing purposes.',
      icon: <Zap className="w-5 h-5" />,
      examples: 'Ad personalization, conversion tracking, remarketing',
      required: false,
      enabled: cookieSettings.marketing,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'preferences' as const,
      title: 'Preference Cookies',
      description: 'Remember your choices and settings for a personalized experience.',
      icon: <Users className="w-5 h-5" />,
      examples: 'Language settings, theme preferences, UI customization',
      required: false,
      enabled: cookieSettings.preferences,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  if (showDetails) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowDetails(false)}
        />
        
        {/* Cookie Settings Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Cookie className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cookie Preferences</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage how we use cookies on AuthPay</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                title="Close cookie preferences"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {cookieTypes.map((cookie) => (
                  <div key={cookie.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`${cookie.color}`}>
                            {cookie.icon}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {cookie.title}
                          </h3>
                          {cookie.required && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {cookie.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <strong>Examples:</strong> {cookie.examples}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleCookieToggle(cookie.id)}
                          disabled={cookie.required}
                          title={cookie.required ? 'Required cookies cannot be disabled' : `Toggle ${cookie.title}`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            cookie.enabled 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          } ${cookie.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cookie.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Information */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Your Privacy Matters:</strong> You can change these settings at any time. 
                  For more information, see our{' '}
                  <Link 
                    href="/cookies" 
                    className="underline hover:no-underline inline-flex items-center gap-1 text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-200"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Cookie Policy
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m5-3h3m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  {' '}and{' '}
                  <Link 
                    href="/privacy" 
                    className="underline hover:no-underline inline-flex items-center gap-1 text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-200"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Privacy Policy
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m5-3h3m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accept All
              </button>
              
              <button
                onClick={handleAcceptSelected}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Save Preferences
              </button>
              
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject All
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Simple banner (default view)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Icon and Message */}
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex-shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                We use cookies to enhance your experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This site uses cookies for authentication, analytics, and personalization. 
                You can customize your preferences or learn more in our{' '}
                <Link 
                  href="/privacy" 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                  target="_blank" rel="noopener noreferrer"
                >
                  Privacy Policy
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m5-3h3m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Accept All
            </button>
            
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              Customize
            </button>
            
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Reject All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
