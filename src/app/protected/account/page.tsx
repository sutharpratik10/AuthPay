"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Key, Trash2, Upload, Eye, EyeOff, X, Shield, CheckCircle } from "lucide-react"

type PasswordStep = 'form' | 'otp' | 'success'

export default function AccountPage() {
  const { user, isEmailVerified } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
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

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }
  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Validation
    if (!passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required!' })
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' })
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' })
      return
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password!' })
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      // First, verify current password and send OTP
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword
        }),
      })
        const result = await response.json()
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Current password verification failed. Please check your password and try again.' 
        })
        return
      }
      
      // Store password data temporarily and move to OTP step
      setTempPasswordData({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordStep('otp')
      setOtpTimer(60) // 60 seconds timer
      setMessage({ type: 'success', text: 'OTP sent to your email address!' })
      
    } catch (error) {
      console.error('Password verification error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to verify current password. Please try again.' 
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
    
    setIsLoading(true)
    setMessage(null)
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
    setMessage(null)
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string

    // Simulate API call
    try {
      // TODO: Implement actual profile update API call with name
      console.log('Updating profile with name:', name)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
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
              </div>              <div>
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
        </div>        {/* Security Settings */}
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
                    Last changed: Not available
                  </p>
                </div>
                {!showChangePassword && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {/* Change Password Form */}
              {showChangePassword && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  {passwordStep === 'form' && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Change Password</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelPasswordChange}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <label htmlFor="current-password" className="text-sm font-medium">
                          Current Password
                        </label>
                        <div className="relative mt-1">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter your current password"
                            required
                          />
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
                      </div>

                      <div>
                        <label htmlFor="new-password" className="text-sm font-medium">
                          New Password
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
                      </div>

                      <div>
                        <label htmlFor="confirm-password" className="text-sm font-medium">
                          Confirm New Password
                        </label>
                        <div className="relative mt-1">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm your new password"
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
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Processing...' : 'Send OTP'}
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

                      <div className="text-center">                        <p className="text-sm text-muted-foreground mb-4">
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
                        )}                        {otpTimer === 0 && (
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

        {/* Danger Zone */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <h2 className="flex items-center text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5 mr-2" />
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-sm text-red-500 dark:text-red-300 mb-2">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
