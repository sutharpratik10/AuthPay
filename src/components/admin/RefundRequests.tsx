"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefundDialog } from "./RefundDialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function RefundRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"approve" | "deny" | null>(null);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/refunds?status=${statusFilter}&gateway=${gatewayFilter}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: "Error fetching refunds", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, gatewayFilter]);

  const handleAction = (request: any, mode: "approve" | "deny") => {
    setSelectedRequest(request);
    setDialogMode(mode);
  };

  const handleViewDetail = async (request: any) => {
    try {
      const res = await fetch(`/api/admin/refunds/${request.id}`);
      const data = await res.json();
      if (res.ok) {
        setDetailRequest(data);
      } else {
        setDetailRequest(request);
      }
    } catch {
      setDetailRequest(request);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="text-blue-500 border-blue-500">Approved</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'processing': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Processing</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Refund Requests</h2>
      </div>

      <div className="flex space-x-2">
        <div className="w-[180px]">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "completed", label: "Completed" },
              { value: "rejected", label: "Rejected" },
              { value: "failed", label: "Failed" }
            ]}
            placeholder="Status"
          />
        </div>

        <div className="w-[180px]">
          <Select 
            value={gatewayFilter} 
            onValueChange={setGatewayFilter}
            options={[
              { value: "all", label: "All Gateways" },
              { value: "stripe", label: "Stripe" },
              { value: "razorpay", label: "Razorpay" }
            ]}
            placeholder="Gateway"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No refund requests found.</TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.user?.name}</div>
                    <div className="text-sm text-muted-foreground">{req.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    {req.currency} {(req.amountMinor / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>{req.plan?.name}</TableCell>
                  <TableCell className="capitalize">{req.gateway}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(req.status)}
                      {(req.status === 'failed' || req.status === 'rejected') && req.failureReason && (
                        <div className="text-xs text-red-500 max-w-[200px] truncate" title={req.failureReason}>
                          {req.failureReason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleAction(req, 'approve')} className="text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAction(req, 'deny')} className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-1" /> Deny
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(req)}>
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RefundDialog 
        isOpen={!!dialogMode}
        onClose={() => { setDialogMode(null); setSelectedRequest(null); }}
        request={selectedRequest}
        mode={dialogMode}
        onSuccess={fetchRequests}
      />

      {/* Detail View Dialog */}
      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Refund Request Details
              {detailRequest && getStatusBadge(detailRequest.status)}
            </DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">User</span>
                  <p className="font-medium">{detailRequest.user?.name || 'N/A'}</p>
                  <p className="text-muted-foreground text-xs">{detailRequest.user?.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-medium">{detailRequest.currency} {(detailRequest.amountMinor / 100).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <p className="font-medium">{detailRequest.plan?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gateway</span>
                  <p className="font-medium capitalize">{detailRequest.gateway}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested</span>
                  <p className="font-medium">{format(new Date(detailRequest.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
                {detailRequest.processedAt && (
                  <div>
                    <span className="text-muted-foreground">Processed</span>
                    <p className="font-medium">{format(new Date(detailRequest.processedAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                )}
                {detailRequest.gatewayPaymentId && (
                  <div>
                    <span className="text-muted-foreground">Payment ID</span>
                    <p className="font-mono text-xs break-all">{detailRequest.gatewayPaymentId}</p>
                  </div>
                )}
                {detailRequest.gatewayRefundId && (
                  <div>
                    <span className="text-muted-foreground">Refund ID</span>
                    <p className="font-mono text-xs break-all">{detailRequest.gatewayRefundId}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-muted-foreground">User&apos;s Reason</span>
                <p className="mt-1 p-2 bg-muted rounded text-sm">{detailRequest.reason}</p>
              </div>

              {(detailRequest.status === 'failed' || detailRequest.status === 'rejected') && detailRequest.failureReason && (
                <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-md p-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    {detailRequest.status === 'failed' ? 'Failure Reason' : 'Rejection Reason'}
                  </div>
                  <p className="text-red-700 dark:text-red-300">{detailRequest.failureReason}</p>
                </div>
              )}

              {detailRequest.gatewayResponse && (
                <div>
                  <span className="text-muted-foreground">Gateway Response</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap break-all">
                    {JSON.stringify(detailRequest.gatewayResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
