"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bell, Shield, Palette, Globe, Check } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    profileVisibility: true,
    language: 'en-US',
    timezone: 'UTC-8',
    theme: 'system'
  })
  useEffect(() => {
    setMounted(true)
    // Load user preferences when component mounts
    loadUserPreferences()
  }, [])
  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
        // Sync theme with next-themes
        if (data.theme) {
          setTheme(data.theme)
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message || 'Settings saved successfully!' })
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Failed to save settings.' })
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }
  const updatePreference = (key: string, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    
    // Sync theme changes immediately with next-themes
    if (key === 'theme') {
      setTheme(value as string)
    }
  }

  if (!mounted) {
    return null
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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>              <div className="flex space-x-2 mt-2">
                <Button 
                  variant={preferences.theme === "light" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => updatePreference('theme', 'light')}
                >
                  Light
                </Button>
                <Button 
                  variant={preferences.theme === "dark" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => updatePreference('theme', 'dark')}
                >
                  Dark
                </Button>
                <Button 
                  variant={preferences.theme === "system" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => updatePreference('theme', 'system')}
                >
                  System
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h2>
          <div className="space-y-4">            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              />
            </div>              <div className="flex items-center justify-between">
              <div>
                <label htmlFor="security-alerts" className="text-sm font-medium">Security Alerts</label>
                <p className="text-xs text-muted-foreground">Get notified about security events</p>
              </div>
              <Switch
                id="security-alerts"
                checked={preferences.securityAlerts}
                onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
              />
            </div>              <div className="flex items-center justify-between">
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

        {/* Privacy Settings */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Shield className="w-5 h-5 mr-2" />
            Privacy & Security
          </h2>
          <div className="space-y-4">            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="profile-visibility" className="text-sm font-medium">Profile Visibility</label>
                <p className="text-xs text-muted-foreground">Make your profile visible to others</p>
              </div>
              <Switch
                id="profile-visibility"
                checked={preferences.profileVisibility}
                onCheckedChange={(checked) => updatePreference('profileVisibility', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Two-Factor Authentication</label>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Data Export</label>
                <p className="text-xs text-muted-foreground">Download a copy of your data</p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Globe className="w-5 h-5 mr-2" />
            Language & Region
          </h2>
          <div className="space-y-4">            <div>
              <label htmlFor="language-select" className="text-sm font-medium">Language</label>
              <div className="mt-1">
                <Select
                  value={preferences.language}
                  onValueChange={(value) => updatePreference('language', value)}
                  options={[
                    { value: "en-US", label: "English (US)" },
                    { value: "en-GB", label: "English (UK)" },
                    { value: "es", label: "Spanish" },
                    { value: "fr", label: "French" },
                    { value: "de", label: "German" }
                  ]}
                />
              </div>
            </div>
              <div>
              <label htmlFor="timezone-select" className="text-sm font-medium">Timezone</label>
              <div className="mt-1">
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => updatePreference('timezone', value)}
                  options={[
                    { value: "UTC-8", label: "UTC-8 (Pacific Time)" },
                    { value: "UTC-5", label: "UTC-5 (Eastern Time)" },
                    { value: "UTC+0", label: "UTC+0 (Greenwich Mean Time)" },
                    { value: "UTC+1", label: "UTC+1 (Central European Time)" }
                  ]}
                />
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
