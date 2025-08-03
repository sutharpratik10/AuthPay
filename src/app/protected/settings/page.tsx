"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bell, Palette, Globe, Check } from "lucide-react"
import { useTheme } from "next-themes"

interface Language {
  id: number
  name: string
  code: string
  nativeName: string
}

interface Timezone {
  id: number
  name: string
  code: string
  utcOffset: string
  description: string
}

interface UserPreferences {
  emailNotifications: boolean
  securityAlerts: boolean
  productUpdates: boolean
  profileVisibility: boolean
  languageId: number | null
  timezoneId: number | null
  theme: string
  language?: Language | null
  timezone?: Timezone | null
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    profileVisibility: true,
    languageId: null,
    timezoneId: null,
    theme: 'system'
  })  // Load data - languages, timezones, and user preferences (one time only)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        // Load languages and timezones in parallel
        const [languagesResponse, timezonesResponse, preferencesResponse] = await Promise.all([
          fetch('/api/languages'),
          fetch('/api/timezones'),
          fetch('/api/user/preferences')
        ])

        if (isMounted) {
          // Load languages
          if (languagesResponse.ok) {
            const languagesData = await languagesResponse.json()
            setLanguages(languagesData)
          }

          // Load timezones
          if (timezonesResponse.ok) {
            const timezonesData = await timezonesResponse.json()
            setTimezones(timezonesData)
          }

          // Load user preferences
          if (preferencesResponse.ok) {
            const preferencesData = await preferencesResponse.json()
            setPreferences(preferencesData)
            
            // Set theme from preferences on initial load only
            if (preferencesData.theme && preferencesData.theme !== theme) {
              setTheme(preferencesData.theme)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        if (isMounted) {
          setMessage({ type: 'error', text: 'Failed to load settings data' })
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
          setMounted(true)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false;
    }
  }, []) // Only run once on mount
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const dataToSave = {
        ...preferences,
        theme: preferences.theme,
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

        // Apply the theme immediately after saving
        setTheme(preferences.theme);
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

    // For theme changes, apply immediately for preview
    if (key === 'theme' && typeof value === 'string') {
      setTheme(value);
    }
  };

  if (!mounted || isLoadingData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    )
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

        {/* Appearance Settings */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Palette className="w-5 h-5 mr-2" />
            Appearance
          </h2>
          <div className="space-y-4">            <div>
              <label className="text-sm font-medium">Theme</label>              <div className="flex space-x-2 mt-2">
                <Button 
                  variant={preferences.theme === "light" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    console.log('Light theme clicked')
                    updatePreference('theme', 'light')
                  }}
                >
                  Light
                </Button>
                <Button 
                  variant={preferences.theme === "dark" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    console.log('Dark theme clicked')
                    updatePreference('theme', 'dark')
                  }}
                >
                  Dark
                </Button>
                <Button 
                  variant={preferences.theme === "system" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    console.log('System theme clicked')
                    updatePreference('theme', 'system')
                  }}
                >
                  System
                </Button>
              </div><p className="text-xs text-muted-foreground mt-2">
                Current theme: {theme} | Resolved: {resolvedTheme} | Preference: {preferences.theme}
              </p>
            </div>
          </div>
        </div>

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
            </div>          </div>
        </div>        {/* Language & Region */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Globe className="w-5 h-5 mr-2" />
            Language & Region
          </h2>
          <div className="space-y-4">            <div>
              <label htmlFor="language-select" className="text-sm font-medium">Language</label>              <div className="mt-1">
                {languages.length > 0 ? (
                  <Select
                    value={preferences.languageId?.toString() || ''}
                    onValueChange={(value) => updatePreference('languageId', value || null)}
                    placeholder="Select Language"
                    options={languages.map(lang => ({
                      value: lang.id.toString(),
                      label: `${lang.name} (${lang.nativeName})`
                    }))}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Loading languages...</div>
                )}
              </div>
              
              
            </div>
              <div>
              <label htmlFor="timezone-select" className="text-sm font-medium">Timezone</label>              
              <div className="mt-1">
                {timezones.length > 0 ? (
                  <Select
                    value={preferences.timezoneId?.toString() || ''}
                    onValueChange={(value) => updatePreference('timezoneId', value || null)}
                    placeholder="Select Timezone"
                    options={timezones.map(tz => ({
                      value: tz.id.toString(),
                      label: `${tz.description} (${tz.utcOffset})`
                    }))}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Loading timezones...</div>
                )}
              </div>
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
