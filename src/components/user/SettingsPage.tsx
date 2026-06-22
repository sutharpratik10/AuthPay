"use client"

import { useState, useEffect } from "react"
import Loading from '@/components/Loading'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, Check } from "lucide-react"

interface UserPreferences {
  emailNotifications: boolean
  securityAlerts: boolean
  productUpdates: boolean
  profileVisibility: boolean
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    profileVisibility: true,
  })

  // Load data - languages, timezones, and user preferences (one time only)
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const loadData = async () => {
      // Prevent concurrent calls during React Strict Mode
      if (isFetching) {
        console.log('[SETTINGS] Data fetch already in progress, skipping...');
        return;
      }

      isFetching = true;
      setIsLoadingData(true);

      try {
        const preferencesResponse = await fetch('/api/user/preferences');

        if (!isMounted) return;

        if (preferencesResponse.ok) {
          const preferencesData = await preferencesResponse.json();
          setPreferences(preferencesData);
        } else {
          setMessage({ type: 'error', text: 'Failed to load settings data' });
        }
      } catch {
        if (isMounted) {
          setMessage({ type: 'error', text: 'Failed to load settings data' });
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
          setMounted(true);
        }
        isFetching = false;
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once on mount

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const dataToSave = {
        ...preferences,
      };

      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Settings saved successfully!' });

      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save settings.' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  const updatePreference = (key: keyof UserPreferences, value: boolean | string | number | null) => {
    // Prevent unnecessary updates
    if (preferences[key] === value) {
      return;
    }

    // Update local state
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!mounted || isLoadingData) {
    return <Loading text="Loading settings..." />
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your experience and preferences</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' && <Check className="w-4 h-4" />}
              {message.text}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="security-alerts" className="text-sm font-medium">Security Alerts</label>
                <p className="text-xs text-muted-foreground">Get notified about security events</p>
              </div>
              <Switch
                id="security-alerts"
                checked={preferences.securityAlerts}
                onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="product-updates" className="text-sm font-medium">Product Updates</label>
                <p className="text-xs text-muted-foreground">Receive updates about new features</p>
              </div>
              <Switch
                id="product-updates"
                checked={preferences.productUpdates}
                onCheckedChange={(checked) => updatePreference('productUpdates', checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
