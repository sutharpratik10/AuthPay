"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Key, AlertTriangle, Copy, CheckCircle, RefreshCcw } from "lucide-react"

interface RegenerateRecoveryCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'confirm' | 'display';

export function RegenerateRecoveryCodesModal({ isOpen, onClose, onSuccess }: RegenerateRecoveryCodesModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/totp/regenerate-recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to regenerate codes');
        return;
      }

      setNewCodes(data.data.backupCodes);
      setStep('display');
      onSuccess(); // Inform parent to update counts
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(newCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('confirm');
    setPassword('');
    setError('');
    setNewCodes([]);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
            <RefreshCcw className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold">Regenerate Recovery Codes</h2>
          <p className="text-sm text-muted-foreground">
            {step === 'confirm' 
              ? 'This will invalidate your old recovery codes and generate a fresh set.' 
              : 'Please save these new codes securely.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleRegenerate}
                disabled={isLoading || !password}
              >
                {isLoading ? 'Generating...' : 'Generate New Codes'}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}

          {step === 'display' && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm grid grid-cols-2 gap-2 text-center">
                {newCodes.map((code, idx) => (
                  <div key={idx} className="bg-background/50 py-1.5 rounded border border-border/50">
                    {code}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={copyCodes}
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Codes'}
                </Button>
                
                <Button 
                  className="w-full"
                  onClick={handleClose}
                >
                  I have saved my codes securely
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
