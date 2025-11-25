"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib"
import { useSession, signOut } from "next-auth/react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Key, Trash2, Upload, Eye, EyeOff, X, Shield, CheckCircle, Loader2, XCircle } from "lucide-react"
import { DeleteAccountModal } from "@/components/user/DeleteAccountModal"
import { calculatePasswordStrength, getPasswordStrengthWidth, type PasswordStrength } from "@/lib/auth/password-strength"

type PasswordStep = 'form' | 'otp' | 'success'

interface UserPreferences {
  emailNotifications: boolean
  securityAlerts: boolean
  productUpdates: boolean
  profileVisibility: boolean
  languageId: number | null
  timezoneId: number | null
  theme: string
  twoFactorAuth?: boolean
  multiFactorAuth?: boolean
  dataExport?: boolean
}

export default function AccountPage() {
  const { user, isEmailVerified } = useAuth()
  const { update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Privacy & Security preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    profileVisibility: true,
    languageId: null,
    timezoneId: null,
    theme: 'system',
    twoFactorAuth: false,
    multiFactorAuth: false,
    dataExport: false
  })

  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('form')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  // OTP states
  const [otp, setOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [tempPasswordData, setTempPasswordData] = useState<{
    currentPassword: string;
    newPassword: string;
  } | null>(null)
  // Prevent duplicate OTP submissions
  const lastSubmittedOtp = useRef<string>("")
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  // Track if user has password (for OAuth users)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Very Weak',
    color: 'bg-red-500',
    suggestions: []
  })

  // Current password validation state
  const [currentPasswordValidation, setCurrentPasswordValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid'
    message?: string
  }>({ status: 'idle' })

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpTimer])

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences(prev => ({
            ...prev,
            emailNotifications: data.emailNotifications ?? true,
            securityAlerts: data.securityAlerts ?? true,
            productUpdates: data.productUpdates ?? false,
            profileVisibility: data.profileVisibility ?? true,
            twoFactorAuth: data.twoFactorAuth ?? false,
            multiFactorAuth: data.multiFactorAuth ?? false,
            dataExport: data.dataExport ?? false
          }))
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }

    loadPreferences()
  }, [])

  // Check if user has password set
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch('/api/user/password-status')
        if (response.ok) {
          const data = await response.json()
          setHasPassword(data.hasPassword)
        }
      } catch (error) {
        console.error('Failed to check password status:', error)
        // Default to true if we can't determine
        setHasPassword(true)
      }
    }

    checkPasswordStatus()
  }, [])

  // Calculate password strength when password changes
  useEffect(() => {
    const strength = calculatePasswordStrength(passwordForm.newPassword)
    setPasswordStrength(strength)
  }, [passwordForm.newPassword])

  // Validate current password with debouncing
  useEffect(() => {
    // Only validate if user has a password and is changing it
    if (hasPassword === false || !showChangePassword) {
      setCurrentPasswordValidation({ status: 'idle' })
      return
    }

    const currentPassword = passwordForm.currentPassword
    
    // Reset if password is empty or too short
    if (!currentPassword || currentPassword.length < 3) {
      setCurrentPasswordValidation({ status: 'idle' })
      return
    }

    // Debounce the validation - reduced to 500ms for faster feedback
    const timeoutId = setTimeout(async () => {
      setCurrentPasswordValidation({ status: 'checking' })
      
      try {
        // Use lightweight validation endpoint (no OTP sending)
        const response = await fetch('/api/auth/validate-current-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword })
        })

        if (response.ok) {
          setCurrentPasswordValidation({ 
            status: 'valid', 
            message: 'Password verified' 
          })
        } else {
          setCurrentPasswordValidation({ 
            status: 'invalid', 
            message: 'Incorrect password' 
          })
        }
      } catch (error) {
        console.error('Password validation error:', error)
        setCurrentPasswordValidation({ 
          status: 'idle'
        })
      }
    }, 500) // Reduced from 800ms to 500ms for faster response

    return () => clearTimeout(timeoutId)
  }, [passwordForm.currentPassword, hasPassword, showChangePassword])

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  // Handle setting password for OAuth users who don't have a password
  const handleSetPassword = async () => {
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' })
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' })
      return
    }

    // Password strength validation
    if (passwordStrength.score < 2) {
      setMessage({ type: 'error', text: 'Password is too weak. Please create a stronger password.' })
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordForm.newPassword
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to set password. Please try again.' 
        })
        return
      }
      
      // Success - update hasPassword state and show success message
      setHasPassword(true)
      setMessage({ type: 'success', text: 'Password set successfully!' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowChangePassword(false)
      
    } catch (error) {
      console.error('Set password error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to set password. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    console.log('=== [Password Change] FUNCTION CALLED ===')
    console.log('[Password Change] Event:', event)
    console.log('[Password Change] Starting password change process...')
    console.log('[Password Change] Has password:', hasPassword)
    console.log('[Password Change] Password strength score:', passwordStrength.score)
    console.log('[Password Change] Form data:', {
      currentPassword: passwordForm.currentPassword ? '***' : 'empty',
      newPassword: passwordForm.newPassword ? '***' : 'empty',
      confirmPassword: passwordForm.confirmPassword ? '***' : 'empty',
      newPasswordLength: passwordForm.newPassword.length,
      passwordsMatch: passwordForm.newPassword === passwordForm.confirmPassword
    })
    
    try {
      // For OAuth users without password, handle setting password
      if (hasPassword === false) {
        console.log('[Password Change] Handling set password for OAuth user')
        return handleSetPassword()
      }
      
      // Validation for users with existing password
      if (!passwordForm.currentPassword) {
        console.log('[Password Change] Validation failed: Current password required')
        setMessage({ type: 'error', text: 'Current password is required!' })
        return
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        console.log('[Password Change] Validation failed: Passwords do not match')
        setMessage({ type: 'error', text: 'New passwords do not match!' })
        return
      }
      
      if (passwordForm.newPassword.length < 8) {
        console.log('[Password Change] Validation failed: Password too short')
        setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' })
        return
      }

      // Password strength validation
      if (passwordStrength.score < 2) {
        console.log('[Password Change] Validation failed: Password too weak, score:', passwordStrength.score)
        setMessage({ type: 'error', text: 'Password is too weak. Please create a stronger password.' })
        return
      }
      
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        console.log('[Password Change] Validation failed: Same as current password')
        setMessage({ type: 'error', text: 'New password must be different from current password!' })
        return
      }
      
      console.log('[Password Change] All validations passed, calling API...')
      setIsLoading(true)
      setMessage(null)
      
      // First, verify current password and send OTP
      console.log('[Password Change] Calling /api/auth/verify-password')
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword
        }),
      })
      
      console.log('[Password Change] API response status:', response.status)
      const result = await response.json()
      console.log('[Password Change] API response data:', result)
      
      if (!response.ok) {
        console.log('[Password Change] API returned error:', result.error)
        setMessage({ 
          type: 'error', 
          text: result.error || 'Current password verification failed. Please check your password and try again.' 
        })
        return
      }
      
      console.log('[Password Change] API call successful, moving to OTP step')
      // Store password data temporarily and move to OTP step
      setTempPasswordData({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordStep('otp')
      setOtpTimer(60) // 60 seconds timer
      setMessage({ type: 'success', text: 'OTP sent to your email address!' })
      console.log('[Password Change] Password change step completed successfully')
      
    } catch (error) {
      console.error('[Password Change] Error during password change:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to process password change. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!tempPasswordData) {
      setMessage({ type: 'error', text: 'Password data not found. Please start over.' })
      setPasswordStep('form')
      return
    }
    
    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP.' })
      return
    }
    
    // Prevent duplicate submission of the same OTP
    if (lastSubmittedOtp.current === otp) {
      setMessage({ type: 'error', text: 'This OTP has already been submitted. Please request a new OTP if needed.' })
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    lastSubmittedOtp.current = otp
    
    try {
      // Verify OTP and change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: tempPasswordData.newPassword,
          otp: otp
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to change password. Please try again.' 
        })
        return
      }
      
      // Success - move to success step
      setPasswordStep('success')
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      
      // Reset form data
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setOtp('')
      setTempPasswordData(null)
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordStep('form')
        setMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('OTP verification error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Invalid OTP or failed to change password. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (!tempPasswordData) {
      setMessage({ type: 'error', text: 'Password data not found. Please start over.' })
      setPasswordStep('form')
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: tempPasswordData.currentPassword
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to resend OTP. Please try again.' 
        })
        return
      }
      
      setOtpTimer(60) // Reset timer
      setOtp('') // Clear OTP input
      lastSubmittedOtp.current = '' // Reset submitted OTP tracker to allow new submission
      setMessage({ type: 'success', text: 'New OTP sent to your email address!' })
      
    } catch (error) {
      console.error('Resend OTP error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cancelPasswordChange = () => {
    setShowChangePassword(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordStep('form')
    setMessage(null)
    lastSubmittedOtp.current = '' // Reset submitted OTP tracker
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const updatePreference = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSavePrivacySettings = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          securityAlerts: preferences.securityAlerts,
          productUpdates: preferences.productUpdates,
          profileVisibility: preferences.profileVisibility,
          languageId: preferences.languageId,
          timezoneId: preferences.timezoneId,
          theme: preferences.theme,
          twoFactorAuth: preferences.twoFactorAuth
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message || 'Privacy settings saved successfully!' })
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Failed to save privacy settings.' })
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      setMessage({ type: 'error', text: 'Failed to save privacy settings. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataExport = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Simulate data export - in reality this would generate a file
      await new Promise(resolve => setTimeout(resolve, 2000))
      setMessage({ type: 'success', text: 'Data export request submitted. You will receive an email with your data within 24 hours.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to initiate data export. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string

    // Validate name
    if (!name || name.trim().length < 1) {
      setMessage({ type: 'error', text: 'Name is required' })
      setIsLoading(false)
      return
    }

    if (name.trim().length > 100) {
      setMessage({ type: 'error', text: 'Name cannot be longer than 100 characters' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to update profile. Please try again.' 
        })
        return
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Trigger session refresh to update user data in the UI
      try {
        await update({
          name: result.user?.name
        })
      } catch (updateError) {
        console.warn('Failed to update session:', updateError)
        // Still show success since the database was updated
      }
      
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Verification email sent successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to send verification email.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async (confirmationText: string) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to delete account. Please try again.' 
        })
        return
      }

      // Show success message briefly before logout
      setMessage({ type: 'success', text: 'Account deleted successfully. Logging out...' })
      
      // Wait a moment to show the message, then sign out
      setTimeout(async () => {
        await signOut({ callbackUrl: '/' })
      }, 2000)
      
    } catch (error) {
      console.error('Account deletion error:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete account. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          twoFactorAuth: enabled
        }),
      })

      if (response.ok) {
        updatePreference('twoFactorAuth', enabled)
        setMessage({ 
          type: 'success', 
          text: enabled 
            ? 'Two-Factor Authentication enabled successfully!' 
            : 'Two-Factor Authentication disabled successfully!' 
        })
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Failed to update 2FA settings.' })
      }
    } catch (error) {
      console.error('Error updating 2FA settings:', error)
      setMessage({ type: 'error', text: 'Failed to update 2FA settings. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account information and security settings</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar
                src={user?.image || undefined}
                fallback={getInitials(user?.name || user?.email)}
                size="lg"
                className="h-16 w-16"
              />
              <div>
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, GIF or PNG. 1MB max.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input 
                  id="name"
                  name="name"
                  defaultValue={user?.name || ""} 
                  placeholder="Enter your full name"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <div className="flex items-center space-x-2">
                    {isEmailVerified ? (
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Mail className="w-3 h-3 mr-1" />
                        Verified
                      </div>
                    ) : (
                      <>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Mail className="w-3 h-3 mr-1" />
                          Pending Verification
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={handleResendVerification}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Resend Verification'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Input 
                  id="email"
                  name="email"
                  defaultValue={user?.email || ""} 
                  disabled
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change your email address
                </p>
              </div>
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
        
        {/* Security Settings */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Key className="w-5 h-5 mr-2" />
            Security Settings
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasPassword === false 
                      ? "No password set (OAuth login)" 
                      : "Last changed: Not available"
                    }
                  </p>
                </div>
                {!showChangePassword && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowChangePassword(true)}
                  >
                    {hasPassword === false ? "Set Password" : "Change Password"}
                  </Button>
                )}
              </div>

              {/* Change Password Form */}
              {showChangePassword && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  {passwordStep === 'form' && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {hasPassword === false ? "Set Password" : "Change Password"}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelPasswordChange}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Current Password field - only show for users who have a password */}
                      {hasPassword !== false && (
                        <div>
                          <label htmlFor="current-password" className="text-sm font-medium">
                            Current Password
                          </label>
                          <div className="relative mt-1">
                            <Input
                              id="current-password"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) => {
                                setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                                // Reset validation when user types
                                if (currentPasswordValidation.status !== 'checking') {
                                  setCurrentPasswordValidation({ status: 'idle' })
                                }
                              }}
                              placeholder="Enter your current password"
                              className={`pr-20 ${
                                currentPasswordValidation.status === 'valid' ? 'border-green-500 focus:border-green-500' :
                                currentPasswordValidation.status === 'invalid' ? 'border-red-500 focus:border-red-500' : ''
                              }`}
                              required
                            />
                            
                            {/* Validation indicator */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                              {currentPasswordValidation.status === 'checking' && (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              )}
                              {currentPasswordValidation.status === 'valid' && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {currentPasswordValidation.status === 'invalid' && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            
                            {/* Password visibility toggle */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                              onClick={() => togglePasswordVisibility('current')}
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          {/* Validation message */}
                          {currentPasswordValidation.message && (
                            <p className={`text-xs mt-1 ${
                              currentPasswordValidation.status === 'valid' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {currentPasswordValidation.status === 'valid' ? '✓ ' : '✗ '}
                              {currentPasswordValidation.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label htmlFor="new-password" className="text-sm font-medium">
                          {hasPassword === false ? "Password" : "New Password"}
                        </label>
                        <div className="relative mt-1">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter your new password"
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Password must be at least 8 characters long
                        </p>

                        {/* Password Strength Indicator */}
                        {passwordForm.newPassword && (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Password strength:
                              </span>
                              <span className={`text-xs font-medium ${
                                passwordStrength.score <= 1 ? 'text-red-600' :
                                passwordStrength.score <= 2 ? 'text-orange-600' :
                                passwordStrength.score <= 3 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color} ${getPasswordStrengthWidth(passwordStrength.score)}`}
                              />
                            </div>
                            
                            {passwordStrength.suggestions.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <p className="font-medium mb-1">To improve your password:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {passwordStrength.suggestions.slice(0, 3).map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Warning if new password is same as current password */}
                        {hasPassword !== false && passwordForm.currentPassword && passwordForm.newPassword && 
                         passwordForm.currentPassword === passwordForm.newPassword && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              New password must be different from current password
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirm-password" className="text-sm font-medium">
                          {hasPassword === false ? "Confirm Password" : "Confirm New Password"}
                        </label>
                        <div className="relative mt-1">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm your new password"
                            className={`${
                              passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                                ? 'border-red-500 focus:border-red-500'
                                : passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
                                ? 'border-green-500 focus:border-green-500'
                                : ''
                            }`}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {passwordForm.confirmPassword && (
                          <p className={`text-xs mt-1 ${
                            passwordForm.newPassword === passwordForm.confirmPassword
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {passwordForm.newPassword === passwordForm.confirmPassword
                              ? '✓ Passwords match'
                              : '✗ Passwords do not match'
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button 
                          type="submit" 
                          disabled={
                            isLoading || 
                            !passwordForm.newPassword || 
                            !passwordForm.confirmPassword ||
                            passwordForm.newPassword !== passwordForm.confirmPassword ||
                            passwordForm.newPassword.length < 8 ||
                            passwordStrength.score < 2 ||
                            (hasPassword !== false && !passwordForm.currentPassword) ||
                            (hasPassword !== false && passwordForm.currentPassword === passwordForm.newPassword)
                          }
                          onClick={() => {
                            console.log('=== BUTTON CLICKED ===')
                            console.log('Button disabled state:', {
                              isLoading,
                              hasNewPassword: !!passwordForm.newPassword,
                              hasConfirmPassword: !!passwordForm.confirmPassword,
                              passwordsMatch: passwordForm.newPassword === passwordForm.confirmPassword,
                              passwordLength: passwordForm.newPassword.length,
                              passwordStrengthScore: passwordStrength.score,
                              hasPassword,
                              hasCurrentPassword: !!passwordForm.currentPassword,
                              shouldBeDisabled: isLoading || 
                                !passwordForm.newPassword || 
                                !passwordForm.confirmPassword ||
                                passwordForm.newPassword !== passwordForm.confirmPassword ||
                                passwordForm.newPassword.length < 8 ||
                                passwordStrength.score < 2 ||
                                (hasPassword !== false && !passwordForm.currentPassword)
                            })
                          }}
                        >
                          {isLoading ? 'Processing...' : (hasPassword === false ? 'Set Password' : 'Send OTP')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={cancelPasswordChange}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {passwordStep === 'otp' && (
                    <form onSubmit={handleOtpVerification} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-500" />
                          <h4 className="font-medium">Verify OTP</h4>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelPasswordChange}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                          We&apos;ve sent a 6-digit verification code to your email address.
                          Please enter it below to complete the password change.
                        </p>
                        
                        <div>
                          <label htmlFor="otp" className="text-sm font-medium">
                            Verification Code
                          </label>
                          <Input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            className="text-center text-lg tracking-widest mt-1"
                            maxLength={6}
                            required
                          />
                        </div>

                        {otpTimer > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resend code in {otpTimer} seconds
                          </p>
                        )}
                        {otpTimer === 0 && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-2"
                            onClick={resendOTP}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Sending...' : 'Resend Code'}
                          </Button>
                        )}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button type="submit" disabled={isLoading || otp.length !== 6}>
                          {isLoading ? 'Verifying...' : 'Verify & Change Password'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setPasswordStep('form')}
                        >
                          Back
                        </Button>
                      </div>
                    </form>
                  )}

                  {passwordStep === 'success' && (
                    <div className="text-center py-6">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h4 className="font-medium text-green-600 mb-2">Password Changed Successfully!</h4>
                      <p className="text-sm text-muted-foreground">
                        Your password has been updated. This form will close automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Preferences */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Shield className="w-5 h-5 mr-2" />
            Privacy Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email Notifications</label>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Security Alerts</label>
              <Switch
                checked={preferences.securityAlerts}
                onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Product Updates</label>
              <Switch
                checked={preferences.productUpdates}
                onCheckedChange={(checked) => updatePreference('productUpdates', checked)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Profile Visibility</label>
              <Switch
                checked={preferences.profileVisibility}
                onCheckedChange={(checked) => updatePreference('profileVisibility', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Two-Factor Authentication</label>
                <p className="text-xs text-muted-foreground">
                  Require a verification code when signing in
                </p>
              </div>
              <Switch
                checked={preferences.twoFactorAuth || false}
                onCheckedChange={handle2FAToggle}
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={handleSavePrivacySettings} 
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDataExport}
                disabled={isLoading}
              >
                {isLoading ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <h2 className="flex items-center text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-red-500 dark:text-red-100 mb-2">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isLoading}
        userName={user?.name}
      />
    </div>
  )
}
