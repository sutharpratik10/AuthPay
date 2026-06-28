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
import { RefundDialog } from "./RefundDialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle } from "lucide-react";

export function RefundRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"approve" | "deny" | null>(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="text-blue-500 border-blue-500">Approved</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Refund Requests</h2>
        {/* We can add a "New Refund" button here if desired, but typically we trigger it from Transactions */}
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
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
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
                      <Button variant="ghost" size="sm" disabled>
                        <Eye className="h-4 w-4 mr-1" /> View Only
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
    </div>
  );
}
