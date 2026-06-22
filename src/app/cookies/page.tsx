"use client"

import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Settings, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_CONFIG } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export default function CookiePolicyPage() {
  const router = useRouter();
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    preferences: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing cookie preferences on component mount
  useEffect(() => {
    const loadCookiePreferences = () => {
      try {
        const savedConsent = localStorage.getItem('cookieConsent');
        if (savedConsent) {
          const parsed = JSON.parse(savedConsent);
          setCookieSettings({
            essential: true, // Always true
            analytics: parsed.analytics || false,
            marketing: parsed.marketing || false,
            preferences: parsed.preferences || false
          });
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCookiePreferences();
  }, []);

  // Apply cookie settings to the browser
  const applyCookieSettings = (settings: CookieSettings) => {
    try {
      // Remove all non-essential cookies first
      if (!settings.analytics) {
        // Remove analytics cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('_ga') || name.includes('_gid') || name.includes('analytics')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      if (!settings.marketing) {
        // Remove marketing cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('marketing') || name.includes('ads') || name.includes('fb')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      if (!settings.preferences) {
        // Remove preference cookies (except theme)
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('pref') && !name.includes('theme')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      // Set consent cookies
      if (settings.analytics) {
        document.cookie = 'analytics_consent=true;path=/;max-age=31536000;SameSite=Strict';
      }
      if (settings.marketing) {
        document.cookie = 'marketing_consent=true;path=/;max-age=31536000;SameSite=Strict';
      }
      if (settings.preferences) {
        document.cookie = 'preferences_consent=true;path=/;max-age=31536000;SameSite=Strict';
      }

      // Always set essential consent
      document.cookie = 'essential_consent=true;path=/;max-age=31536000;SameSite=Strict';

    } catch (error) {
      console.error('Error applying cookie settings:', error);
    }
  };

  const handleCookieToggle = (type: keyof CookieSettings) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled

    setCookieSettings(prev => {
      const newSettings = {
        ...prev,
        [type]: !prev[type]
      };
      setHasChanges(true);
      return newSettings;
    });
  };

  const saveCookiePreferences = (settings: CookieSettings) => {
    try {
      const consentData = {
        ...settings,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem('cookieConsent', JSON.stringify(consentData));
      applyCookieSettings(settings);

      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
        detail: consentData
      }));

      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
      return false;
    }
  };

  const handleAcceptAll = () => {
    const newSettings = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };

    setCookieSettings(newSettings);

    if (saveCookiePreferences(newSettings)) {
      router.push('/');
    }
  };

  const handleAcceptSelected = () => {
    if (saveCookiePreferences(cookieSettings)) {
      router.push('/');
    }
  };

  const handleRejectAll = () => {
    const newSettings = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };

    setCookieSettings(newSettings);

    if (saveCookiePreferences(newSettings)) {
      router.push('/');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Cookie className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading cookie preferences...</p>
        </div>
      </div>
    );
  }

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      examples: 'Authentication, security, session management',
      required: true,
      enabled: cookieSettings.essential
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: 'Page views, user behavior, performance metrics',
      required: false,
      enabled: cookieSettings.analytics
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites for advertising purposes.',
      examples: 'Ad personalization, conversion tracking, remarketing',
      required: false,
      enabled: cookieSettings.marketing
    },
    {
      id: 'preferences',
      title: 'Preference Cookies',
      description: 'These cookies allow the website to remember choices you make for a customized experience.',
      examples: 'Language settings, theme preferences, user interface customization',
      required: false,
      enabled: cookieSettings.preferences
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cookie Policy</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your cookie preferences for {APP_CONFIG.APP_NAME}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <div className="bg-blue-50 dark:bg-neutral-800 p-6 rounded-xl border border-blue-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              About Our Cookie Usage
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {APP_CONFIG.APP_NAME} uses cookies and similar technologies to enhance your experience, provide personalized content,
              and analyze our traffic. This policy explains what cookies are, how we use them, and how you can control them.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              By using our website, you consent to our use of cookies in accordance with this policy and your preferences below.
            </p>
          </div>
        </section>

        {/* What are Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What Are Cookies?</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Cookies are small text files that are stored on your device when you visit a website. They are widely used
              to make websites work more efficiently and to provide information to website owners.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Cookies can be &ldquo;persistent&rdquo; (remain on your device until deleted) or &ldquo;session&rdquo; (deleted when you close your browser).
            </p>
          </div>
        </section>

        {/* Cookie Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cookie Categories</h2>
          <div className="space-y-6">
            {cookieTypes.map((cookie) => (
              <div key={cookie.id} className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {cookie.title}
                      </h3>
                      {cookie.required && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {cookie.description}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <strong>Examples:</strong> {cookie.examples}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleCookieToggle(cookie.id as keyof typeof cookieSettings)}
                      disabled={cookie.required}
                      title={cookie.required ? 'Required cookies cannot be disabled' : `Toggle ${cookie.title}`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cookie.enabled
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                        } ${cookie.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cookie.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How We Use Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How We Use Cookies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Authentication & Security</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-200">
                <li>• Maintain your login session</li>
                <li>• Verify your identity</li>
                <li>• Prevent unauthorized access</li>
                <li>• Enable two-factor authentication</li>
              </ul>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Personalization</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-200">
                <li>• Remember your preferences</li>
                <li>• Store theme settings</li>
                <li>• Maintain language choices</li>
                <li>• Customize user interface</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Cookie Rights</h2>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>You have the right to:</p>
              <ul className="space-y-2 ml-4">
                <li>• Accept or reject non-essential cookies</li>
                <li>• Change your cookie preferences at any time</li>
                <li>• Delete cookies from your browser</li>
                <li>• Use browser settings to block cookies</li>
                <li>• Request information about cookies we use</li>
              </ul>
              <p className="text-sm">
                <strong>Note:</strong> Disabling essential cookies may affect website functionality.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h2>
          <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-xl">
            <p className="text-gray-600 dark:text-gray-100 mb-4">
              If you have any questions about our cookie policy or how we handle your data, please contact us:
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-200">
              <p><strong>Email:</strong> privacy@authpay.app</p>
              <p><strong>Last Updated:</strong> September 20, 2025</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-800 p-6 -mx-6">
          {hasChanges && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                You have unsaved changes to your cookie preferences.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleAcceptAll}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Accept All Cookies
            </Button>

            <Button
              onClick={handleAcceptSelected}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Save & Continue
            </Button>

            <Button
              onClick={handleRejectAll}
              className="px-8 py-3 border  text-gray-700 border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Reject All
            </Button>
          </div>

          <div className="text-center mt-4">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Return to Home
            </Link>
          </div>

          {/* Cookie Status Indicator */}
          <div className="text-center mt-2">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
              {hasChanges ? 'Changes pending' : 'Settings saved'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
