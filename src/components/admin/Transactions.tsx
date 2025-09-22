"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Calendar as CalendarIcon, Search, Download, X, ArrowUpDown, RefreshCcwIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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

export default function Transactions() {
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

  // Load data from API (only when necessary)
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
  }, [q, fromDate, toDate]); // Only API-relevant dependencies

  // Apply client-side filtering and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...allPayments];
    
    // Apply status filters
    if (statusFilters.length > 0) {
      filtered = filtered.filter((item: PaymentItem) => 
        statusFilters.includes(String(item.status || '').toLowerCase())
      );
    }
    
    // Apply method filters
    if (methodFilters.length > 0) {
      filtered = filtered.filter((item: PaymentItem) => 
        methodFilters.includes(String(item.method || '').toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField] as string | number;
      let bVal: string | number = b[sortField] as string | number;
      
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Payment Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor and manage payment transactions with advanced filtering
              </p>
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
              <DatePicker 
                date={fromDate} 
                setDate={setFromDate} 
                placeholder="From date" 
              />
              <DatePicker 
                date={toDate} 
                setDate={setToDate} 
                placeholder="To date" 
              />
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
                        <TableCell className="font-mono text-xs">{payment.id}</TableCell>
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
                              className="text-xs"
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
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing page {page} of {Math.ceil((totalCount || 0) / pageSize)} 
          {totalCount > 0 && ` (${totalCount} total results)`}
          {(statusFilters.length > 0 || methodFilters.length > 0) && 
            ` • ${filteredPayments.length} filtered`
          }
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            disabled={page === 1 || loading} 
            onClick={() => setPage(p => Math.max(1, p-1))}
          >
            Previous
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            disabled={page >= Math.ceil((totalCount || 0) / pageSize) || loading} 
            onClick={() => setPage(p => p+1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
