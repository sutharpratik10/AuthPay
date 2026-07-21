"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerSubscriptionId: string | null;
  onSuccess: () => void;
}

interface RefundEstimate {
  totalPlanCostMinor: number;
  currency: string;
  durationMinutes: number;
  timeUsedMinutes: number;
  unusedTimeMinutes: number;
  refundAmountMinor: number;
  isLifetime: boolean;
}

export function RequestRefundModal({ isOpen, onClose, providerSubscriptionId, onSuccess }: RequestRefundModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [estimate, setEstimate] = useState<RefundEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && providerSubscriptionId) {
      setLoadingEstimate(true);
      fetch(`/api/user/refunds/estimate?providerSubscriptionId=${encodeURIComponent(providerSubscriptionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEstimate(data.estimate);
          } else {
            console.error("Failed to load estimate:", data.error);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingEstimate(false));
    } else {
      setEstimate(null);
      setReason("");
    }
  }, [isOpen, providerSubscriptionId]);

  if (!providerSubscriptionId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/user/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSubscriptionId,
          reason,
          expectedRefundAmountMinor: estimate?.refundAmountMinor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit refund request");

      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted and is pending review.",
        variant: "default",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Request a Refund
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for your refund request. Our team will review it within 1-2 business days.
          </DialogDescription>
        </DialogHeader>

        {loadingEstimate ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Calculating pro-rata refund estimate...
          </div>
        ) : estimate ? (
          <div className="bg-natural-20 dark:bg-natural-900 rounded-md p-4 space-y-2 text-sm border border-natural-900 dark:border-natural-800">
            <h4 className="font-semibold text-foreground mb-3">Refund Estimate</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Plan Cost:</span>
              <span className="font-medium">{estimate.currency} {(estimate.totalPlanCostMinor / 100).toFixed(2)}</span>
            </div>
            {!estimate.isLifetime && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Used:</span>
                  <span className="font-medium">{Math.floor(estimate.timeUsedMinutes / (24 * 60))} Days, {Math.floor((estimate.timeUsedMinutes % (24 * 60)) / 60)} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unused Time:</span>
                  <span className="font-medium">{Math.floor(estimate.unusedTimeMinutes / (24 * 60))} Days, {Math.floor((estimate.unusedTimeMinutes % (24 * 60)) / 60)} Hours</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t border-natural-200 dark:border-natural-800 mt-2">
              <span className="font-semibold">Fixed Refund Amount:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{estimate.currency} {(estimate.refundAmountMinor / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic leading-relaxed">
              *Disclaimer: Your refund is calculated pro-rata based on the exact time remaining on your billing cycle. By submitting this request, your access to the service will be paused immediately, and the refund amount will be locked in while your request is pending review.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you are requesting a refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !reason.trim()}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
