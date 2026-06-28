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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RefundRequest {
  id: string;
  amountMinor: number;
  currency: string;
  reason: string;
  user?: { email: string; name: string };
  plan?: { name: string };
}

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: RefundRequest | null;
  mode: "approve" | "deny" | null;
  onSuccess: () => void;
}

export function RefundDialog({ isOpen, onClose, request, mode, onSuccess }: RefundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [revokeSubscription, setRevokeSubscription] = useState(true);
  const { toast } = useToast();

  if (!request || !mode) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/refunds/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          ...(mode === "deny" ? { reason } : { revokeSubscription }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");

      toast({
        title: mode === "approve" ? "Refund Approved" : "Refund Denied",
        description: `Successfully processed refund request for ${request.user?.email}`,
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

  const formattedAmount = `${request.currency} ${(request.amountMinor / 100).toFixed(2)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "approve" ? "Approve Refund" : "Deny Refund"}
          </DialogTitle>
          <DialogDescription>
            {mode === "approve"
              ? `You are about to approve a refund of ${formattedAmount} for ${request.user?.email}.`
              : `You are about to deny a refund request of ${formattedAmount} for ${request.user?.email}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted p-3 rounded-md text-sm">
            <p><strong>Plan:</strong> {request.plan?.name}</p>
            <p><strong>User Reason:</strong> {request.reason}</p>
          </div>

          {mode === "deny" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Denial (Sent to user)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why the refund is denied..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "approve" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="revoke"
                checked={revokeSubscription}
                onCheckedChange={(checked) => setRevokeSubscription(checked as boolean)}
              />
              <Label htmlFor="revoke">Revoke subscription access</Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={mode === "approve" ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={loading || (mode === "deny" && !reason)}
          >
            {loading ? "Processing..." : mode === "approve" ? "Approve & Refund" : "Deny Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
