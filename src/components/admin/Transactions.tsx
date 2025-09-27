"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Calendar as CalendarIcon, Search, Download, X, ArrowUpDown, RefreshCcwIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  interface PaymentItem {
    id: string;
    amount?: number;
    currency?: string;
    status?: string;
    method?: string;
    email?: string;
    contact?: string;
    created_at?: number;
  }

  type SortField = 'id' | 'amount' | 'currency' | 'status' | 'method' | 'email' | 'created_at';
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
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadPayments = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const skip = (p - 1) * pageSize;
      const params = new URLSearchParams();
      params.set('count', String(pageSize));
      params.set('skip', String(skip));
      if (q) params.set('q', q);
      if (fromDate) params.set('from', String(Math.floor(fromDate.getTime() / 1000)));
      if (toDate) params.set('to', String(Math.floor(toDate.getTime() / 1000)));

      const res = await fetch(`/api/payments/razorpay-payments?${params.toString()}`);
      const data = await res.json();
      if (data && data.entity === 'collection') {
        const items: PaymentItem[] = data.items || [];
        setAllPayments(items);
        setTotalCount(data.count || items.length);
      } else {
        setError(data?.error?.description || 'Failed to load payments');
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
  }, [allPayments, statusFilters, methodFilters, sortField, sortDirection]);



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

  // Payment details dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [, setSelectedPaymentId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);
  const [showRawJson] = useState(false);
  // legacy copy helpers removed in favor of unified copyToClipboard/copyKey
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState<string | null>(null);

  const fetchPaymentById = useCallback(async (id: string) => {
    setPaymentDetailsLoading(true);
    setPaymentDetailsError(null);
    setPaymentDetails(null);
    try {
      const res = await fetch(`/api/payments/razorpay-payments/${encodeURIComponent(id)}`);
      const text = await res.text();

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          message = parsed?.error || parsed?.message || JSON.stringify(parsed);
        } catch {}
        throw new Error(message);
      }

      try {
        const data = JSON.parse(text);
        setPaymentDetails(data);
      } catch {
        setPaymentDetailsError(`Unexpected response format from server. First 1000 chars: ${String(text).slice(0,1000)}`);
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

  // Invoice details dialog state + fetch
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Record<string, unknown> | null>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);
  const [invoiceDetailsError, setInvoiceDetailsError] = useState<string | null>(null);

  const fetchInvoiceById = useCallback(async (id: string) => {
    setInvoiceDetailsLoading(true);
    setInvoiceDetailsError(null);
    setInvoiceDetails(null);
    try {
      const res = await fetch(`/api/payments/razorpay-invoices/${encodeURIComponent(id)}`);
      const text = await res.text();
      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try { const parsed = JSON.parse(text); message = parsed?.error?.description || parsed?.message || JSON.stringify(parsed); } catch {}
        throw new Error(message);
      }
      try {
        const data = JSON.parse(text);
        setInvoiceDetails(data);
      } catch {
        setInvoiceDetailsError(`Unexpected response format from server. First 1000 chars: ${String(text).slice(0,1000)}`);
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = err;
      console.error('Error fetching invoice', e);
      setInvoiceDetailsError(e?.message || 'Failed to load invoice details');
    } finally {
      setInvoiceDetailsLoading(false);
    }
  }, []);

  const openInvoiceDialog = (id: string) => {
    setSelectedInvoiceId(id);
    setInvoiceDialogOpen(true);
    fetchInvoiceById(id);
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
  const [invoiceSortDirection, setInvoiceSortDirection] = useState<'asc'|'desc'>('desc');

  const loadInvoices = useCallback(async (p = 1) => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const skip = (p - 1) * invoicesPageSize;
      const params = new URLSearchParams();
      params.set('count', String(invoicesPageSize));
      params.set('skip', String(skip));
      if (invoiceStatusFilter.length > 0) params.set('status', invoiceStatusFilter[0]);

      const res = await fetch(`/api/payments/razorpay-invoices?${params.toString()}`);
      const data = await res.json();
      if (data && data.entity === 'collection') {
        setInvoices(data.items || []);
        setInvoicesTotal(data.count || (data.items || []).length);
      } else {
        setInvoicesError(data?.error?.description || 'Failed to load invoices');
      }
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
  }, [invoices, invoiceQ, invoiceSortField, invoiceSortDirection]);

  const toggleInvoiceStatus = (status: string) => {
    setInvoiceStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    setInvoicesPage(1);
  };


  useEffect(() => {
    return () => {
  // nothing to cleanup for unified copy
    };
  }, []);

  // removed old copyId/copyJson functions (using copyToClipboard + copiedKey)

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

  // remove unused getCardDisplay; call getCardRaw directly where needed

  const openPaymentDialog = (id: string) => {
    setSelectedPaymentId(id);
    setPaymentDialogOpen(true);
    fetchPaymentById(id);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    // No API call needed - applyFiltersAndSort will run via useEffect
  };

  const toggleMethodFilter = (method: string) => {
    setMethodFilters(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
    // No API call needed - applyFiltersAndSort will run via useEffect
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
                <RefreshCcwIcon className="w-4 h-4" />
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
              {(statusFilters.length > 0 || methodFilters.length > 0 || fromDate || toDate || q) && (
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
            <div className="py-12 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <DialogClose asChild>
                <Button variant="outline" size="sm">Close</Button>
              </DialogClose>
              <Button onClick={() => loadPayments(page)} className="mt-2">
                Try again
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-48">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('id')}
                      >
                        Payment ID
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('currency')}
                      >
                        Currency
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('method')}
                      >
                        Method
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-44">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => handleSort('created_at')}
                      >
                        Created
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                            onClick={() => openPaymentDialog(payment.id)}
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
                              }).format(payment.amount/100) : 
                              `₹${(payment.amount/100).toFixed(2)}`
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
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {Math.ceil((totalCount || 0) / pageSize)}{totalCount > 0 && ` (${totalCount} total results)`}{(statusFilters.length > 0 || methodFilters.length > 0) && ` • ${filteredPayments.length} filtered`}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1 || loading} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= Math.ceil((totalCount || 0) / pageSize) || loading} onClick={() => setPage(p => p+1)}>Next</Button>
          </div>
        </div>

      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">List of Razorpay invoices</p>
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
                    {['draft','issued','partially_paid','paid','cancelled','expired','deleted'].map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <Checkbox id={`inv-status-${s}`} checked={invoiceStatusFilter.includes(s)} onCheckedChange={() => toggleInvoiceStatus(s)} />
                        <label htmlFor={`inv-status-${s}`} className="text-sm capitalize cursor-pointer">{s.replace('_',' ')}</label>
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
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('id'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Invoice ID</Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('invoice_number'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Number</Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('customer_id'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Customer</Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('amount'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Amount</Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('status'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Status</Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => { setInvoiceSortField('date'); setInvoiceSortDirection(d => d === 'asc' ? 'desc' : 'asc'); }}>Date</Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-id', String(getInvoiceVal(inv, 'id')))}>{copiedKey === 'invoice-id' ? 'Copied' : 'Copy ID'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => openInvoiceDialog(String(getInvoiceVal(inv, 'id') || ''))}>Details</Button>
                        {getInvoiceVal(inv, 'short_url') && (
                          <a href={String(getInvoiceVal(inv, 'short_url'))} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" className="h-auto p-1 text-sm inline-flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Open
                            </Button>
                          </a>
                        )}
                        {getInvoiceVal(inv, 'short_url') && <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-url', String(getInvoiceVal(inv, 'short_url')))}>{copiedKey === 'invoice-url' ? 'Copied' : 'Copy Link'}</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">Showing page {invoicesPage} of {Math.ceil((invoicesTotal || 0) / invoicesPageSize)}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={invoicesPage === 1} onClick={() => setInvoicesPage(p => Math.max(1, p-1))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={invoicesPage >= Math.ceil((invoicesTotal || 0) / invoicesPageSize)} onClick={() => setInvoicesPage(p => p+1)}>Next</Button>
          </div>
        </div>
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
                          paymentDetails.status === 'failed' ? 'bg-red-500' : paymentDetails.status === 'captured' ? 'bg-emerald-500' : 'bg-gray-500'
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
      
      {/* Invoice Details Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setInvoiceDialogOpen(false);
            setInvoiceDetails(null);
            setSelectedInvoiceId(null);
          }
        }}
      >
        <DialogContent hideClose className="max-w-3xl">
          <div className="flex items-center justify-between p-2">
            <DialogTitle>Invoice Details</DialogTitle>
            <div className="flex items-center gap-2">
              {(() => {
                const inv = invoiceDetails as Record<string, unknown> || {};
                const shortUrl = getInvoiceVal(inv, 'short_url');
                return (
                  <div className="flex flex-col items-end gap-2">
                    {shortUrl && (
                      <div className="flex items-center gap-2">
                        <a href={String(shortUrl)} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-auto p-1 text-sm inline-flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </Button>
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard('invoice-url', String(shortUrl))}>{copiedKey === 'invoice-url' ? 'Copied' : 'Copy Link'}</Button>
                      </div>
                    )}
                  </div>
                );
              })()}
              <DialogClose asChild>
                <Button variant="outline" size="sm">Close</Button>
              </DialogClose>
            </div>
          </div>

          <div className="p-2 max-h-[70vh] overflow-y-auto text-sm">
            {invoiceDetailsLoading ? (
              <div className="py-8 text-center">Loading invoice...</div>
            ) : invoiceDetailsError ? (
              <div className="py-8 text-center text-red-600">{invoiceDetailsError}</div>
            ) : invoiceDetails ? (
              (() => {
                const inv = invoiceDetails as Record<string, unknown>;
                const status = getInvoiceVal(inv, 'status') || '--';
                const amountRaw = getInvoiceVal(inv, 'amount');
                const currency = getInvoiceVal(inv, 'currency') || 'INR';
                const amountDisplay = amountRaw ? `${currency} ${Number(amountRaw) / 100}` : '--';
                const customerId = getInvoiceVal(inv, 'customer_id') || '';
                const custDetails = inv['customer_details'] as Record<string, unknown> | undefined;
                const customerName = String((custDetails?.['customer_name'] || custDetails?.['name'] || customerId || '--'));
                const lineItems = Array.isArray(inv['line_items']) ? (inv['line_items'] as unknown as Record<string, unknown>[]) : [];
                const notes = inv['notes'] as Record<string, unknown> | undefined;
                const terms = inv['terms_and_conditions'] ? String(inv['terms_and_conditions']) : undefined;

                const billing = (inv['billing_address'] as Record<string, unknown> | undefined) || (custDetails?.['billing_address'] as Record<string, unknown> | undefined);
                const shipping = (inv['shipping_address'] as Record<string, unknown> | undefined) || (custDetails?.['shipping_address'] as Record<string, unknown> | undefined);

                const issuedAt = inv['issued_at'] ? Number(inv['issued_at']) : (inv['date'] ? Number(inv['date']) : undefined);
                const dueDate = inv['due_date'] ? Number(inv['due_date']) : undefined;
                const paidAt = inv['paid_at'] ? Number(inv['paid_at']) : undefined;

                const subtotal = Number(getInvoiceVal(inv, 'sub_total') || getInvoiceVal(inv, 'subtotal') || 0);
                const tax = Number(getInvoiceVal(inv, 'tax') || 0);
                const total = Number(getInvoiceVal(inv, 'amount') || 0);
                const amount_paid = Number(getInvoiceVal(inv, 'amount_paid') || 0);
                const amount_due = Number(getInvoiceVal(inv, 'amount_due') || (total - amount_paid));

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <div>
                        <div className="text-xs text-muted-foreground">Invoice ID </div>
                        <div className="font-mono break-all">{selectedInvoiceId}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Invoice Number</div>
                        <div className="font-medium">{String(inv['invoice_number'] || inv['receipt'] || '--')}</div>
                      </div>

                      <div className="flex items-start justify-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div className="font-medium">{status}</div>
                          <div className="text-xs text-muted-foreground mt-2">Total</div>
                          <div className="font-bold text-lg">{amountDisplay}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Customer</div>
                        <div className="font-medium">{customerName}</div>
                        {custDetails && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {String(custDetails['email'] || custDetails['email_id'] || '')}
                            <div>{String(custDetails['contact'] || custDetails['phone'] || '')}</div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Dates</div>
                        <div className="mt-1 text-sm">
                          <div>Issued: {issuedAt ? new Date(issuedAt * 1000).toLocaleString('en-IN') : '--'}</div>
                          <div>Due: {dueDate ? new Date(dueDate * 1000).toLocaleString('en-IN') : '--'}</div>
                          <div>Paid: {paidAt ? new Date(paidAt * 1000).toLocaleString('en-IN') : '--'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Meta</div>
                        <div className="mt-1 text-sm">
                          <div>Order ID: {String(inv['order_id'] || '--')}</div>
                          <div>Payment ID: {String(inv['payment_id'] || '--')}</div>
                        </div>
                      </div>
                    </div>

                    {lineItems.length > 0 && (
                      <div className="p-3 rounded border">
                        <div className="text-sm font-medium">Line Items</div>
                        <div className="mt-2 space-y-2">
                          {lineItems.map((li, idx) => {
                            const id = String((li as Record<string, unknown>)['id'] ?? idx);
                            const name = String((li as Record<string, unknown>)['name'] ?? (li as Record<string, unknown>)['description'] ?? 'Item');
                            const liAmount = Number((li as Record<string, unknown>)['amount'] ?? 0) / 100;
                            const liCurrency = String((li as Record<string, unknown>)['currency'] ?? currency);
                            return (
                              <div key={id} className="flex items-center justify-between">
                                <div className="text-sm">{name}</div>
                                <div className="text-sm font-medium">{liCurrency ? `${liCurrency} ${liAmount}` : `₹${liAmount.toFixed(2)}`}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        {billing && (
                          <div className="p-3 rounded border">
                            <div className="text-sm font-medium">Billing Address</div>
                            <div className="mt-2 text-sm whitespace-pre-line">
                              {String(billing['line1'] || billing['address_line1'] || '')}{billing && billing['line2'] ? `\n${String(billing['line2'])}` : ''}
                              {billing && billing['city'] ? `\n${String(billing['city'])}` : ''}
                              {billing && billing['state'] ? `\n${String(billing['state'])}` : ''}
                              {billing && billing['postcode'] ? `\n${String(billing['postcode'])}` : ''}
                              {billing && billing['country'] ? `\n${String(billing['country'])}` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        {shipping && (
                          <div className="p-3 rounded border">
                            <div className="text-sm font-medium">Shipping Address</div>
                            <div className="mt-2 text-sm whitespace-pre-line">
                              {String(shipping['line1'] || shipping['address_line1'] || '')}{shipping && shipping['line2'] ? `\n${String(shipping['line2'])}` : ''}
                              {shipping && shipping['city'] ? `\n${String(shipping['city'])}` : ''}
                              {shipping && shipping['state'] ? `\n${String(shipping['state'])}` : ''}
                              {shipping && shipping['postcode'] ? `\n${String(shipping['postcode'])}` : ''}
                              {shipping && shipping['country'] ? `\n${String(shipping['country'])}` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="p-3 rounded border">
                          <div className="text-sm font-medium">Amount Summary</div>
                          <div className="mt-2 text-sm space-y-1">
                            <div>Subtotal: {subtotal ? `${currency} ${(subtotal/100).toFixed(2)}` : '--'}</div>
                            <div>Tax: {tax ? `${currency} ${(tax/100).toFixed(2)}` : '--'}</div>
                            <div className="font-medium">Total: {total ? `${currency} ${(total/100).toFixed(2)}` : '--'}</div>
                            <div>Amount Paid: {amount_paid ? `${currency} ${(amount_paid/100).toFixed(2)}` : '0.00'}</div>
                            <div>Amount Due: {amount_due ? `${currency} ${(amount_due/100).toFixed(2)}` : '0.00'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {notes && typeof notes === 'object' && (
                      <div className="p-3 rounded border">
                        <div className="text-sm font-medium">Notes</div>
                        <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(notes, null, 2)}</pre>
                      </div>
                    )}

                    {terms && (
                      <div className="p-3 rounded border">
                        <div className="text-sm font-medium">Terms & Conditions</div>
                        <div className="mt-2 text-sm whitespace-pre-wrap">{terms}</div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center text-muted-foreground">No invoice selected</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
