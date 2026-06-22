"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Shield, 
  QrCode, 
  CheckCircle, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface TOTPSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type SetupStep = 'scan' | 'verify' | 'backup'

export function TOTPSetupWizard({ isOpen, onClose, onSuccess }: TOTPSetupWizardProps) {
  const [step, setStep] = useState<SetupStep>('scan')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Step 1: Scan QR
  const [secret, setSecret] = useState("")
  const [uri, setUri] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  
  // Step 2: Verify
  const [verifyCode, setVerifyCode] = useState("")
  
  // Step 3: Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [codeCopied, setCodeCopied] = useState(false)
  const [savedConfirmed, setSavedConfirmed] = useState(false)

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only allow close during scan step or after backup step
      if (step === 'scan' || step === 'backup') {
        resetState()
        onClose()
      }
    }
  }

  const resetState = () => {
    setStep('scan')
    setIsLoading(false)
    setError("")
    setSecret("")
    setUri("")
    setShowSecret(false)
    setVerifyCode("")
    setBackupCodes([])
    setCodeCopied(false)
    setSavedConfirmed(false)
  }

  // Step 1: Generate TOTP secret
  const handleStartSetup = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.data?.error || 'Failed to start setup')
        return
      }

      // Extract from standardized API response format
      const responseData = data.data || data
      setSecret(responseData.secret)
      setUri(responseData.uri)
    } catch {
      setError('Failed to start setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify the first TOTP code
  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.data?.error || 'Invalid code. Please try again.')
        return
      }

      // Extract backup codes from standardized API response
      const responseData = data.data || data
      setBackupCodes(responseData.backupCodes || [])
      setStep('backup')
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy all backup codes to clipboard
  const handleCopyAll = async () => {
    try {
      const codesText = backupCodes.join('\n')
      await navigator.clipboard.writeText(codesText)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 3000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  // Complete setup
  const handleComplete = () => {
    resetState()
    onSuccess()
    onClose()
  }

  // Initialize setup when dialog opens
  const handleInitSetup = () => {
    if (!secret && !isLoading) {
      handleStartSetup()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          handleInitSetup()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {step === 'scan' && "Set Up Authenticator App"}
            {step === 'verify' && "Verify Authenticator"}
            {step === 'backup' && "Save Backup Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === 'scan' && "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)"}
            {step === 'verify' && "Enter the 6-digit code from your authenticator app to verify setup"}
            {step === 'backup' && "Save these backup codes in a safe place. Each code can only be used once."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {(['scan', 'verify', 'backup'] as SetupStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${step === s 
                  ? 'bg-blue-600 text-white' 
                  : (['scan', 'verify', 'backup'].indexOf(step) > i 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )
                }
              `}>
                {['scan', 'verify', 'backup'].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className={`
                  flex-1 h-0.5 transition-colors
                  ${['scan', 'verify', 'backup'].indexOf(step) > i 
                    ? 'bg-green-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Scan QR Code */}
        {step === 'scan' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground mt-2">Generating setup code...</p>
              </div>
            ) : uri ? (
              <>
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCodeSVG
                      value={uri}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>

                {/* Manual entry */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Can&apos;t scan? Enter this code manually in your authenticator app:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
                      {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                      className="shrink-0"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(secret)
                      }}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setError("")
                    setStep('verify')
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  I&apos;ve Scanned the QR Code
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <QrCode className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleStartSetup}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="totp-verify" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <Input
                id="totp-verify"
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Open your authenticator app and enter the 6-digit code shown for this account.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setVerifyCode("")
                  setError("")
                  setStep('scan')
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerifyCode}
                disabled={isLoading || verifyCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Enable
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Important:</strong> These codes will only be shown once. Save them in a secure location.
                  You can use these codes to sign in if you lose access to your authenticator app.
                </p>
              </div>
            </div>

            {/* Recovery codes grid */}
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-md px-3 py-2 font-mono text-sm text-center select-all"
                >
                  {code}
                </div>
              ))}
            </div>

            {/* Copy button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyAll}
            >
              {codeCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Codes
                </>
              )}
            </Button>

            {/* Confirmation checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="saved-codes"
                checked={savedConfirmed}
                onCheckedChange={(checked) => setSavedConfirmed(checked === true)}
              />
              <label
                htmlFor="saved-codes"
                className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-tight"
              >
                I have saved my backup codes in a secure location
              </label>
            </div>

            <Button
              className="w-full"
              onClick={handleComplete}
              disabled={!savedConfirmed}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
