"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableHeadSortable,
  TableColumnSearch,
  TablePagination
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Calendar as CalendarIcon, Search, Download, X, RefreshCcwIcon } from 'lucide-react';
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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Filters
  const [q, setQ] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [methodFilters, setMethodFilters] = useState<string[]>([]);
  const [gatewayFilters, setGatewayFilters] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Column filters for table search
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const loadPayments = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const skip = (p - 1) * pageSize;

      // Build Razorpay params
      const rzpParams = new URLSearchParams({
        count: String(pageSize),
        skip: String(skip),
        ...(q && { q }),
        ...(fromDate && { from: String(Math.floor(fromDate.getTime() / 1000)) }),
        ...(toDate && { to: String(Math.floor(toDate.getTime() / 1000)) })
      });

      // Build Stripe params
      const stripeParams = new URLSearchParams({
        limit: String(pageSize),
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
        setTotalCount(allItems.length);
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

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((item: PaymentItem) => {
          const itemValue = String((item as Record<string, unknown>)[column] || '').toLowerCase();
          return itemValue.includes(filterValue.toLowerCase());
        });
      }
    });

    const getField = (obj: PaymentItem | Record<string, unknown>, f: SortField) => {
      const o = obj as Record<string, unknown>;
      const v = o[f];
      if (v === undefined || v === null) return '';
      return v;
    };

    filtered.sort((a, b) => {
      let aVal: string | number = getField(a, sortField) as string | number;
      let bVal: string | number = getField(b, sortField) as string | number;

      if (sortField === 'created_at' || sortField === 'amount') {
        aVal = (aVal as number) || 0;
        bVal = (bVal as number) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredPayments(filtered);
  }, [allPayments, statusFilters, methodFilters, gatewayFilters, sortField, sortDirection, columnFilters]);

  // Load data from API when page or search/date filters change
  useEffect(() => {
    loadPayments(page);
  }, [loadPayments, page]);

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
    setPage(1);
    // This will trigger a new API call due to dependencies
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // No API call needed - applyFiltersAndSort will run via useEffect
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
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
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const invoicesPageSize = 20;
  const [invoiceQ, setInvoiceQ] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string[]>([]);
  type InvoiceSortField = 'id' | 'invoice_number' | 'customer_id' | 'amount' | 'status' | 'date';
  const [invoiceSortField, setInvoiceSortField] = useState<InvoiceSortField>('date');
  const [invoiceSortDirection, setInvoiceSortDirection] = useState<'asc' | 'desc'>('desc');

  // Invoice column filters for table search
  const [invoiceColumnFilters, setInvoiceColumnFilters] = useState<Record<string, string>>({});

  const handleInvoiceSort = (field: InvoiceSortField) => {
    if (field === invoiceSortField) {
      setInvoiceSortDirection(invoiceSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInvoiceSortField(field);
      setInvoiceSortDirection('asc');
    }
  };

  const handleInvoiceColumnFilter = (column: string, value: string) => {
    setInvoiceColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const loadInvoices = useCallback(async (p = 1) => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const skip = (p - 1) * invoicesPageSize;

      // Build Razorpay invoice params
      const rzpParams = new URLSearchParams();
      rzpParams.set('count', String(invoicesPageSize));
      rzpParams.set('skip', String(skip));
      if (invoiceStatusFilter.length > 0) rzpParams.set('status', invoiceStatusFilter[0]);

      // Build Stripe invoice params
      const stripeParams = new URLSearchParams();
      stripeParams.set('limit', String(invoicesPageSize));
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
      setInvoicesTotal(allItems.length);
    } catch (err) {
      console.error('Error loading invoices', err);
      setInvoicesError('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoicesPageSize, invoiceStatusFilter]);

  useEffect(() => { loadInvoices(invoicesPage); }, [loadInvoices, invoicesPage]);


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

    // Apply column filters
    Object.entries(invoiceColumnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        arr = arr.filter((inv) => {
          const itemValue = getInvoiceField(inv, column).toLowerCase();
          return itemValue.includes(filterValue.toLowerCase());
        });
      }
    });

    arr.sort((a, b) => {
      let aVal = getInvoiceField(a, invoiceSortField as string);
      let bVal = getInvoiceField(b, invoiceSortField as string);
      if (invoiceSortField === 'amount' || invoiceSortField === 'date') {
        aVal = String(Number(aVal) || 0);
        bVal = String(Number(bVal) || 0);
      }
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      if (aVal < bVal) return invoiceSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return invoiceSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [invoices, invoiceQ, invoiceSortField, invoiceSortDirection, invoiceColumnFilters]);

  const toggleInvoiceStatus = (status: string) => {
    setInvoiceStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    setInvoicesPage(1);
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
              <Button onClick={() => { setPage(1); loadPayments(1); }} className="flex items-center gap-2">
                <RefreshCcwIcon className={cn("w-4 h-4", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => { /* TODO: export logic */ }} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by payment ID, order ID, or email..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-10 lg:w-96"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DatePicker date={fromDate} setDate={setFromDate} placeholder="From date" />
              <DatePicker date={toDate} setDate={setToDate} placeholder="To date" />
              <StatusFilterDropdown />
              <MethodFilterDropdown />
              <GatewayFilterDropdown />
              {(statusFilters.length > 0 || methodFilters.length > 0 || gatewayFilters.length > 0 || fromDate || toDate || q) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
          {/* Results */}

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-red-700 font-semibold text-lg">{error}</p>
              <Button onClick={() => loadPayments(page)} className="mt-4" variant="outline">
                Try again
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'id' ? sortDirection : null}
                      onSort={() => handleSort('id')}
                      className="w-48"
                    >
                      Payment ID
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'amount' ? sortDirection : null}
                      onSort={() => handleSort('amount')}
                      className="w-32"
                    >
                      Amount
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'currency' ? sortDirection : null}
                      onSort={() => handleSort('currency')}
                      className="w-24"
                    >
                      Currency
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'status' ? sortDirection : null}
                      onSort={() => handleSort('status')}
                      className="w-32"
                    >
                      Status
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'method' ? sortDirection : null}
                      onSort={() => handleSort('method')}
                      className="w-32"
                    >
                      Method
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'email' ? sortDirection : null}
                      onSort={() => handleSort('email')}
                    >
                      Email
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === '_gateway' ? sortDirection : null}
                      onSort={() => handleSort('_gateway')}
                      className="w-32"
                    >
                      Gateway
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'created_at' ? sortDirection : null}
                      onSort={() => handleSort('created_at')}
                      className="w-44"
                    >
                      Created
                    </TableHeadSortable>
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search ID..."
                        onSearch={(value) => handleColumnFilter('id', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search amount..."
                        onSearch={(value) => handleColumnFilter('amount', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search currency..."
                        onSearch={(value) => handleColumnFilter('currency', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search status..."
                        onSearch={(value) => handleColumnFilter('status', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search method..."
                        onSearch={(value) => handleColumnFilter('method', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search email..."
                        onSearch={(value) => handleColumnFilter('email', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search gateway..."
                        onSearch={(value) => handleColumnFilter('_gateway', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search date..."
                        onSearch={(value) => handleColumnFilter('created_at', value)}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 opacity-50" />
                          <p>No transactions found</p>
                          <p className="text-xs">Try adjusting your filters or search terms</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: PaymentItem) => (
                      <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs">
                          <button
                            type="button"
                            className="text-primary underline hover:text-primary/80"
                            onClick={() => openPaymentDialog(payment.id, payment._gateway as string)}
                          >
                            {payment.id}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.amount ? (
                            payment.currency ?
                              new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: payment.currency
                              }).format(payment.amount / 100) :
                              `₹${(payment.amount / 100).toFixed(2)}`
                          ) : '--'}
                        </TableCell>
                        <TableCell className="text-xs uppercase font-medium">
                          {payment.currency || '--'}
                        </TableCell>
                        <TableCell>
                          {payment.status ? (
                            <Badge
                              variant={
                                payment.status === 'captured' ? 'default' :
                                  payment.status === 'failed' ? 'destructive' :
                                    payment.status === 'authorized' ? 'secondary' :
                                      'outline'
                              }
                              className={cn('text-xs', payment.status === 'failed' && 'text-white')}
                            >
                              {payment.status.toUpperCase()}
                            </Badge>
                          ) : '--'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.method || '--'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.email || '--'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              'text-xs font-medium',
                              payment._gateway === 'stripe' 
                                ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                                : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            )}
                          >
                            {payment._gateway === 'stripe' ? 'Stripe' : 'Razorpay'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.created_at ?
                            new Date(payment.created_at * 1000).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            }) : '--'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Payments pagination footer */}
        <TablePagination
          currentPage={page}
          totalPages={Math.ceil((totalCount || 0) / pageSize)}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          className="p-4"
        />

      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Invoices from all payment gateways</p>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Search invoices..." value={invoiceQ} onChange={e => setInvoiceQ(e.target.value)} className="w-64" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">Status {invoiceStatusFilter.length > 0 && `(${invoiceStatusFilter.length})`} <ChevronDown className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    {['draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'expired', 'deleted'].map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <Checkbox id={`inv-status-${s}`} checked={invoiceStatusFilter.includes(s)} onCheckedChange={() => toggleInvoiceStatus(s)} />
                        <label htmlFor={`inv-status-${s}`} className="text-sm capitalize cursor-pointer">{s.replace('_', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {invoicesLoading ? (
            <div className="py-8 text-center">Loading invoices...</div>
          ) : invoicesError ? (
            <div className="py-12 text-center">
              <p className="text-red-600 font-medium">{invoicesError}</p>
              <Button onClick={() => loadInvoices(invoicesPage)} className="mt-2">Try again</Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No invoices found</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'id' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('id')}
                    >
                      Invoice ID
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'invoice_number' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('invoice_number')}
                    >
                      Number
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'customer_id' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('customer_id')}
                    >
                      Customer
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'amount' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('amount')}
                    >
                      Amount
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'status' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('status')}
                    >
                      Status
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'date' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('date')}
                    >
                      Date
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={invoiceSortField === 'date' ? invoiceSortDirection : null}
                      onSort={() => handleInvoiceSort('date')}
                    >
                      Gateway
                    </TableHeadSortable>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search ID..."
                        onSearch={(value) => handleInvoiceColumnFilter('id', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search number..."
                        onSearch={(value) => handleInvoiceColumnFilter('invoice_number', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search customer..."
                        onSearch={(value) => handleInvoiceColumnFilter('customer_id', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search amount..."
                        onSearch={(value) => handleInvoiceColumnFilter('amount', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search status..."
                        onSearch={(value) => handleInvoiceColumnFilter('status', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search date..."
                        onSearch={(value) => handleInvoiceColumnFilter('date', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search gateway..."
                        onSearch={(value) => handleInvoiceColumnFilter('_gateway', value)}
                      />
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredInvoices.map(inv => (
                    <TableRow key={String(getInvoiceVal(inv, 'id') || Math.random())} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{String(getInvoiceVal(inv, 'id') || '--')}</TableCell>
                      <TableCell>{String(getInvoiceVal(inv, 'invoice_number') || getInvoiceVal(inv, 'receipt') || '--')}</TableCell>
                      <TableCell className="text-sm">{String(getInvoiceVal(inv, 'customer_id') || '--')}</TableCell>
                      <TableCell className="font-medium">{getInvoiceVal(inv, 'amount') ? (getInvoiceVal(inv, 'currency') ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: String(getInvoiceVal(inv, 'currency')) }).format(Number(getInvoiceVal(inv, 'amount')) / 100) : `₹${(Number(getInvoiceVal(inv, 'amount')) / 100).toFixed(2)}`) : '--'}</TableCell>
                      <TableCell><Badge className="text-xs">{String(getInvoiceVal(inv, 'status') || '--')}</Badge></TableCell>
                      <TableCell className="text-sm">{getInvoiceVal(inv, 'date') ? new Date(Number(getInvoiceVal(inv, 'date')) * 1000).toLocaleString('en-IN') : '--'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            'text-xs font-medium',
                            getInvoiceVal(inv, '_gateway') === 'stripe' 
                              ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                              : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          )}
                        >
                          {getInvoiceVal(inv, '_gateway') === 'stripe' ? 'Stripe' : 'Razorpay'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-sm inline-flex items-center gap-2"
                          onClick={() => openInvoiceDialog(String(getInvoiceVal(inv, 'id') || ''))}
                        >
                          Open
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-id', String(getInvoiceVal(inv, 'id')))}>{copiedKey === 'invoice-id' ? 'Copied' : 'Copy ID'}</Button>
                        {(getInvoiceVal(inv, 'short_url') || getInvoiceVal(inv, 'hosted_invoice_url')) && <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-url', String(getInvoiceVal(inv, 'short_url') || getInvoiceVal(inv, 'hosted_invoice_url')))}>{copiedKey === 'invoice-url' ? 'Copied' : 'Copy Link'}</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <TablePagination
          currentPage={invoicesPage}
          totalPages={Math.ceil((invoicesTotal || 0) / invoicesPageSize)}
          pageSize={invoicesPageSize}
          totalItems={invoicesTotal}
          onPageChange={setInvoicesPage}
          className="p-4"
        />
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
