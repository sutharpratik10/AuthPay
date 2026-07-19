"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TablePagination,
} from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableColumn } from '@/components/ui/data-table/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/components/Loading';
import {
  Plus,
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  Package,
  Users,
  RefreshCw,
  Copy,
  Check,
  Ban,
} from 'lucide-react';

// ─── Stripe Type Mirrors ────────────────────────────────────────────────────
interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
  active: boolean;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created: number;
  metadata: Record<string, string>;
  default_price: StripePrice | string | null;
}

interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  metadata: Record<string, string>;
}

interface StripeSubscription {
  id: string;
  status: string;
  customer: StripeCustomer | string;
  items: {
    data: Array<{
      price: StripePrice;
    }>;
  };
  current_period_start: number;
  current_period_end: number;
  created: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  metadata: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAmount(amount: number | null | undefined, currency: string) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function fmtDate(unix: number | null | undefined) {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(unix: number | null | undefined) {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCustomerEmail(customer: StripeCustomer | string | null | undefined): string {
  if (!customer) return '—';
  if (typeof customer === 'string') return customer;
  return customer.email || customer.id;
}

function getCustomerName(customer: StripeCustomer | string | null | undefined): string {
  if (!customer) return '—';
  if (typeof customer === 'string') return customer;
  return customer.name || '—';
}

function getDefaultPrice(product: StripeProduct): StripePrice | null {
  if (!product.default_price) return null;
  if (typeof product.default_price === 'string') return null;
  return product.default_price;
}

function subscriptionStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default';
    case 'trialing': return 'secondary';
    case 'past_due': return 'destructive';
    case 'canceled': return 'destructive';
    case 'unpaid': return 'destructive';
    default: return 'outline';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function StripeAdmin() {
  const { toast } = useToast();

  // Copy state (moved up for column use)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* ignore */ }
  }, []);

  const productColumns: DataTableColumn<StripeProduct>[] = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.id}</p>
        </div>
      )
    },
    {
      id: "default_price",
      header: "Default Price",
      searchable: true,
      filterType: "text",
      cell: ({ row }) => {
        const price = getDefaultPrice(row);
        return price ? fmtAmount(price.unit_amount, price.currency) : '—';
      }
    },
    {
      id: "interval",
      header: "Interval",
      searchable: true,
      filterType: "text",
      cell: ({ row }) => {
        const price = getDefaultPrice(row);
        return price?.recurring
          ? `${price.recurring.interval_count > 1 ? price.recurring.interval_count + ' ' : ''}${price.recurring.interval}`
          : '—';
      }
    },
    {
      id: "active",
      header: "Active",
      accessorKey: "active",
      sortable: true,
      searchable: true,
      filterType: "boolean",
      cell: ({ row }) => (
        <Badge variant={row.active ? 'default' : 'secondary'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: "created",
      header: "Created",
      accessorKey: "created",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => fmtDate(row.created)
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={e => { e.stopPropagation(); copyId(row.id); }}
          title="Copy product ID"
        >
          {copiedId === row.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      )
    }
  ], [copiedId, copyId]);

  const subscriptionColumns: DataTableColumn<StripeSubscription>[] = useMemo(() => [
    {
      id: "id",
      header: "ID",
      accessorKey: "id",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => <span className="font-mono text-xs">{row.id}</span>
    },
    {
      id: "customer",
      header: "Customer",
      accessorKey: "customer",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{getCustomerEmail(row.customer)}</p>
          {getCustomerName(row.customer) !== '—' && (
            <p className="text-xs text-muted-foreground">{getCustomerName(row.customer)}</p>
          )}
        </div>
      )
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      searchable: true,
      filterType: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Trialing", value: "trialing" },
        { label: "Past Due", value: "past_due" },
        { label: "Canceled", value: "canceled" },
        { label: "Unpaid", value: "unpaid" },
        { label: "Incomplete", value: "incomplete" }
      ],
      cell: ({ row }) => (
        <>
          <Badge variant={subscriptionStatusColor(row.status)}>
            {row.status}
          </Badge>
          {row.cancel_at_period_end && (
            <Badge variant="outline" className="ml-1 text-[10px]">cancels at period end</Badge>
          )}
        </>
      )
    },
    {
      id: "amount",
      header: "Amount",
      searchable: true,
      filterType: "text",
      cell: ({ row }) => {
        const price = row.items?.data?.[0]?.price;
        return (
          <>
            {price ? fmtAmount(price.unit_amount, price.currency) : '—'}
            {price?.recurring && (
              <span className="text-xs text-muted-foreground ml-1">
                /{price.recurring.interval}
              </span>
            )}
          </>
        );
      }
    },
    {
      id: "current_period_end",
      header: "Period End",
      accessorKey: "current_period_end",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => fmtDate(row.current_period_end)
    },
    {
      id: "created",
      header: "Created",
      accessorKey: "created",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => fmtDate(row.created)
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={e => { e.stopPropagation(); copyId(row.id); }}
          title="Copy subscription ID"
        >
          {copiedId === row.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      )
    }
  ], [copiedId, copyId]);

  const customerColumns: DataTableColumn<StripeCustomer>[] = useMemo(() => [
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => row.email || '—'
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => row.name || '—'
    },
    {
      id: "id",
      header: "ID",
      accessorKey: "id",
      searchable: true,
      filterType: "text",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
    },
    {
      id: "created",
      header: "Created",
      accessorKey: "created",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => fmtDate(row.created)
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={e => { e.stopPropagation(); copyId(row.id); }}
          title="Copy customer ID"
        >
          {copiedId === row.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      )
    }
  ], [copiedId, copyId]);

  // ── Products ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsStartingAfter, setProductsStartingAfter] = useState<string | undefined>();
  const [productsCursor, setProductsCursor] = useState<string[]>([]);
  const PAGE_SIZE = 10;

  // Products table sort / filter
  type ProductSortField = 'name' | 'created' | 'active';
  const [productSortField, setProductSortField] = useState<ProductSortField>('created');
  const [productSortDir, setProductSortDir] = useState<'asc' | 'desc'>('desc');
  const [productColumnFilters, setProductColumnFilters] = useState<Record<string, string>>({});

  const handleProductSort = (field: ProductSortField) => {
    if (field === productSortField) {
      setProductSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setProductSortField(field);
      setProductSortDir('asc');
    }
  };

  const filteredSortedProducts = useMemo(() => {
    let list = [...products];
    Object.entries(productColumnFilters).forEach(([col, val]) => {
      if (!val) return;
      list = list.filter(p => {
        const raw = col === 'active'
          ? String(p.active)
          : String((p as unknown as Record<string, unknown>)[col] ?? '');
        return raw.toLowerCase().includes(val.toLowerCase());
      });
    });
    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (productSortField === 'created') {
        av = a.created; bv = b.created;
      } else if (productSortField === 'active') {
        av = a.active ? 1 : 0; bv = b.active ? 1 : 0;
      } else {
        av = a.name.toLowerCase(); bv = b.name.toLowerCase();
      }
      if (av < bv) return productSortDir === 'asc' ? -1 : 1;
      if (av > bv) return productSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, productColumnFilters, productSortField, productSortDir]);

  // Product detail dialog
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(null);
  const [productPrices, setProductPrices] = useState<StripePrice[]>([]);
  const [productDetailLoading, setProductDetailLoading] = useState(false);

  // Create product dialog
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  const [cpName, setCpName] = useState('');
  const [cpDescription, setCpDescription] = useState('');
  const [cpAmount, setCpAmount] = useState('');
  const [cpCurrency, setCpCurrency] = useState('USD');
  const [cpInterval, setCpInterval] = useState<'month' | 'year'>('month');
  const [cpCreating, setCpCreating] = useState(false);

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subsHasMore, setSubsHasMore] = useState(false);
  const [subsStartingAfter, setSubsStartingAfter] = useState<string | undefined>();
  const [subsCursor, setSubsCursor] = useState<string[]>([]);
  const [subsStatusFilter, setSubsStatusFilter] = useState('');

  // Subscriptions sort / filter
  type SubSortField = 'id' | 'status' | 'created' | 'current_period_end';
  const [subSortField, setSubSortField] = useState<SubSortField>('created');
  const [subSortDir, setSubSortDir] = useState<'asc' | 'desc'>('desc');
  const [subColumnFilters, setSubColumnFilters] = useState<Record<string, string>>({});

  const handleSubSort = (field: SubSortField) => {
    if (field === subSortField) setSubSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSubSortField(field); setSubSortDir('asc'); }
  };

  const filteredSortedSubs = useMemo(() => {
    let list = [...subscriptions];
    Object.entries(subColumnFilters).forEach(([col, val]) => {
      if (!val) return;
      list = list.filter(s => {
        const raw = col === 'customer'
          ? getCustomerEmail(s.customer)
          : String((s as unknown as Record<string, unknown>)[col] ?? '');
        return raw.toLowerCase().includes(val.toLowerCase());
      });
    });
    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (subSortField === 'created') { av = a.created; bv = b.created; }
      else if (subSortField === 'current_period_end') { av = a.current_period_end; bv = b.current_period_end; }
      else { av = String(a[subSortField]).toLowerCase(); bv = String(b[subSortField]).toLowerCase(); }
      if (av < bv) return subSortDir === 'asc' ? -1 : 1;
      if (av > bv) return subSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [subscriptions, subColumnFilters, subSortField, subSortDir]);

  // Subscription detail dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<StripeSubscription | null>(null);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);

  // ── Customers ─────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersHasMore, setCustomersHasMore] = useState(false);
  const [customersCursor, setCustomersCursor] = useState<string[]>([]);
  const [customersStartingAfter, setCustomersStartingAfter] = useState<string | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');

  // Customers sort / filter
  type CustomerSortField = 'email' | 'name' | 'created';
  const [customerSortField, setCustomerSortField] = useState<CustomerSortField>('created');
  const [customerSortDir, setCustomerSortDir] = useState<'asc' | 'desc'>('desc');
  const [customerColumnFilters, setCustomerColumnFilters] = useState<Record<string, string>>({});

  const handleCustomerSort = (field: CustomerSortField) => {
    if (field === customerSortField) setCustomerSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setCustomerSortField(field); setCustomerSortDir('asc'); }
  };

  const filteredSortedCustomers = useMemo(() => {
    let list = [...customers];
    Object.entries(customerColumnFilters).forEach(([col, val]) => {
      if (!val) return;
      list = list.filter(c => {
        const raw = String((c as unknown as Record<string, unknown>)[col] ?? '');
        return raw.toLowerCase().includes(val.toLowerCase());
      });
    });
    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (customerSortField === 'created') { av = a.created; bv = b.created; }
      else { av = String(a[customerSortField] ?? '').toLowerCase(); bv = String(b[customerSortField] ?? '').toLowerCase(); }
      if (av < bv) return customerSortDir === 'asc' ? -1 : 1;
      if (av > bv) return customerSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [customers, customerColumnFilters, customerSortField, customerSortDir]);

  // ── Data Loaders ──────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (startingAfter?: string) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const url = new URL('/api/payments/stripe-products', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (startingAfter) url.searchParams.set('starting_after', startingAfter);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setProducts(data.data as StripeProduct[]);
        setProductsHasMore(data.has_more ?? false);
        setProductsStartingAfter(startingAfter);
      } else {
        setProductsError(data.error || 'Failed to load products');
      }
    } catch {
      setProductsError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async (startingAfter?: string, statusFilter?: string) => {
    setSubsLoading(true);
    setSubsError(null);
    try {
      const url = new URL('/api/payments/stripe-subscriptions', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (startingAfter) url.searchParams.set('starting_after', startingAfter);
      const status = statusFilter !== undefined ? statusFilter : subsStatusFilter;
      if (status) url.searchParams.set('status', status);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data as StripeSubscription[]);
        setSubsHasMore(data.has_more ?? false);
        setSubsStartingAfter(startingAfter);
      } else {
        setSubsError(data.error || 'Failed to load subscriptions');
      }
    } catch {
      setSubsError('Failed to load subscriptions');
    } finally {
      setSubsLoading(false);
    }
  }, [subsStatusFilter]);

  const loadCustomers = useCallback(async (startingAfter?: string, emailQuery?: string) => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const url = new URL('/api/payments/stripe-customers', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (startingAfter) url.searchParams.set('starting_after', startingAfter);
      const email = emailQuery !== undefined ? emailQuery : customerSearch;
      if (email) url.searchParams.set('email', email);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data as StripeCustomer[]);
        setCustomersHasMore(data.has_more ?? false);
        setCustomersStartingAfter(startingAfter);
      } else {
        setCustomersError(data.error || 'Failed to load customers');
      }
    } catch {
      setCustomersError('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  }, [customerSearch]);

  // Initial loads
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadSubscriptions(); }, [loadSubscriptions]);
  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // ── Product Detail ────────────────────────────────────────────────────────
  const openProductDetail = useCallback(async (product: StripeProduct) => {
    setSelectedProduct(product);
    setProductPrices([]);
    setProductDetailLoading(true);
    setProductDialogOpen(true);
    try {
      const res = await fetch(`/api/payments/stripe-products/${encodeURIComponent(product.id)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProduct(data.product as StripeProduct);
        setProductPrices((data.prices || []) as StripePrice[]);
      }
    } catch { /* ignore */ } finally {
      setProductDetailLoading(false);
    }
  }, []);

  // Archive product
  const archiveProduct = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/payments/stripe-products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product archived', description: `Product ${productId} set to inactive`, variant: 'success' });
        setProductDialogOpen(false);
        loadProducts(productsStartingAfter);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to archive product', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to archive product', variant: 'destructive' });
    }
  }, [loadProducts, productsStartingAfter, toast]);

  // Create product + price
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpCreating(true);
    try {
      const res = await fetch('/api/payments/stripe-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cpName,
          description: cpDescription || undefined,
          amount: Math.round(Number(cpAmount) * 100),
          currency: cpCurrency.toLowerCase(),
          interval: cpInterval,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product created', description: `${cpName} created with price`, variant: 'success' });
        setCreateProductDialogOpen(false);
        setCpName(''); setCpDescription(''); setCpAmount(''); setCpCurrency('USD'); setCpInterval('month');
        loadProducts();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create product', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' });
    } finally {
      setCpCreating(false);
    }
  };

  // ── Subscription Actions ──────────────────────────────────────────────────
  const openSubDetail = useCallback((sub: StripeSubscription) => {
    setSelectedSub(sub);
    setSubDialogOpen(true);
  }, []);

  const cancelSubscription = useCallback(async (subId: string, atPeriodEnd = false) => {
    setCancellingSubId(subId);
    try {
      const res = await fetch(
        `/api/payments/stripe-subscriptions/${encodeURIComponent(subId)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ at_period_end: atPeriodEnd }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Subscription cancelled',
          description: atPeriodEnd
            ? `Subscription ${subId} will cancel at period end`
            : `Subscription ${subId} cancelled immediately`,
          variant: 'success',
        });
        setSubDialogOpen(false);
        loadSubscriptions(subsStartingAfter);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to cancel subscription', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel subscription', variant: 'destructive' });
    } finally {
      setCancellingSubId(null);
    }
  }, [loadSubscriptions, subsStartingAfter, toast]);

  // ── Pagination helpers ────────────────────────────────────────────────────
  const productsPrevPage = () => {
    const prev = productsCursor[productsCursor.length - 2];
    setProductsCursor(c => c.slice(0, -1));
    loadProducts(prev);
  };
  const productsNextPage = () => {
    const lastId = products[products.length - 1]?.id;
    if (lastId) {
      setProductsCursor(c => [...c, lastId]);
      loadProducts(lastId);
    }
  };

  const subsPrevPage = () => {
    const prev = subsCursor[subsCursor.length - 2];
    setSubsCursor(c => c.slice(0, -1));
    loadSubscriptions(prev);
  };
  const subsNextPage = () => {
    const lastId = subscriptions[subscriptions.length - 1]?.id;
    if (lastId) {
      setSubsCursor(c => [...c, lastId]);
      loadSubscriptions(lastId);
    }
  };

  const customersPrevPage = () => {
    const prev = customersCursor[customersCursor.length - 2];
    setCustomersCursor(c => c.slice(0, -1));
    loadCustomers(prev);
  };
  const customersNextPage = () => {
    const lastId = customers[customers.length - 1]?.id;
    if (lastId) {
      setCustomersCursor(c => [...c, lastId]);
      loadCustomers(lastId);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const cancelledSubs = subscriptions.filter(s => s.status === 'canceled').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stripe Management</h1>
          <p className="text-muted-foreground">Manage Stripe products, subscriptions and customers</p>
        </div>
        <Button
          variant="outline"
          onClick={() => { loadProducts(); loadSubscriptions(); loadCustomers(); }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{activeSubs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Customers (page)</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cancelled Subs</p>
                <p className="text-2xl font-bold">{cancelledSubs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Products Table ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="relative pb-2">
          <div className="mb-2">
            <CardTitle className="m-0">Stripe Products</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Products and recurring prices from your Stripe account.
            </p>
          </div>
          <div className="absolute right-3 top-3">
            <Dialog open={createProductDialogOpen} onOpenChange={setCreateProductDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] bg-accent text-primary">
                <DialogHeader>
                  <DialogTitle>Create Stripe Product + Price</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="cp-name">Product Name *</Label>
                      <Input
                        id="cp-name"
                        value={cpName}
                        onChange={e => setCpName(e.target.value)}
                        placeholder="e.g. Pro Plan"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="cp-desc">Description</Label>
                      <Textarea
                        id="cp-desc"
                        value={cpDescription}
                        onChange={e => setCpDescription(e.target.value)}
                        placeholder="Optional description…"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cp-amount">Price Amount *</Label>
                      <Input
                        id="cp-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={cpAmount}
                        onChange={e => setCpAmount(e.target.value)}
                        placeholder="e.g. 9.99"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cp-currency">Currency</Label>
                      <select
                        id="cp-currency"
                        title="Select currency"
                        value={cpCurrency}
                        onChange={e => setCpCurrency(e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                        <option value="AUD">AUD</option>
                        <option value="CAD">CAD</option>
                        <option value="SGD">SGD</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="cp-interval">Billing Interval</Label>
                      <select
                        id="cp-interval"
                        title="Select billing interval"
                        value={cpInterval}
                        onChange={e => setCpInterval(e.target.value as 'month' | 'year')}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => setCreateProductDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={cpCreating}>
                      {cpCreating ? 'Creating…' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {productsError && (
            <p className="text-destructive text-sm mb-2">{productsError}</p>
          )}
          {productsLoading ? (
            <Loading text="Loading products…" size="sm" />
          ) : (
            <div className="overflow-x-auto">
              <DataTable selectable={true}
                columns={productColumns}
                data={filteredSortedProducts}
                searchable={true}
                columnSearch={true}
                pagination={false}
                export={true}
                title="Stripe Products"
                onRowClick={(row) => openProductDetail(row)}
              />
            </div>
          )}
          <TablePagination
            currentPage={productsCursor.length + 1}
            totalPages={productsHasMore ? (productsCursor.length + 2) : (productsCursor.length + 1)}
            pageSize={PAGE_SIZE}
            totalItems={productsHasMore ? (productsCursor.length + 1) * PAGE_SIZE + 1 : productsCursor.length * PAGE_SIZE + products.length}
            onPageChange={p => {
              const cur = productsCursor.length + 1;
              if (p > cur) productsNextPage();
              else if (p < cur) productsPrevPage();
            }}
          />
        </CardContent>
      </Card>

      {/* ── Subscriptions Table ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="relative pb-2">
          <div className="mb-2">
            <CardTitle className="m-0">Stripe Subscriptions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Active and past subscriptions from your Stripe account.
            </p>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <select
              title="Filter by subscription status"
              value={subsStatusFilter}
              onChange={e => {
                setSubsStatusFilter(e.target.value);
                setSubsCursor([]);
                loadSubscriptions(undefined, e.target.value);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Cancelled</option>
              <option value="unpaid">Unpaid</option>
              <option value="incomplete">Incomplete</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => { setSubsCursor([]); loadSubscriptions(undefined); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subsError && <p className="text-destructive text-sm mb-2">{subsError}</p>}
          {subsLoading ? (
            <Loading text="Loading subscriptions…" size="sm" />
          ) : (
            <div className="overflow-x-auto">
              <DataTable selectable={true}
                columns={subscriptionColumns}
                data={filteredSortedSubs}
                searchable={true}
                columnSearch={true}
                pagination={false}
                export={true}
                title="Stripe Subscriptions"
                onRowClick={(row) => openSubDetail(row)}
              />
            </div>
          )}
          <TablePagination
            currentPage={subsCursor.length + 1}
            totalPages={subsHasMore ? (subsCursor.length + 2) : (subsCursor.length + 1)}
            pageSize={PAGE_SIZE}
            totalItems={subsHasMore ? (subsCursor.length + 1) * PAGE_SIZE + 1 : subsCursor.length * PAGE_SIZE + subscriptions.length}
            onPageChange={p => {
              const cur = subsCursor.length + 1;
              if (p > cur) subsNextPage();
              else if (p < cur) subsPrevPage();
            }}
          />
        </CardContent>
      </Card>

      {/* ── Customers Table ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="relative pb-2">
          <div className="mb-2">
            <CardTitle className="m-0">Stripe Customers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customers registered in your Stripe account.
            </p>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email…"
                className="pl-9 h-9 w-56"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setCustomersCursor([]);
                    loadCustomers(undefined, customerSearch);
                  }
                }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setCustomersCursor([]); loadCustomers(undefined, customerSearch); }}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customersError && <p className="text-destructive text-sm mb-2">{customersError}</p>}
          {customersLoading ? (
            <Loading text="Loading customers…" size="sm" />
          ) : (
            <div className="overflow-x-auto">
              <DataTable selectable={true}
                columns={customerColumns}
                data={filteredSortedCustomers}
                searchable={true}
                columnSearch={true}
                pagination={false}
                export={true}
                title="Stripe Customers"
              />
            </div>
          )}
          <TablePagination
            currentPage={customersCursor.length + 1}
            totalPages={customersHasMore ? (customersCursor.length + 2) : (customersCursor.length + 1)}
            pageSize={PAGE_SIZE}
            totalItems={customersHasMore ? (customersCursor.length + 1) * PAGE_SIZE + 1 : customersCursor.length * PAGE_SIZE + customers.length}
            onPageChange={p => {
              const cur = customersCursor.length + 1;
              if (p > cur) customersNextPage();
              else if (p < cur) customersPrevPage();
            }}
          />
        </CardContent>
      </Card>

      {/* ── Product Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {productDetailLoading ? (
            <Loading text="Loading product…" size="sm" />
          ) : selectedProduct ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedProduct.id}</p>
                </div>
                <Badge variant={selectedProduct.active ? 'default' : 'secondary'}>
                  {selectedProduct.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{fmtDateTime(selectedProduct.created)}</p>
                </div>
              </div>

              {productPrices.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prices ({productPrices.length})</h4>
                  <div className="space-y-2">
                    {productPrices.map(price => (
                      <div key={price.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                        <div>
                          <p className="text-sm font-medium">
                            {fmtAmount(price.unit_amount, price.currency)}
                            {price.recurring && (
                              <span className="text-muted-foreground ml-1">
                                /{price.recurring.interval_count > 1 ? `${price.recurring.interval_count} ` : ''}{price.recurring.interval}
                              </span>
                            )}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">{price.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={price.active ? 'default' : 'secondary'} className="text-[10px]">
                            {price.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => copyId(price.id)} title="Copy price ID">
                            {copiedId === price.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.metadata && Object.keys(selectedProduct.metadata).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="bg-muted rounded-md p-3 text-xs font-mono space-y-1">
                    {Object.entries(selectedProduct.metadata).map(([k, v]) => (
                      <div key={k}><span className="text-muted-foreground">{k}:</span> {v}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!selectedProduct.active}
                  onClick={() => archiveProduct(selectedProduct.id)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Archive Product
                </Button>
                <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Subscription Detail Dialog ────────────────────────────────────── */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSub ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{selectedSub.id}</p>
                </div>
                <Badge variant={subscriptionStatusColor(selectedSub.status)}>
                  {selectedSub.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p>{getCustomerEmail(selectedSub.customer)}</p>
                  {getCustomerName(selectedSub.customer) !== '—' && (
                    <p className="text-xs text-muted-foreground">{getCustomerName(selectedSub.customer)}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{fmtDateTime(selectedSub.created)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Period</p>
                  <p>{fmtDate(selectedSub.current_period_start)} → {fmtDate(selectedSub.current_period_end)}</p>
                </div>
                {selectedSub.canceled_at && (
                  <div>
                    <p className="text-muted-foreground">Cancelled At</p>
                    <p>{fmtDateTime(selectedSub.canceled_at)}</p>
                  </div>
                )}
                {selectedSub.cancel_at_period_end && (
                  <div className="col-span-2">
                    <Badge variant="outline">Will cancel at end of current period</Badge>
                  </div>
                )}
              </div>

              {selectedSub.items?.data?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Plan</h4>
                  {selectedSub.items.data.map((item, idx) => {
                    const p = item.price;
                    return (
                      <div key={idx} className="bg-muted p-3 rounded-md text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {fmtAmount(p.unit_amount, p.currency)}
                              {p.recurring && (
                                <span className="text-muted-foreground ml-1">
                                  /{p.recurring.interval}
                                </span>
                              )}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">{p.id}</p>
                          </div>
                          <Badge variant={p.active ? 'default' : 'secondary'} className="text-[10px]">
                            {p.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedSub.metadata && Object.keys(selectedSub.metadata).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="bg-muted rounded-md p-3 text-xs font-mono space-y-1">
                    {Object.entries(selectedSub.metadata).map(([k, v]) => (
                      <div key={k}><span className="text-muted-foreground">{k}:</span> {v}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  {(selectedSub.status === 'active' || selectedSub.status === 'trialing') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingSubId === selectedSub.id || selectedSub.cancel_at_period_end}
                        onClick={() => cancelSubscription(selectedSub.id, true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel at Period End
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancellingSubId === selectedSub.id}
                        onClick={() => cancelSubscription(selectedSub.id, false)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {cancellingSubId === selectedSub.id ? 'Cancelling…' : 'Cancel Now'}
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => copyId(selectedSub.id)} title="Copy subscription ID">
                    {copiedId === selectedSub.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
