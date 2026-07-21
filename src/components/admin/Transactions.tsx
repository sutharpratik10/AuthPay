"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableColumn } from '@/components/ui/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Calendar as CalendarIcon, Search, X, RefreshCcwIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/helpers';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { InvoiceDialog } from '@/components/shared/InvoiceDialog';
import { CreateRefundDialog } from './CreateRefundDialog';

export default function Transactions() {
  // transient copied key state used for copy buttons in dialogs/tables
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = useCallback(async (key: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, []);
  // --- Payments state and helpers (restored) ---
  interface PaymentItem extends Record<string, unknown> {
    id: string;
    amount?: number;
    currency?: string;
    status?: string;
    method?: string;
    email?: string;
    contact?: string;
    created_at?: number;
    _gateway?: 'razorpay' | 'stripe';
  }

  type SortField = 'id' | 'amount' | 'currency' | 'status' | 'method' | 'email' | 'created_at' | '_gateway';
  type SortDirection = 'asc' | 'desc';

  const [allPayments, setAllPayments] = useState<PaymentItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const FETCH_LIMIT = 100; // Increased limit since we use DataTable's client-side pagination

  // Filters
  const [q, setQ] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [methodFilters, setMethodFilters] = useState<string[]>([]);
  const [gatewayFilters, setGatewayFilters] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();



  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build Razorpay params
      const rzpParams = new URLSearchParams({
        count: String(FETCH_LIMIT),
        ...(q && { q }),
        ...(fromDate && { from: String(Math.floor(fromDate.getTime() / 1000)) }),
        ...(toDate && { to: String(Math.floor(toDate.getTime() / 1000)) })
      });

      // Build Stripe params
      const stripeParams = new URLSearchParams({
        limit: String(FETCH_LIMIT),
        ...(q && { q }),
        ...(fromDate && { from: String(Math.floor(fromDate.getTime() / 1000)) }),
        ...(toDate && { to: String(Math.floor(toDate.getTime() / 1000)) })
      });

      // Fetch from both gateways in parallel
      const [rzpRes, stripeRes] = await Promise.allSettled([
        fetch(`/api/payments/razorpay-payments?${rzpParams.toString()}`),
        fetch(`/api/payments/stripe-payments?${stripeParams.toString()}`),
      ]);

      let allItems: PaymentItem[] = [];
      const errors: string[] = [];

      // Process Razorpay response
      if (rzpRes.status === 'fulfilled' && rzpRes.value.ok) {
        const data = await rzpRes.value.json();
        if (data?.entity === 'collection') {
          const rzpItems = (data.items || []).map((item: PaymentItem) => ({
            ...item,
            _gateway: 'razorpay' as const,
          }));
          allItems.push(...rzpItems);
        }
      } else {
        const errMsg = rzpRes.status === 'rejected'
          ? 'Razorpay API unavailable'
          : 'Failed to load Razorpay payments';
        errors.push(errMsg);
        console.warn('[Transactions] Razorpay fetch issue:', errMsg);
      }

      // Process Stripe response
      if (stripeRes.status === 'fulfilled' && stripeRes.value.ok) {
        const data = await stripeRes.value.json();
        if (data?.entity === 'collection') {
          const stripeItems = (data.items || []).map((item: PaymentItem) => ({
            ...item,
            _gateway: 'stripe' as const,
          }));
          allItems.push(...stripeItems);
        }
      } else {
        const errMsg = stripeRes.status === 'rejected'
          ? 'Stripe API unavailable'
          : 'Failed to load Stripe payments';
        errors.push(errMsg);
        console.warn('[Transactions] Stripe fetch issue:', errMsg);
      }

      // Sort merged results by created_at descending
      allItems.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

      if (allItems.length > 0 || errors.length === 0) {
        setAllPayments(allItems);
        if (errors.length > 0) {
          // Partial success — show data but note the error
          console.warn('[Transactions] Partial load:', errors.join('; '));
        }
      } else {
        setError(errors.join('; '));
      }
    } catch (err) {
      console.error('Error loading payments', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [q, fromDate, toDate]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...allPayments];
    if (statusFilters.length > 0) {
      filtered = filtered.filter((item: PaymentItem) => statusFilters.includes(String(item.status || '').toLowerCase()));
    }
    if (methodFilters.length > 0) {
      filtered = filtered.filter((item: PaymentItem) => methodFilters.includes(String(item.method || '').toLowerCase()));
    }
    if (gatewayFilters.length > 0) {
      filtered = filtered.filter((item: PaymentItem) => gatewayFilters.includes(String(item._gateway || '').toLowerCase()));
    }
    setFilteredPayments(filtered);
  }, [allPayments, statusFilters, methodFilters, gatewayFilters]);

  // Load data from API when search/date filters change
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Apply client-side filters and sorting when data or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const clearFilters = () => {
    setQ('');
    setStatusFilters([]);
    setMethodFilters([]);
    setGatewayFilters([]);
    setFromDate(undefined);
    setToDate(undefined);
    // This will trigger a new API call due to dependencies
  };



  // Payment details dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [, setSelectedPaymentId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);
  const [showRawJson] = useState(false);
  // legacy copy helpers removed in favor of unified copyToClipboard/copyKey
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);

  // Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const fetchPaymentById = useCallback(async (id: string, gateway: string = 'razorpay') => {
    setPaymentDetailsLoading(true);
    setPaymentDetailsError(null);
    setPaymentDetails(null);
    try {
      const endpoint = gateway === 'stripe' ? 'stripe-payments' : 'razorpay-payments';
      const res = await fetch(`/api/payments/${endpoint}/${encodeURIComponent(id)}`);
      const text = await res.text();

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          const errField = parsed?.error;
          const msgField = parsed?.message;
          message = typeof errField === 'string' ? errField : (errField?.description || errField?.message || msgField || JSON.stringify(parsed));
        } catch { }
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      try {
        const data = JSON.parse(text);
        setPaymentDetails(data);
      } catch {
        setPaymentDetailsError(`Unexpected response format from server. First 1000 chars: ${String(text).slice(0, 1000)}`);
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = err;
      console.error('Error fetching payment', e);
      setPaymentDetailsError(e?.message || 'Failed to load payment details');
    } finally {
      setPaymentDetailsLoading(false);
    }
  }, []);

  // Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const openInvoiceDialog = (id: string) => {
    setSelectedInvoiceId(id);
    setInvoiceDialogOpen(true);
  };

  // Invoices state & UI
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const INVOICE_FETCH_LIMIT = 100;
  const [invoiceQ, setInvoiceQ] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string[]>([]);


  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      // Build Razorpay invoice params
      const rzpParams = new URLSearchParams();
      rzpParams.set('count', String(INVOICE_FETCH_LIMIT));
      if (invoiceStatusFilter.length > 0) rzpParams.set('status', invoiceStatusFilter[0]);

      // Build Stripe invoice params
      const stripeParams = new URLSearchParams();
      stripeParams.set('limit', String(INVOICE_FETCH_LIMIT));
      if (invoiceStatusFilter.length > 0) stripeParams.set('status', invoiceStatusFilter[0]);

      // Fetch from both gateways in parallel
      const [rzpRes, stripeRes] = await Promise.allSettled([
        fetch(`/api/payments/razorpay-invoices?${rzpParams.toString()}`),
        fetch(`/api/payments/stripe-invoices?${stripeParams.toString()}`),
      ]);

      let allItems: Record<string, unknown>[] = [];

      // Process Razorpay invoices
      if (rzpRes.status === 'fulfilled' && rzpRes.value.ok) {
        const data = await rzpRes.value.json();
        if (data?.entity === 'collection') {
          const rzpItems = (data.items || []).map((item: Record<string, unknown>) => ({
            ...item,
            _gateway: 'razorpay',
          }));
          allItems.push(...rzpItems);
        }
      } else {
        console.warn('[Transactions] Razorpay invoices fetch issue');
      }

      // Process Stripe invoices
      if (stripeRes.status === 'fulfilled' && stripeRes.value.ok) {
        const data = await stripeRes.value.json();
        if (data?.entity === 'collection') {
          const stripeItems = (data.items || []).map((item: Record<string, unknown>) => ({
            ...item,
            _gateway: 'stripe',
          }));
          allItems.push(...stripeItems);
        }
      } else {
        console.warn('[Transactions] Stripe invoices fetch issue');
      }

      // Sort by date descending
      allItems.sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));

      setInvoices(allItems);
    } catch (err) {
      console.error('Error loading invoices', err);
      setInvoicesError('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoiceStatusFilter]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);


  // Client-side filtering and sorting for invoices
  const filteredInvoices = useMemo(() => {
    const getInvoiceField = (inv: Record<string, unknown>, f: string) => {
      const v = inv[f];
      if (v === undefined || v === null) return '';
      return String(v);
    };

    let arr = [...invoices];
    if (invoiceQ) {
      const ql = invoiceQ.toLowerCase();
      arr = arr.filter(inv => (
        getInvoiceField(inv, 'id').toLowerCase().includes(ql) ||
        getInvoiceField(inv, 'invoice_number').toLowerCase().includes(ql) ||
        getInvoiceField(inv, 'receipt').toLowerCase().includes(ql) ||
        getInvoiceField(inv, 'customer_id').toLowerCase().includes(ql) ||
        getInvoiceField(inv, 'order_id').toLowerCase().includes(ql)
      ));
    }

    return arr;
  }, [invoices, invoiceQ]);

  const toggleInvoiceStatus = (status: string) => {
    setInvoiceStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };


  useEffect(() => {
    return () => {
      // nothing to cleanup for unified copy
    };
  }, []);

  // Safe helpers to access card fields without using `any`
  const getCardRaw = useCallback((field: string) => {
    if (!paymentDetails) return undefined;
    const cardRec = ((paymentDetails.card as unknown) as Record<string, unknown>) || {};
    const val = cardRec[field];
    return val === undefined || val === null ? undefined : String(val);
  }, [paymentDetails]);

  // Safe helper to access invoice fields without `any`
  const getInvoiceVal = useCallback((inv: Record<string, unknown>, field: string) => {
    const v = inv[field];
    if (v === undefined || v === null) return undefined;
    return String(v);
  }, []);

  const openPaymentDialog = (id: string, gateway: string = 'razorpay') => {
    setSelectedPaymentId(id);
    setPaymentDialogOpen(true);
    fetchPaymentById(id, gateway);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleMethodFilter = (method: string) => {
    setMethodFilters(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const toggleGatewayFilter = (gateway: string) => {
    setGatewayFilters(prev =>
      prev.includes(gateway)
        ? prev.filter(g => g !== gateway)
        : [...prev, gateway]
    );
  };

  const StatusFilterDropdown = () => {
    const statuses = ['created', 'authorized', 'captured', 'refunded', 'failed'];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span>Status {statusFilters.length > 0 && `(${statusFilters.length})`}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2 space-y-2">
            {statuses.map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={statusFilters.includes(status)}
                  onCheckedChange={() => toggleStatusFilter(status)}
                />
                <label
                  htmlFor={`status-${status}`}
                  className="text-sm font-medium capitalize cursor-pointer"
                >
                  {status}
                </label>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const MethodFilterDropdown = () => {
    const methods = ['card', 'netbanking', 'wallet', 'emi', 'upi'];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span>Method {methodFilters.length > 0 && `(${methodFilters.length})`}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Filter by Method</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2 space-y-2">
            {methods.map(method => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={`method-${method}`}
                  checked={methodFilters.includes(method)}
                  onCheckedChange={() => toggleMethodFilter(method)}
                />
                <label
                  htmlFor={`method-${method}`}
                  className="text-sm font-medium capitalize cursor-pointer"
                >
                  {method}
                </label>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const GatewayFilterDropdown = () => {
    const gateways = ['razorpay', 'stripe'];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span>Gateway {gatewayFilters.length > 0 && `(${gatewayFilters.length})`}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Filter by Gateway</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2 space-y-2">
            {gateways.map(gateway => (
              <div key={gateway} className="flex items-center space-x-2">
                <Checkbox
                  id={`gateway-${gateway}`}
                  checked={gatewayFilters.includes(gateway)}
                  onCheckedChange={() => toggleGatewayFilter(gateway)}
                />
                <label htmlFor={`gateway-${gateway}`} className="text-sm font-medium capitalize cursor-pointer">
                  {gateway}
                </label>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const DatePicker = ({ date, setDate, placeholder }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );

  const paymentColumns: DataTableColumn<PaymentItem>[] = useMemo(() => [
    {
      id: "id",
      header: "Payment ID",
      accessorKey: "id",
      sortable: true,
      searchable: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-primary underline hover:text-primary/80"
          onClick={() => openPaymentDialog(row.id, row._gateway as string)}
        >
          {row.id}
        </button>
      )
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      searchable: true,
      cell: ({ row }) => (
        row.amount ? (
          row.currency ?
            new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: row.currency
            }).format(row.amount / 100) :
            `₹${(row.amount / 100).toFixed(2)}`
        ) : '--'
      )
    },
    {
      id: "currency",
      header: "Currency",
      accessorKey: "currency",
      sortable: true,
      searchable: true,
      cell: ({ row }) => <span className="text-xs uppercase font-medium">{row.currency || '--'}</span>
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      searchable: true,
      filterType: "multi-select",
      options: [
        { label: "Created", value: "created" },
        { label: "Authorized", value: "authorized" },
        { label: "Captured", value: "captured" },
        { label: "Refunded", value: "refunded" },
        { label: "Failed", value: "failed" }
      ],
      cell: ({ row }) => (
        row.status ? (
          <Badge
            variant={
              row.status === 'captured' ? 'default' :
                row.status === 'failed' ? 'destructive' :
                  row.status === 'authorized' ? 'secondary' :
                    'outline'
            }
            className={cn('text-xs', row.status === 'failed' && 'text-white')}
          >
            {row.status.toUpperCase()}
          </Badge>
        ) : '--'
      )
    },
    {
      id: "method",
      header: "Method",
      accessorKey: "method",
      sortable: true,
      searchable: true,
      filterType: "multi-select",
      options: [
        { label: "Card", value: "card" },
        { label: "Netbanking", value: "netbanking" },
        { label: "Wallet", value: "wallet" },
        { label: "EMI", value: "emi" },
        { label: "UPI", value: "upi" }
      ],
      cell: ({ row }) => <span className="capitalize">{row.method || '--'}</span>
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      searchable: true,
      cell: ({ row }) => row.email || '--'
    },
    {
      id: "_gateway",
      header: "Gateway",
      accessorKey: "_gateway",
      sortable: true,
      searchable: true,
      filterType: "multi-select",
      options: [
        { label: "Razorpay", value: "razorpay" },
        { label: "Stripe", value: "stripe" }
      ],
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-medium',
            row._gateway === 'stripe'
              ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
              : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
          )}
        >
          {row._gateway === 'stripe' ? 'Stripe' : 'Razorpay'}
        </Badge>
      )
    },
    {
      id: "created_at",
      header: "Created",
      accessorKey: "created_at",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => (
        row.created_at ?
          new Date(row.created_at * 1000).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short'
          }) : '--'
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const invoiceColumns: DataTableColumn<Record<string, unknown>>[] = useMemo(() => [
    {
      id: "id",
      header: "Invoice ID",
      accessorKey: "id",
      sortable: true,
      searchable: true,
      cell: ({ row }) => <span className="font-mono text-xs">{String(getInvoiceVal(row, 'id') || '--')}</span>
    },
    {
      id: "invoice_number",
      header: "Number",
      accessorKey: "invoice_number",
      sortable: true,
      searchable: true,
      cell: ({ row }) => String(getInvoiceVal(row, 'invoice_number') || getInvoiceVal(row, 'receipt') || '--')
    },
    {
      id: "customer_id",
      header: "Customer",
      accessorKey: "customer_id",
      sortable: true,
      searchable: true,
      cell: ({ row }) => String(getInvoiceVal(row, 'customer_id') || '--')
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      searchable: true,
      cell: ({ row }) => (
        getInvoiceVal(row, 'amount') ? (getInvoiceVal(row, 'currency') ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: String(getInvoiceVal(row, 'currency')) }).format(Number(getInvoiceVal(row, 'amount')) / 100) : `₹${(Number(getInvoiceVal(row, 'amount')) / 100).toFixed(2)}`) : '--'
      )
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      searchable: true,
      filterType: "multi-select",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Issued", value: "issued" },
        { label: "Partially Paid", value: "partially_paid" },
        { label: "Paid", value: "paid" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
        { label: "Deleted", value: "deleted" }
      ],
      cell: ({ row }) => <Badge className="text-xs">{String(getInvoiceVal(row, 'status') || '--')}</Badge>
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "date",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => getInvoiceVal(row, 'date') ? new Date(Number(getInvoiceVal(row, 'date')) * 1000).toLocaleString('en-IN') : '--'
    },
    {
      id: "_gateway",
      header: "Gateway",
      accessorKey: "_gateway",
      sortable: true,
      searchable: true,
      filterType: "multi-select",
      options: [
        { label: "Razorpay", value: "razorpay" },
        { label: "Stripe", value: "stripe" }
      ],
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-medium',
            getInvoiceVal(row, '_gateway') === 'stripe'
              ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
              : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
          )}
        >
          {getInvoiceVal(row, '_gateway') === 'stripe' ? 'Stripe' : 'Razorpay'}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-1 text-sm inline-flex items-center gap-2"
            onClick={() => openInvoiceDialog(String(getInvoiceVal(row, 'id') || ''))}
          >
            Open
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-id', String(getInvoiceVal(row, 'id')))}>
            {copiedKey === 'invoice-id' ? 'Copied' : 'Copy ID'}
          </Button>
          {(getInvoiceVal(row, 'short_url') || getInvoiceVal(row, 'hosted_invoice_url')) && (
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-url', String(getInvoiceVal(row, 'short_url') || getInvoiceVal(row, 'hosted_invoice_url')))}>
              {copiedKey === 'invoice-url' ? 'Copied' : 'Copy Link'}
            </Button>
          )}
        </div>
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [getInvoiceVal, copyToClipboard, copiedKey]);

  return (
    <div className="space-y-6">

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Payment Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Monitor and manage payment transactions with advanced filtering</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => loadPayments()} className="flex items-center gap-2">
                <RefreshCcwIcon className={cn("w-4 h-4", loading && "animate-spin [animation-direction:reverse]")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters replaced by DataTable */}
          {/* Results */}

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-red-700 font-semibold text-lg">{error}</p>
              <Button onClick={() => loadPayments()} className="mt-4" variant="outline">
                Try again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable selectable={true}
                columns={paymentColumns}
                data={filteredPayments}
                searchable={true}
                columnSearch={true}
                pagination={true}
                export={true}
              />
            </div>
          )}
        </CardContent>

      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Invoices from all payment gateways</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {invoicesLoading ? (
            <div className="py-8 text-center">Loading invoices...</div>
          ) : invoicesError ? (
            <div className="py-12 text-center">
              <p className="text-red-600 font-medium">{invoicesError}</p>
              <Button onClick={() => loadInvoices()} className="mt-2">Try again</Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No invoices found</div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable selectable={true}
                columns={invoiceColumns}
                data={filteredInvoices}
                searchable={true}
                columnSearch={true}
                pagination={true}
                export={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setPaymentDialogOpen(false);
            setPaymentDetails(null);
            setSelectedPaymentId(null);
          }
        }}
      >
        <DialogContent hideClose className="max-w-3xl">
          <div className="flex items-center justify-between p-2">
            <DialogTitle>Payment Details</DialogTitle>
            <div className="flex items-center gap-2">
              {paymentDetails && ['captured', 'succeeded'].includes(paymentDetails.status) && (
                <Button size="sm" onClick={() => setRefundDialogOpen(true)}>
                  Issue Refund
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline" size="sm">Close</Button>
              </DialogClose>
            </div>
          </div>

          <div className="p-2 max-h-[70vh] overflow-y-auto">
            {paymentDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : paymentDetailsError ? (
              <div className="text-red-600">{paymentDetailsError}</div>
            ) : paymentDetails ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Payment</div>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="text-lg font-semibold break-all">{paymentDetails.id}</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-medium',
                            paymentDetails._gateway === 'stripe'
                              ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          )}
                        >
                          {paymentDetails._gateway === 'stripe' ? 'Stripe' : 'Razorpay'}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-auto p-1 text-xs" onClick={() => copyToClipboard('payment-id', String(paymentDetails.id))}>
                          {copiedKey === 'payment-id' ? 'Copied' : 'Copy'}
                        </Button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-2xl font-bold">
                          {paymentDetails.amount ? (paymentDetails.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: paymentDetails.currency }).format(paymentDetails.amount / 100) : String(paymentDetails.amount)) : '--'}
                        </div>
                        <div className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize text-white',
                          paymentDetails.status === 'failed' ? 'bg-red-500' : paymentDetails.status === 'captured' ? 'bg-emerald-500' : 'bg-neutral-500'
                        )}>
                          {paymentDetails.status || '--'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Method</div>
                        <div className="font-medium">{paymentDetails.method || '--'}</div>

                        <div className="text-xs text-muted-foreground mt-2">Email</div>
                        <div className="font-medium">{paymentDetails.email || '--'}</div>

                        <div className="text-xs text-muted-foreground mt-2">Contact</div>
                        <div className="font-medium">{paymentDetails.contact || '--'}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Order ID</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm break-all">{paymentDetails.order_id || '--'}</div>
                          {paymentDetails.order_id && (
                            <Button size="sm" variant="ghost" className="h-auto p-1 text-xs" onClick={() => copyToClipboard('order-id', String(paymentDetails.order_id))}>
                              {copiedKey === 'order-id' ? 'Copied' : 'Copy'}
                            </Button>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-2">Captured</div>
                        <div className="font-medium">{typeof paymentDetails.captured === 'boolean' ? (paymentDetails.captured ? 'Yes' : 'No') : '--'}</div>

                        <div className="text-xs text-muted-foreground mt-2">Amount Refunded</div>
                        <div className="font-medium">{paymentDetails.amount_refunded ? (paymentDetails.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: paymentDetails.currency }).format(paymentDetails.amount_refunded / 100) : `₹${(paymentDetails.amount_refunded / 100).toFixed(2)}`) : '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <div className="p-3 rounded border bg-muted/30 space-y-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Payment ID</div>
                        <div className="font-mono text-sm break-all">{paymentDetails.id}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Fee</div>
                        <div className="font-medium">{paymentDetails.fee ? (paymentDetails.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: paymentDetails.currency }).format(paymentDetails.fee / 100) : `₹${(paymentDetails.fee / 100).toFixed(2)}`) : '--'}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Tax</div>
                        <div className="font-medium">{paymentDetails.tax ? (paymentDetails.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: paymentDetails.currency }).format(paymentDetails.tax / 100) : `₹${(paymentDetails.tax / 100).toFixed(2)}`) : '--'}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Refund Status</div>
                        <div className="font-medium">{paymentDetails.refund_status || '--'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentDetails.card && (
                  <div className="p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Card</div>
                      <div className="flex items-center gap-2">
                        {(getCardRaw('id') || paymentDetails.card_id) && (
                          <Button size="sm" variant="ghost" className="h-auto p-1 text-xs" onClick={() => copyToClipboard('card-id', String(getCardRaw('id') || paymentDetails.card_id))}>
                            {copiedKey === 'card-id' ? 'Copied' : 'Copy ID'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Last4</div>
                        <div className="font-mono">{getCardRaw('last4') ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Network</div>
                        <div className="font-medium">{getCardRaw('network') ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="font-medium">{getCardRaw('type') ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Issuer Bank</div>
                        <div className="font-medium">{getCardRaw('issuer_bank') ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Issuer Country</div>
                        <div className="font-medium">{getCardRaw('issuer_country') ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">International</div>
                        <div className="font-medium">{getCardRaw('international') === 'true' || getCardRaw('international') === '1' ? 'Yes' : (getCardRaw('international') ? 'Yes' : 'No')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentDetails.upi && (
                  <div className="p-3 rounded border">
                    <div className="text-sm font-medium">UPI</div>
                    <div className="mt-2 text-sm">VPA: {paymentDetails.upi?.vpa || '--'}</div>
                  </div>
                )}

                {paymentDetails.notes && typeof paymentDetails.notes === 'object' && (
                  <div className="p-3 rounded border">
                    <div className="text-sm font-medium">Notes</div>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(paymentDetails.notes, null, 2)}</pre>
                  </div>
                )}

                {showRawJson && paymentDetails && (
                  <div className="p-3 rounded border">
                    <div className="text-sm font-medium">Raw JSON</div>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(paymentDetails, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">No payment selected</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <InvoiceDialog
        invoiceId={selectedInvoiceId}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      />

      <CreateRefundDialog
        isOpen={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        paymentOrder={paymentDetails ? {
          id: paymentDetails.id, // wait, our DB id or gateway id? 
          amountMinor: paymentDetails.amount,
          currency: paymentDetails.currency,
          user: { email: paymentDetails.email, name: paymentDetails.contact }
        } : null}
        onSuccess={() => {
          setRefundDialogOpen(false);
          // could refresh payments here if needed
        }}
      />
    </div>
  );
}
