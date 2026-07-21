"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PaymentOrder {
  id: string;
  amountMinor: number;
  currency: string;
  user?: { email: string; name: string };
  plan?: { name: string };
}

interface CreateRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentOrder: PaymentOrder | null;
  onSuccess: () => void;
}

export function CreateRefundDialog({ isOpen, onClose, paymentOrder, onSuccess }: CreateRefundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  // Default to full amount
  const [amount, setAmount] = useState<string>(""); 
  const [revokeSubscription, setRevokeSubscription] = useState(true);
  const { toast } = useToast();

  if (!paymentOrder) return null;

  // Initialize amount on open
  const maxAmount = paymentOrder.amountMinor / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    const amountMinor = Math.round(Number(amount) * 100);
    if (amountMinor <= 0 || amountMinor > paymentOrder.amountMinor) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentOrderId: paymentOrder.id,
          amountMinor,
          reason,
          revokeSubscription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate refund");

      toast({
        title: "Refund Initiated",
        description: `Successfully created refund request.`,
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
          <DialogTitle>Issue Refund</DialogTitle>
          <DialogDescription>
            Initiate a manual refund for payment {paymentOrder.id}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-muted p-3 rounded-md text-sm">
            <p><strong>User:</strong> {paymentOrder.user?.email}</p>
            <p><strong>Plan:</strong> {paymentOrder.plan?.name}</p>
            <p><strong>Max Amount:</strong> {paymentOrder.currency} {maxAmount.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Refund Amount ({paymentOrder.currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={maxAmount}
              placeholder={maxAmount.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this refund is being issued..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="revoke"
              checked={revokeSubscription}
              onCheckedChange={(checked) => setRevokeSubscription(checked as boolean)}
            />
            <Label htmlFor="revoke">Revoke subscription access</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !reason}>
              {loading ? "Processing..." : "Issue Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
