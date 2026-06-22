import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, X } from "lucide-react"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (confirmationText: string) => Promise<void>
  isLoading: boolean
  userName?: string | null
}

export function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  userName 
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [step, setStep] = useState<'warning' | 'confirm'>('warning')

  const handleConfirm = async () => {
    if (confirmationText === 'DELETE') {
      await onConfirm(confirmationText)
      handleClose()
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    setStep('warning')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Delete Account
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {step === 'warning' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-3">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete 
                {userName ? ` ${userName}'s` : ' your'} account and remove all data from our servers.
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                  This will delete:
                </p>
                <ul className="text-red-700 dark:text-red-300 text-xs space-y-1">
                  <li>• Your profile information and settings</li>
                  <li>• All account preferences and configurations</li>
                  <li>• Login sessions across all devices</li>
                  <li>• Any stored data associated with your account</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
                className="flex-1"
                disabled={isLoading}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-4">
                To confirm deletion, please type <strong className="text-red-600 dark:text-red-400">DELETE</strong> in the box below:
              </p>
              
              <Input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono text-center"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('warning')}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                className="flex-1"
                disabled={isLoading || confirmationText !== 'DELETE'}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
