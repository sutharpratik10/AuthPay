"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, AlertCircle } from "lucide-react";

interface MobileInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mobileNumber: string) => void;
  planName?: string;
  planPrice?: string;
  isLoading?: boolean;
}

export function MobileInputModal({
  isOpen,
  onClose,
  onSubmit,
  planName,
  planPrice,
  isLoading = false
}: MobileInputModalProps) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  const validateMobileNumber = (number: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mobile number is optional for internal subscription activation
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setError('');
    onSubmit(mobileNumber || ''); // Pass empty string if no mobile number provided
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setMobileNumber(value);
      setError('');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMobileNumber('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            Subscription Details
          </DialogTitle>
          <DialogDescription>
            Enter your mobile number to activate your subscription
          </DialogDescription>
        </DialogHeader>

        {/* Move plan info box OUTSIDE DialogDescription to avoid div inside p */}
        {planName && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {planName}
            </div>
            {planPrice && (
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {planPrice}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">            <Label htmlFor="mobile">Mobile Number (Optional)</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-sm text-muted-foreground">
                +91
              </div>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number (optional)"
                value={mobileNumber}
                onChange={handleInputChange}
                className="pl-12"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}            <div className="text-xs text-muted-foreground">
              Mobile number is optional and can be used for future subscription notifications
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                  Processing...
                </div>              ) : (
                'Activate Subscription'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
