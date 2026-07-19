"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableColumn } from '@/components/ui/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/components/Loading'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  Users,
  Check,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';

interface SubscriptionPlan extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string | null;
  isActive: boolean;
  isVisibleToCustomers?: boolean;
  createdAt: string;
  updatedAt: string;
  userCountActive?: number;
  razorpaySubscriptionId?: string;
  razorpaySubscriptionPlanId?: string;
  razorpaySubscriptionLink?: string;
  displayOrder?: number;
  badgeText?: string;
  enableAutoPopular?: boolean;
}

interface CreatePlanData {
  name: string;
  description: string;
  price: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  razorpaySubscriptionId?: string;
  razorpaySubscriptionPlanId?: string;
  razorpaySubscriptionLink?: string;
  badgeText?: string;
  enableAutoPopular?: boolean;
}

// Razorpay Subscription Interface
interface RazorpaySubscription extends Record<string, unknown> {
  id: string;
  entity: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  charge_at?: number;
  created_at: number;
  short_url?: string;
  notes?: Record<string, string>;
  quantity?: number;
  auth_attempts?: number;
  total_count?: number;
  paid_count?: number;
  customer_notify?: boolean;
  expire_by?: number;
  offer_id?: string;
  start_at?: number;
  end_at?: number;
  has_scheduled_changes?: boolean;
  remaining_count?: number;
}

interface RazorpayInvoice extends Record<string, unknown> {
  id: string;
  order_id?: string;
  subscription_id?: string;
  status?: string;
  expire_by?: number;
  issued_at?: number;
  paid_at?: number;
  cancelled_at?: number;
  expired_at?: number;
  sms_status?: string;
  email_status?: string;
  date?: number;
  partial_payment?: boolean;
  amount?: number;
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  description?: string | null;
  notes?: Record<string, string>;
  short_url?: string;
  created_at?: number;
}

// Razorpay Plan interfaces (minimal)
interface RazorpayPlanItem extends Record<string, unknown> {
  id: string;
  active?: boolean;
  name?: string;
  description?: string | null;
  amount?: number;
  unit_amount?: number;
  currency?: string;
  created_at?: number;
}

interface RazorpayPlan extends Record<string, unknown> {
  id: string;
  entity: string;
  interval?: number;
  period?: string;
  item?: RazorpayPlanItem;
  notes?: Record<string, string>;
  created_at?: number;
  isVisibleToCustomers?: boolean;
}


// ─── Column Definitions ───
const basicPlanColumns: DataTableColumn<SubscriptionPlan>[] = [
  {
    id: "name",
    header: "Plan Name",
    accessorKey: "name",
    sortable: true,
    searchable: true,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.name}</div>
        {row.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{row.description}</div>}
      </div>
    )
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <span className="font-mono">{row.price}</span>
  },
  {
    id: "billingCycle",
    header: "Billing Cycle",
    accessorKey: "billingCycle",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.billingCycle}</Badge>
  },
  {
    id: "features",
    header: "Features",
    accessorFn: (row) => {
      let f = [];
      if (Array.isArray(row.features)) f = row.features;
      else if (typeof row.features === 'string') {
        try {
          const p = JSON.parse(row.features);
          f = Array.isArray(p) ? p : [row.features];
        } catch { f = row.features.includes(',') ? row.features.split(',') : [row.features]; }
      }
      return f.length;
    },
    cell: ({ row }) => {
      let f = [];
      if (Array.isArray(row.features)) f = row.features;
      else if (typeof row.features === 'string') {
        try {
          const p = JSON.parse(row.features);
          f = Array.isArray(p) ? p : [row.features];
        } catch { f = row.features.includes(',') ? row.features.split(',') : [row.features]; }
      }
      return <span className="text-xs bg-muted px-2 py-1 rounded-full">{f.length} features</span>;
    }
  },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAt",
    sortable: true,
    searchable: true,
    filterType: "date",
    cell: ({ row }) => <span className="text-sm">{new Date(row.createdAt as string).toLocaleDateString()}</span>
  },
  {
    id: "visibility",
    header: "Visibility",
    accessorKey: "isVisibleToCustomers",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Switch
          checked={row.isVisibleToCustomers ?? true}
          onCheckedChange={() => window.dispatchEvent(new CustomEvent('toggle-basic-plan-visibility', { detail: { id: row.id, currentVisibility: row.isVisibleToCustomers ?? true } }))}
        />
      </div>
    )
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => window.dispatchEvent(new CustomEvent('edit-basic-plan', { detail: row }))}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => window.dispatchEvent(new CustomEvent('delete-basic-plan', { detail: row }))}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }
];

const razorpayPlanColumns: DataTableColumn<RazorpayPlan>[] = [
  {
    id: "id",
    header: "Plan Id",
    accessorKey: "id",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <button type="button" className="text-primary underline hover:text-primary/80 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('load-razorpay-plan', { detail: row.id }))}>{row.id}</button>
  },
  {
    id: "name",
    header: "Plan Name",
    accessorFn: (row) => row.item?.name || '-',
    sortable: true,
    searchable: true
  },
  {
    id: "amount",
    header: "Amount/Unit",
    accessorFn: (row) => row.item?.amount || row.item?.unit_amount || 0,
    sortable: true,
    searchable: true,
    cell: ({ row }) => {
      const amt = row.item?.amount || row.item?.unit_amount || 0;
      return row.item?.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.item.currency }).format(amt / 100) : amt;
    }
  },
  {
    id: "period",
    header: "Billing Cycle",
    accessorKey: "period",
    sortable: true,
    searchable: true,
    cell: ({ row }) => row.period || '-'
  },
  {
    id: "created_at",
    header: "Created At",
    accessorKey: "created_at",
    sortable: true,
    searchable: true,
    filterType: "date",
    cell: ({ row }) => row.created_at ? new Date(row.created_at * 1000).toLocaleString() : '-'
  }
];

const razorpaySubscriptionColumns: DataTableColumn<RazorpaySubscription>[] = [
  {
    id: "id",
    header: "Sub Id",
    accessorKey: "id",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <button type="button" className="text-primary underline font-mono text-xs cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('load-razorpay-subscription', { detail: row.id }))}>{row.id}</button>
  },
  {
    id: "plan_id",
    header: "Plan",
    accessorKey: "plan_id",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <span className="font-mono text-xs">{row.plan_id}</span>
  },
  {
    id: "short_url",
    header: "Link",
    accessorKey: "short_url",
    sortable: true,
    searchable: true,
    cell: ({ row }) => row.short_url ? <a href={row.short_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Open</a> : '--'
  },
  {
    id: "customer_id",
    header: "Customer",
    accessorKey: "customer_id",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <span className="font-mono text-xs">{row.customer_id || '--'}</span>
  },
  {
    id: "current_end",
    header: "Next Due on",
    accessorKey: "current_end",
    sortable: true,
    cell: ({ row }) => row.current_end ? new Date(row.current_end * 1000).toLocaleDateString() : '--'
  },
  {
    id: "created_at",
    header: "Created At",
    accessorKey: "created_at",
    sortable: true,
    searchable: true,
    filterType: "date",
    cell: ({ row }) => row.created_at ? new Date(row.created_at * 1000).toLocaleString() : '--'
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    searchable: true,
    cell: ({ row }) => {
      const s = row.status;
      return s === 'active' ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
        : s === 'created' ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Created</Badge>
          : s === 'authenticated' ? <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Auth'd</Badge>
            : s === 'halted' ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Halted</Badge>
              : s === 'pending' ? <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                : s === 'cancelled' || s === 'completed' ? <Badge variant="secondary" className="capitalize">{s}</Badge>
                  : <Badge variant="outline">{s}</Badge>;
    }
  }
];

const invoiceColumns: DataTableColumn<RazorpayInvoice>[] = [
  {
    id: "id",
    header: "Invoice ID",
    accessorKey: "id",
    sortable: true,
    searchable: true,
    cell: ({ row }) => <span className="font-mono text-xs">{row.id}</span>
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    searchable: true,
    cell: ({ row }) => {
      return row.status === 'paid' ? <Badge className="bg-green-100 text-green-700">Paid</Badge>
        : row.status === 'pending' ? <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          : <span className="text-sm capitalize">{row.status}</span>;
    }
  },
  {
    id: "amount",
    header: "Amount",
    accessorFn: (row) => row.amount || 0,
    sortable: true,
    cell: ({ row }) => row.amount ? (row.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.currency }).format(row.amount / 100) : row.amount) : '--'
  },
  {
    id: "issued_at",
    header: "Issued",
    accessorKey: "issued_at",
    sortable: true,
    searchable: true,
    filterType: "date",
    cell: ({ row }) => row.issued_at ? new Date(row.issued_at * 1000).toLocaleString() : '--'
  },
  {
    id: "paid_at",
    header: "Paid",
    accessorKey: "paid_at",
    sortable: true,
    searchable: true,
    filterType: "date",
    cell: ({ row }) => row.paid_at ? new Date(row.paid_at * 1000).toLocaleString() : '--'
  },
  {
    id: "short_url",
    header: "Link",
    accessorKey: "short_url",
    cell: ({ row }) => row.short_url ? <a href={row.short_url} target="_blank" rel="noreferrer" className="text-primary underline">Open</a> : '--'
  }
];

export default function RazorPay() {

  useEffect(() => {
    const handleLoadPlan = (e: any) => { loadRazorpayPlan(e.detail); setPlanDialogOpen(true); };
    const handleLoadSub = (e: any) => { loadRazorpaySubscription(e.detail); setSubscriptionDialogOpen(true); };
    const handleEditBasic = (e: any) => openEditDialog(e.detail);
    const handleDeleteBasic = (e: any) => openDeleteDialog(e.detail);
    const handleToggleVis = (e: any) => toggleBasicPlanVisibility(e.detail.id, e.detail.currentVisibility);

    window.addEventListener('load-razorpay-plan', handleLoadPlan);
    window.addEventListener('load-razorpay-subscription', handleLoadSub);
    window.addEventListener('edit-basic-plan', handleEditBasic);
    window.addEventListener('delete-basic-plan', handleDeleteBasic);
    window.addEventListener('toggle-basic-plan-visibility', handleToggleVis);

    return () => {
      window.removeEventListener('load-razorpay-plan', handleLoadPlan);
      window.removeEventListener('load-razorpay-subscription', handleLoadSub);
      window.removeEventListener('edit-basic-plan', handleEditBasic);
      window.removeEventListener('delete-basic-plan', handleDeleteBasic);
      window.removeEventListener('toggle-basic-plan-visibility', handleToggleVis);
    };
  }, []);


  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  // Razorpay Subscriptions State
  const [razorpaySubscriptions, setRazorpaySubscriptions] = useState<RazorpaySubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const subscriptionsPageSize = 10;

  // Razorpay Subscriptions Filters
  const [subscriptionFilters, setSubscriptionFilters] = useState({
    id: '',
    plan_id: '',
    short_url: '',
    customer_id: '',
    current_end: '',
    created_at: '',
    status: '',
  });

  // Filtered subscriptions
  const filteredRazorpaySubscriptions = razorpaySubscriptions.filter((sub) => {
    // Subscription Id
    if (subscriptionFilters.id && !sub.id.toLowerCase().includes(subscriptionFilters.id.toLowerCase())) return false;
    // Plan Id
    if (subscriptionFilters.plan_id && !sub.plan_id.toLowerCase().includes(subscriptionFilters.plan_id.toLowerCase())) return false;
    // Subscription Link
    if (subscriptionFilters.short_url && !(sub.short_url || '').toLowerCase().includes(subscriptionFilters.short_url.toLowerCase())) return false;
    // Customer Id
    if (subscriptionFilters.customer_id && !(sub.customer_id || '').toLowerCase().includes(subscriptionFilters.customer_id.toLowerCase())) return false;
    // Next Due on (date string)
    if (subscriptionFilters.current_end && sub.current_end) {
      const dateStr = new Date(sub.current_end * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      if (!dateStr.toLowerCase().includes(subscriptionFilters.current_end.toLowerCase())) return false;
    } else if (subscriptionFilters.current_end) {
      return false;
    }
    // Created At (date string)
    if (subscriptionFilters.created_at && sub.created_at) {
      const dateStr = new Date(sub.created_at * 1000).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
      if (!dateStr.toLowerCase().includes(subscriptionFilters.created_at.toLowerCase())) return false;
    } else if (subscriptionFilters.created_at) {
      return false;
    }
    // Status
    if (subscriptionFilters.status && !sub.status.toLowerCase().includes(subscriptionFilters.status.toLowerCase())) return false;
    return true;
  });

  // Sorting for subscriptions table (client-side)
  type SubSortField = 'id' | 'plan_id' | 'short_url' | 'customer_id' | 'current_end' | 'created_at' | 'status';
  const [sortField, setSortField] = useState<SubSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SubSortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRazorpaySubscriptions = useMemo(() => {
    const arr = [...filteredRazorpaySubscriptions];
    arr.sort((a, b) => {
      const aRaw = (a as unknown as Record<string, unknown>)[sortField];
      const bRaw = (b as unknown as Record<string, unknown>)[sortField];

      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'created_at' || sortField === 'current_end') {
        aVal = Number(aRaw ?? 0);
        bVal = Number(bRaw ?? 0);
      } else {
        aVal = String(aRaw ?? '').toLowerCase();
        bVal = String(bRaw ?? '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredRazorpaySubscriptions, sortField, sortDirection]);

  // Razorpay Plans State
  const [razorpayPlans, setRazorpayPlans] = useState<RazorpayPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [plansPage, setPlansPage] = useState(1);
  const [plansTotal, setPlansTotal] = useState(0);
  const plansPageSize = 10;

  // Razorpay Plans sorting and column filtering
  type RazorpayPlanSortField = 'id' | 'name' | 'amount' | 'period' | 'created_at';
  const [razorpayPlanSortField, setRazorpayPlanSortField] = useState<RazorpayPlanSortField>('created_at');
  const [razorpayPlanSortDirection, setRazorpayPlanSortDirection] = useState<'asc' | 'desc'>('desc');
  const [razorpayPlanColumnFilters, setRazorpayPlanColumnFilters] = useState<Record<string, string>>({});

  const handleRazorpayPlanSort = (field: RazorpayPlanSortField) => {
    if (field === razorpayPlanSortField) {
      setRazorpayPlanSortDirection(razorpayPlanSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRazorpayPlanSortField(field);
      setRazorpayPlanSortDirection('asc');
    }
  };

  const handleRazorpayPlanColumnFilter = (column: string, value: string) => {
    setRazorpayPlanColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const filteredAndSortedRazorpayPlans = useMemo(() => {
    let result = [...razorpayPlans];

    // Apply column filters
    Object.entries(razorpayPlanColumnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        result = result.filter((plan) => {
          if (column === 'name' || column === 'amount') {
            const item = plan.item as RazorpayPlanItem | undefined;
            if (!item) return false;
            const itemValue = String((item as Record<string, unknown>)[column] || '').toLowerCase();
            return itemValue.includes(filterValue.toLowerCase());
          } else {
            const itemValue = String((plan as Record<string, unknown>)[column] || '').toLowerCase();
            return itemValue.includes(filterValue.toLowerCase());
          }
        });
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (razorpayPlanSortField === 'name' || razorpayPlanSortField === 'amount') {
        const aItem = a.item as RazorpayPlanItem | undefined;
        const bItem = b.item as RazorpayPlanItem | undefined;
        aVal = (aItem as Record<string, unknown>)?.[razorpayPlanSortField] as string | number || '';
        bVal = (bItem as Record<string, unknown>)?.[razorpayPlanSortField] as string | number || '';
      } else {
        aVal = (a as Record<string, unknown>)[razorpayPlanSortField] as string | number || '';
        bVal = (b as Record<string, unknown>)[razorpayPlanSortField] as string | number || '';
      }

      if (razorpayPlanSortField === 'amount' || razorpayPlanSortField === 'created_at') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return razorpayPlanSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return razorpayPlanSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [razorpayPlans, razorpayPlanColumnFilters, razorpayPlanSortField, razorpayPlanSortDirection]);

  // Single plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedRazorpayPlan, setSelectedRazorpayPlan] = useState<RazorpayPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Copy feedback states (brief animation/text change)
  const [copiedPlanId, setCopiedPlanId] = useState(false);
  const [copiedSubscriptionId, setCopiedSubscriptionId] = useState(false);
  const copyPlanTimerRef = React.useRef<number | null>(null);
  const copySubTimerRef = React.useRef<number | null>(null);

  // Single subscription dialog state
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedRazorpaySubscription, setSelectedRazorpaySubscription] = useState<RazorpaySubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  // Invoices for the currently selected subscription
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<RazorpayInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    features: [],
    isActive: true,
    razorpaySubscriptionId: '',
    razorpaySubscriptionPlanId: '',
    razorpaySubscriptionLink: '',
    badgeText: '',
    enableAutoPopular: false,
  });

  // Razorpay Plan Create (Dialog) state
  const [razorCreateDialogOpen, setRazorCreateDialogOpen] = useState(false);
  const [rpPeriod, setRpPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [rpInterval, setRpInterval] = useState<number>(1);
  const [rpName, setRpName] = useState('');
  const [rpAmount, setRpAmount] = useState(''); // user-facing amount (e.g., 699.00) or smallest unit depending on UI
  const [rpCurrency, setRpCurrency] = useState('INR');
  const [rpDescription, setRpDescription] = useState('');
  const [rpNotes, setRpNotes] = useState(''); // simple JSON string of notes key-values (optional)
  const [rpFeatures, setRpFeatures] = useState<string[]>([]); // Features to store in database
  const [rpNewFeature, setRpNewFeature] = useState(''); // Input for adding new feature
  // const [creatingRp, setCreatingRp] = useState(false);

  const resetRazorCreateForm = () => {
    setRpPeriod('monthly');
    setRpInterval(1);
    setRpName('');
    setRpAmount('');
    setRpCurrency('INR');
    setRpDescription('');
    setRpNotes('');
    setRpFeatures([]);
    setRpNewFeature('');
  };

  const createRazorpayPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // convert amount to paise / cents depending on currency; assume smallest unit = amount * 100
      const amountNumber = Math.round(Number(rpAmount) * 100);
      const payload = {
        period: rpPeriod,
        interval: rpInterval,
        item: {
          name: rpName,
          amount: amountNumber,
          currency: rpCurrency,
          description: rpDescription || undefined,
        },
        notes: rpNotes ? JSON.parse(rpNotes) : undefined,
        // Features to store in database (not sent to Razorpay)
        features: rpFeatures.length > 0 ? rpFeatures : undefined,
      };

      const res = await fetch('/api/payments/razorpay-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data && !data.error) {
        toast({ title: 'Plan created', description: `Razorpay plan ${data.id || ''} created`, variant: 'success' });
        setRazorCreateDialogOpen(false);
        resetRazorCreateForm();
        // refresh plans list
        loadRazorpayPlans(plansPage);
      } else {
        toast({ title: 'Error', description: data?.error?.description || data?.error || 'Failed to create plan', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Create Razorpay plan failed', err);
      toast({ title: 'Error', description: 'Failed to create Razorpay plan', variant: 'destructive' });
    } finally {
      // finished
    }
  };

  const [newFeature, setNewFeature] = useState('');

  // Sorting Dashboard Logic
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sortedDashboardPlans, setSortedDashboardPlans] = useState<SubscriptionPlan[]>([]);
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // When opening sort dialog, combine all visible plans and sort them
  const openSortDialog = () => {
    // Combine basic plans and razorpay linked plans
    const allVisiblePlans = [...plans].filter(p => p.isActive && p.isVisibleToCustomers);
    // Note: 'plans' state contains ALL DB plans, so just filtering by visibility is enough.

    // Sort by displayOrder
    const sorted = [...allVisiblePlans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setSortedDashboardPlans(sorted);

    // Set default tab
    const periods = Array.from(new Set(sorted.map(p => (p.billingCycle || '').toLowerCase())));
    if (periods.length > 0) setActiveTab(periods[0]);
    else setActiveTab('monthly');

    setSortDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPlanId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if needed, or browser default
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPlanId || draggedPlanId === targetId) return;

    // Filter items for current tab
    const tabItems = sortedDashboardPlans.filter(p => (p.billingCycle || '').toLowerCase() === activeTab);

    // Check if dragged item and target are in current tab
    if (!tabItems.find(p => p.id === draggedPlanId) || !tabItems.find(p => p.id === targetId)) return;

    const sourceIndex = tabItems.findIndex(p => p.id === draggedPlanId);
    const targetIndex = tabItems.findIndex(p => p.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Reorder locally in tab items
    const newTabItems = [...tabItems];
    const [removed] = newTabItems.splice(sourceIndex, 1);
    newTabItems.splice(targetIndex, 0, removed);

    // Merge back into global list preserving slots
    const newGlobalList = [...sortedDashboardPlans];
    let tabItemIndex = 0;

    for (let i = 0; i < newGlobalList.length; i++) {
      const cycle = (newGlobalList[i].billingCycle || '').toLowerCase();
      if (cycle === activeTab) {
        newGlobalList[i] = newTabItems[tabItemIndex];
        tabItemIndex++;
      }
    }

    setSortedDashboardPlans(newGlobalList);
  };

  const handleSaveSortOrder = async () => {
    try {
      // Create payload with plan metadata (order, badge, auto-popular)
      const plans = sortedDashboardPlans.map((p, index) => ({
        id: p.id,
        // Calculate global order index based on current array position
        // Assuming sortedDashboardPlans represents the desired global order
        // OR if tabs are just for viewing, we might need to respect global order.
        // The current implementation of reordering seems to reorder the entire sortedDashboardPlans array using drag-and-drop on the filtered view?
        // Wait, the drag-and-drop in JSX operates on the filtered view?
        // Let's check handleDragOver... it reorders setSortedDashboardPlans.
        // So the array order IS the display order.
        badgeText: p.badgeText,
        enableAutoPopular: p.enableAutoPopular
      }));

      const res = await fetch('/api/admin/subscription-plans/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans }),
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Dashboard order and settings updated', variant: 'success' });
        setSortDialogOpen(false);
        loadPlans(); // Reload to reflect changes
      } else {
        toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Sort save error:', err);
      toast({ title: 'Error', description: 'Failed to save order', variant: 'destructive' });
    }
  };

  const updateSortPlan = (id: string, updates: Partial<SubscriptionPlan>) => {
    setSortedDashboardPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Load plans
  const loadPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        // Fetch active user count for each plan
        const plansWithCounts = await Promise.all(
          data.data.plans.map(async (plan: SubscriptionPlan) => {
            const res = await fetch(`/api/admin/subscription-plans/${plan.id}/active-user-count`);
            const countData = res.ok ? await res.json() : { count: 0 };
            return { ...plan, userCountActive: countData.count ?? 0 };
          })
        );
        setPlans(plansWithCounts);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load subscription plans",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load Razorpay subscriptions
  const loadRazorpaySubscriptions = useCallback(async (page: number = 1) => {
    setSubscriptionsLoading(true);
    setSubscriptionsError(null);
    try {
      const skip = (page - 1) * subscriptionsPageSize;
      const response = await fetch(`/api/payments/razorpay-subscriptions?count=${subscriptionsPageSize}&skip=${skip}`);
      const data = await response.json();

      if (data.success) {
        setRazorpaySubscriptions(data.subscriptions || []);
        setSubscriptionsTotal(data.count || 0);
      } else {
        setSubscriptionsError(data.error || "Failed to load subscriptions");
        toast({
          title: "Error",
          description: data.error || "Failed to load Razorpay subscriptions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      const errorMessage = "Failed to load Razorpay subscriptions";
      setSubscriptionsError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [subscriptionsPageSize, toast]);

  useEffect(() => {
    loadPlans();
    loadRazorpaySubscriptions(subscriptionsPage);
  }, [loadPlans, loadRazorpaySubscriptions, subscriptionsPage]);

  // Load Razorpay plans
  const loadRazorpayPlans = useCallback(async (page: number = 1) => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const skip = (page - 1) * plansPageSize;
      const res = await fetch(`/api/payments/razorpay-plans?count=${plansPageSize}&skip=${skip}`);
      const data = await res.json();
      if (data && data.entity === 'collection') {
        setRazorpayPlans(data.items || []);
        setPlansTotal(data.count || (data.items || []).length);
      } else if (data && data.error) {
        setPlansError(data.error.description || 'Failed to load plans');
      } else {
        setPlansError('Failed to load plans');
      }
    } catch (err) {
      console.error('Error loading Razorpay plans', err);
      setPlansError('Failed to load Razorpay plans');
    } finally {
      setPlansLoading(false);
    }
  }, [plansPageSize]);

  useEffect(() => {
    loadRazorpayPlans(plansPage);
  }, [loadRazorpayPlans, plansPage]);

  // Load single Razorpay plan by id
  const loadRazorpayPlan = useCallback(async (id: string) => {
    setPlanLoading(true);
    setPlanError(null);
    setSelectedRazorpayPlan(null);
    setPlanDialogOpen(true);
    try {
      const res = await fetch(`/api/payments/razorpay-plans/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data && !data.error && data.data) {
        setSelectedRazorpayPlan(data.data as RazorpayPlan);
      } else {
        setPlanError(data?.error?.description || 'Failed to load plan');
      }
    } catch (err) {
      console.error('Error fetching plan', err);
      setPlanError('Failed to load plan');
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // Copy handlers with brief feedback
  const copyPlanId = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedPlanId(true);
      if (copyPlanTimerRef.current) window.clearTimeout(copyPlanTimerRef.current);
      copyPlanTimerRef.current = window.setTimeout(() => setCopiedPlanId(false), 1600);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, []);

  const copySubscriptionId = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedSubscriptionId(true);
      if (copySubTimerRef.current) window.clearTimeout(copySubTimerRef.current);
      copySubTimerRef.current = window.setTimeout(() => setCopiedSubscriptionId(false), 1600);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, []);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (copyPlanTimerRef.current) window.clearTimeout(copyPlanTimerRef.current);
      if (copySubTimerRef.current) window.clearTimeout(copySubTimerRef.current);
    };
  }, []);

  // Load single Razorpay subscription by id
  const loadRazorpayInvoices = useCallback(async (subscriptionId: string) => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    setSubscriptionInvoices([]);
    try {
      const res = await fetch(`/api/payments/razorpay-invoices?subscription_id=${encodeURIComponent(subscriptionId)}&count=50`);
      const data = await res.json();
      if (data && data.entity === 'collection') {
        setSubscriptionInvoices((data.items || []) as RazorpayInvoice[]);
      } else if (data && data.error) {
        setInvoicesError(data.error.description || 'Failed to load invoices');
      } else if (Array.isArray(data.items)) {
        setSubscriptionInvoices(data.items as RazorpayInvoice[]);
      } else {
        setInvoicesError('Failed to load invoices');
      }
    } catch (err) {
      console.error('Error loading invoices', err);
      setInvoicesError('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const loadRazorpaySubscription = useCallback(async (id: string) => {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    setSelectedRazorpaySubscription(null);
    setSubscriptionDialogOpen(true);
    try {
      const res = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data && !data.error) {
        setSelectedRazorpaySubscription(data as RazorpaySubscription);
        // load invoices for this subscription (non-blocking)
        loadRazorpayInvoices(String((data as RazorpaySubscription).id));
      } else {
        setSubscriptionError(data?.error?.description || 'Failed to load subscription');
      }
    } catch (err) {
      console.error('Error fetching subscription', err);
      setSubscriptionError('Failed to load subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  }, [loadRazorpayInvoices]);

  // Cancel a subscription
  const cancelRazorpaySubscription = useCallback(async (id: string) => {
    try {
      // guard: if selected subscription status is known and not cancellable, abort
      const current = selectedRazorpaySubscription && selectedRazorpaySubscription.id === id ? selectedRazorpaySubscription : null;
      if (current) {
        const status = String(current.status);
        if (status !== 'active' && status !== 'paused') {
          toast({ title: 'Invalid action', description: `Subscription in status '${status}' cannot be cancelled`, variant: 'destructive' });
          return;
        }
      }

      const res = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data && !data.error) {
        toast({ title: 'Subscription cancelled', description: `Subscription ${id} cancelled`, variant: 'success' });
        // refresh list and selected subscription
        setSubscriptionDialogOpen(false);
        loadRazorpaySubscriptions(subscriptionsPage);
      } else {
        toast({ title: 'Error', description: data?.error?.description || 'Failed to cancel subscription', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error cancelling subscription', err);
      toast({ title: 'Error', description: 'Failed to cancel subscription', variant: 'destructive' });
    }
  }, [loadRazorpaySubscriptions, subscriptionsPage, toast, selectedRazorpaySubscription]);

  // Pause a subscription
  const pauseRazorpaySubscription = useCallback(async (id: string) => {
    try {
      // guard: ensure selected subscription is active before pausing
      const current = selectedRazorpaySubscription && selectedRazorpaySubscription.id === id ? selectedRazorpaySubscription : null;
      if (current && current.status !== 'active') {
        toast({ title: 'Invalid action', description: `Subscription must be active to pause (current: ${current.status})`, variant: 'destructive' });
        return;
      }

      // pause now
      const res = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(id)}/pause`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pause_at: 'now' }) });
      const data = await res.json();
      if (data && !data.error) {
        toast({ title: 'Subscription paused', description: `Subscription ${id} paused`, variant: 'success' });
        // refresh selected subscription details
        await loadRazorpaySubscription(id);
        loadRazorpaySubscriptions(subscriptionsPage);
      } else {
        toast({ title: 'Error', description: data?.error?.description || 'Failed to pause subscription', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error pausing subscription', err);
      toast({ title: 'Error', description: 'Failed to pause subscription', variant: 'destructive' });
    }
  }, [loadRazorpaySubscription, loadRazorpaySubscriptions, subscriptionsPage, toast, selectedRazorpaySubscription]);

  // Resume a subscription
  const resumeRazorpaySubscription = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/payments/razorpay-subscriptions/${encodeURIComponent(id)}/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume_at: 'now' }) });
      const data = await res.json();
      if (data && !data.error) {
        toast({ title: 'Subscription resumed', description: `Subscription ${id} resumed`, variant: 'success' });
        await loadRazorpaySubscription(id);
        loadRazorpaySubscriptions(subscriptionsPage);
      } else {
        toast({ title: 'Error', description: data?.error?.description || 'Failed to resume subscription', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error resuming subscription', err);
      toast({ title: 'Error', description: 'Failed to resume subscription', variant: 'destructive' });
    }
  }, [loadRazorpaySubscription, loadRazorpaySubscriptions, subscriptionsPage, toast]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billingCycle: 'monthly',
      features: [],
      isActive: true,
      razorpaySubscriptionId: '',
      razorpaySubscriptionPlanId: '',
      razorpaySubscriptionLink: '',
    });
    setNewFeature('');
  };

  // Handle create plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/subscription-plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Subscription plan created successfully",
          variant: "success"
        });
        setCreateDialogOpen(false);
        resetForm();
        loadPlans();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create subscription plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription plan",
        variant: "destructive"
      });
    }
  };

  // Handle edit plan
  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json(); if (data.success) {
        toast({
          title: "Success",
          description: "Subscription plan updated successfully",
          variant: "success"
        });
        setEditDialogOpen(false);
        resetForm();
        setSelectedPlan(null);
        loadPlans();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update subscription plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription plan",
        variant: "destructive"
      });
    }
  };

  // Handle delete plan
  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}`, {
        method: 'DELETE',
      });

      const data = await response.json(); if (data.success) {
        toast({
          title: "Success",
          description: "Subscription plan deleted successfully",
          variant: "success"
        });
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
        loadPlans();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete subscription plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription plan",
        variant: "destructive"
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);

    // Safely parse features - handles JSON arrays, plain text, or already parsed arrays
    let features: string[] = [];
    if (plan.features) {
      if (Array.isArray(plan.features)) {
        // Already an array (parsed by API)
        features = plan.features as unknown as string[];
      } else if (typeof plan.features === 'string') {
        try {
          const parsed = JSON.parse(plan.features);
          features = Array.isArray(parsed) ? parsed : [plan.features];
        } catch {
          // Not valid JSON - treat as a single feature or split by newlines/commas
          features = plan.features.includes('\n')
            ? plan.features.split('\n').filter(f => f.trim())
            : plan.features.includes(',')
              ? plan.features.split(',').map(f => f.trim()).filter(f => f)
              : [plan.features];
        }
      }
    }

    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: features,
      isActive: plan.isActive,
      razorpaySubscriptionId: plan.razorpaySubscriptionId || '',
      razorpaySubscriptionPlanId: plan.razorpaySubscriptionPlanId || '',
      razorpaySubscriptionLink: plan.razorpaySubscriptionLink || '',
      badgeText: plan.badgeText || '',
      enableAutoPopular: plan.enableAutoPopular || false,
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  // Toggle visibility for Basic Plans (one-time plans)
  const toggleBasicPlanVisibility = async (planId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${planId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisibleToCustomers: !currentVisibility }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle visibility');
      }

      // Refresh plans
      loadPlans();
      toast({
        title: 'Success',
        description: `Plan visibility ${!currentVisibility ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle plan visibility',
        variant: 'destructive',
      });
    }
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Filter plans
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.billingCycle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Basic Plans table sorting and filtering
  type BasicPlanSortField = 'name' | 'price' | 'billingCycle' | 'isActive' | 'createdAt' | 'userCountActive';
  const [basicPlanSortField, setBasicPlanSortField] = useState<BasicPlanSortField>('createdAt');
  const [basicPlanSortDirection, setBasicPlanSortDirection] = useState<'asc' | 'desc'>('desc');
  const [basicPlanColumnFilters, setBasicPlanColumnFilters] = useState<Record<string, string>>({});

  const handleBasicPlanSort = (field: BasicPlanSortField) => {
    if (field === basicPlanSortField) {
      setBasicPlanSortDirection(basicPlanSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setBasicPlanSortField(field);
      setBasicPlanSortDirection('asc');
    }
  };

  const handleBasicPlanColumnFilter = (column: string, value: string) => {
    setBasicPlanColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const filteredAndSortedBasicPlans = useMemo(() => {
    // Only include local plans (exclude any plans linked to Razorpay)
    // A plan is considered a Razorpay plan if it has any of the Razorpay fields set
    let result = filteredPlans.filter(plan =>
      !plan.razorpaySubscriptionPlanId &&
      !plan.razorpaySubscriptionId &&
      !plan.razorpaySubscriptionLink
    );

    // Apply column filters
    Object.entries(basicPlanColumnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        result = result.filter((plan) => {
          const itemValue = String((plan as Record<string, unknown>)[column] || '').toLowerCase();
          return itemValue.includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number = (a as Record<string, unknown>)[basicPlanSortField] as string | number;
      let bVal: string | number = (b as Record<string, unknown>)[basicPlanSortField] as string | number;

      if (basicPlanSortField === 'price' || basicPlanSortField === 'userCountActive') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (basicPlanSortField === 'createdAt') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      } else if (basicPlanSortField === 'isActive') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return basicPlanSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return basicPlanSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredPlans, basicPlanColumnFilters, basicPlanSortField, basicPlanSortDirection]);

  // Parse features for display
  const parseFeatures = (featuresStr: string | null): string[] => {
    if (!featuresStr) return [];

    // If already an array (in case API returns parsed data)
    if (Array.isArray(featuresStr)) return featuresStr;

    try {
      const parsed = JSON.parse(featuresStr);
      return Array.isArray(parsed) ? parsed : [featuresStr];
    } catch {
      // Not valid JSON - treat as plain text and split by newlines or commas
      if (featuresStr.includes('\n')) {
        return featuresStr.split('\n').filter(f => f.trim());
      } else if (featuresStr.includes(',')) {
        return featuresStr.split(',').map(f => f.trim()).filter(f => f);
      }
      // Single feature as plain text
      return [featuresStr];
    }
  };

  if (loading) {
    return <Loading text="Loading subscription plans..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <Button
          variant="outline"
          onClick={openSortDialog}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Dashboard Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inactive Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => !p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monthly Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.billingCycle === 'monthly').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Plans Table */}
      <Card>
        <CardHeader className="relative pb-2">
          <div className="mb-2">
            <CardTitle className="m-0">Basic Plans</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              One-time payment plans — No automatic recurring charges. Clients pay once and won&apos;t be charged automatically.
            </p>
          </div>
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-accent text-primary">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreatePlan} className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Plan Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Basic, Pro, Enterprise"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="e.g., $9.99, $29.99"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the plan benefits..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCycle">Billing Cycle *</Label>
                        <select
                          id="billingCycle"
                          title="Select billing cycle"
                          value={formData.billingCycle}
                          onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                          required
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="one-time">One-time</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Active Plan</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="badgeText">Badge Text</Label>
                        <Input
                          id="badgeText"
                          value={formData.badgeText || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, badgeText: e.target.value }))}
                          placeholder="e.g. Best Value, Popular"
                        />
                      </div>
                      <div className="flex items-center space-x-2 h-full pt-6">
                        <Switch
                          id="enableAutoPopular"
                          checked={formData.enableAutoPopular || false}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableAutoPopular: checked }))}
                        />
                        <div className="flex flex-col" onClick={() => setFormData(prev => ({ ...prev, enableAutoPopular: !prev.enableAutoPopular }))}>
                          <Label htmlFor="enableAutoPopular" className="cursor-pointer">Auto 'Most Popular'</Label>
                          <span className="text-xs text-muted-foreground">If best seller, override badge</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Features</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add a feature..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          />
                          <Button type="button" onClick={addFeature} variant="outline">
                            Add
                          </Button>
                        </div>
                        {formData.features.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.features.map((feature, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                <span className="text-sm">{feature}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 mt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Plan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Sort Order Dialog */}
            <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Dashboard Plan Order</DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    Drag and drop plans to reorder how they appear on the dashboard.
                  </div>
                </DialogHeader>

                {/* Tabs */}
                {sortedDashboardPlans.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1 mb-2">
                    {Array.from(new Set(sortedDashboardPlans.map(p => (p.billingCycle || '').toLowerCase())))
                      .filter(Boolean)
                      .sort()
                      .map(cycle => (
                        <Button
                          key={cycle}
                          variant={activeTab === cycle ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveTab(cycle)}
                          className="h-7 text-xs capitalize"
                        >
                          {cycle}
                        </Button>
                      ))}
                  </div>
                )}
                <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {sortedDashboardPlans
                    .filter(plan => (plan.billingCycle || '').toLowerCase() === activeTab)
                    .map((plan, index) => (
                      <div
                        key={plan.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, plan.id)}
                        onDragOver={(e) => handleDragOver(e, plan.id)}
                        onDrop={(e) => e.preventDefault()}
                        className={`flex flex-col gap-3 p-3 bg-card border rounded-md cursor-grab active:cursor-grabbing ${draggedPlanId === plan.id ? 'opacity-50' : ''} hover:bg-accent/50 transition-colors`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                  {plan.billingCycle}
                                </Badge>
                                {plan.price}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">#{index + 1}</span>
                        </div>

                        <div className="flex items-center gap-3 pl-8" onMouseDown={(e) => e.stopPropagation()}>
                          <div className="flex-1">
                            <Input
                              placeholder="Badge Text (e.g. Best Value)"
                              className="h-8 text-xs w-full"
                              value={plan.badgeText || ''}
                              onChange={(e) => updateSortPlan(plan.id, { badgeText: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center space-x-2 border-l pl-3 bg-muted/30 p-1 rounded-sm">
                            <Switch
                              id={`auto-${plan.id}`}
                              checked={plan.enableAutoPopular || false}
                              onCheckedChange={(checked) => updateSortPlan(plan.id, { enableAutoPopular: checked })}
                              className="scale-90"
                            />
                            <Label htmlFor={`auto-${plan.id}`} className="text-xs cursor-pointer whitespace-nowrap font-medium">Auto Popular</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  {sortedDashboardPlans.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No visible plans found. Ensure plans are marked as 'Visible to Customers'.
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSortDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveSortOrder}>Save Order</Button>
                </div>
              </DialogContent>
            </Dialog>


          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DataTable selectable={true}
              columns={basicPlanColumns}
              data={plans.filter(plan => !plan.razorpaySubscriptionPlanId && !plan.razorpaySubscriptionId && !plan.razorpaySubscriptionLink)}
              searchable={true}
              columnSearch={true}
              pagination={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Razorpay Plans Table */}
      <Card>
        <CardHeader className="relative pb-2">
          <CardTitle>Razorpay Plans</CardTitle>
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <Dialog open={razorCreateDialogOpen} onOpenChange={setRazorCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetRazorCreateForm(); setRazorCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-accent text-primary">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Create Razorpay Plan</DialogTitle>
                </DialogHeader>

                <form onSubmit={createRazorpayPlan} className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rp-name">Name *</Label>
                        <Input id="rp-name" value={rpName} onChange={e => setRpName(e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="rp-amount">Amount (e.g. 699.00) *</Label>
                        <Input id="rp-amount" value={rpAmount} onChange={e => setRpAmount(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rp-period">Period *</Label>
                        <select id="rp-period" aria-label="Razorpay plan period" value={rpPeriod} onChange={e => setRpPeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly')} className="w-full px-3 py-2 border border-input rounded">
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="rp-interval">Interval *</Label>
                        <Input id="rp-interval" type="number" min={1} value={String(rpInterval)} onChange={e => setRpInterval(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="rp-currency">Currency</Label>
                      <Input id="rp-currency" value={rpCurrency} onChange={e => setRpCurrency(e.target.value)} />
                    </div>

                    <div>
                      <Label htmlFor="rp-description">Description</Label>
                      <Textarea id="rp-description" value={rpDescription} onChange={e => setRpDescription(e.target.value)} rows={3} />
                    </div>

                    {/* Features section (stored in database only) */}
                    <div>
                      <Label>Features</Label>
                      <p className="text-xs text-muted-foreground mb-2">Features are stored in your database only (not sent to Razorpay)</p>
                      <div className="flex space-x-2 mb-3">
                        <Input
                          placeholder="Add a feature..."
                          value={rpNewFeature}
                          onChange={(e) => setRpNewFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && rpNewFeature.trim()) {
                              e.preventDefault();
                              setRpFeatures(prev => [...prev, rpNewFeature.trim()]);
                              setRpNewFeature('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (rpNewFeature.trim()) {
                              setRpFeatures(prev => [...prev, rpNewFeature.trim()]);
                              setRpNewFeature('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {rpFeatures.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {rpFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                              <span className="text-sm flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                {feature}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setRpFeatures(prev => prev.filter((_, i) => i !== index))}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="rp-notes">Notes (JSON)</Label>
                      <Textarea id="rp-notes" value={rpNotes} onChange={e => setRpNotes(e.target.value)} rows={3} placeholder='{"notes_key":"value"}' />
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 mt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setRazorCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>


          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {plansLoading ? (
            <div className="flex items-center justify-center min-h-24 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <span className="text-muted-foreground text-center">Loading Razorpay Plans...</span>
            </div>
          ) : plansError ? (
            <div className="text-red-600 p-4">{plansError}</div>
          ) : (
            <div className="w-full">
              <DataTable selectable={true}
                columns={razorpayPlanColumns}
                data={razorpayPlans}
                searchable={true}
                columnSearch={true}
                pagination={true}
              />


            </div>
          )}
        </CardContent>
      </Card>

      {/* Razorpay Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Razorpay Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {subscriptionsLoading ? (
            <div className="flex flex-col items-center justify-center min-h-32 py-8 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <span className="text-muted-foreground text-center">Loading subscriptions...</span>
            </div>
          ) : subscriptionsError ? (
            <div className="text-red-600 p-4">{subscriptionsError}</div>
          ) : (
            <div className="w-full">
              <DataTable selectable={true}
                columns={razorpaySubscriptionColumns}
                data={razorpaySubscriptions}
                searchable={true}
                columnSearch={true}
                pagination={true}
              />


            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedRazorpayPlan(null); setPlanError(null); } setPlanDialogOpen(open); }}>
        <DialogContent hideClose className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>Plan Details</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {planLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : planError ? (
              <div className="text-red-600">{planError}</div>
            ) : selectedRazorpayPlan ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                  {/* Left: prominent amount / summary */}
                  <div className="md:w-1/3 bg-muted/50 p-4 rounded-md flex flex-col items-start gap-2">
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="text-2xl font-semibold">
                      {selectedRazorpayPlan.item?.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: selectedRazorpayPlan.item.currency }).format((selectedRazorpayPlan.item.amount || selectedRazorpayPlan.item.unit_amount || 0) / 100) : '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Frequency</div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20">{selectedRazorpayPlan.period || '—'}</Badge>
                    </div>
                    <div className="mt-3 w-full">
                      <div className="text-sm text-muted-foreground">Plan Name</div>
                      <div className="font-medium">{selectedRazorpayPlan.item?.name || '-'}</div>
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className="md:flex-1 p-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Plan ID</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm truncate">{selectedRazorpayPlan.id}</div>
                          <Button size="sm" variant="outline" onClick={() => copyPlanId(selectedRazorpayPlan.id)}>
                            {copiedPlanId ? (<span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4 mr-1" />Copied</span>) : 'Copy ID'}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Created</div>
                        <div className="text-sm">{selectedRazorpayPlan.created_at ? new Date(selectedRazorpayPlan.created_at * 1000).toLocaleString() : '--'}</div>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="text-sm text-muted-foreground">Description</div>
                        <div className="text-sm">{selectedRazorpayPlan.item?.description || '--'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Currency</div>
                        <div>{selectedRazorpayPlan.item?.currency || '--'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Interval Count</div>
                        <div>{selectedRazorpayPlan.item ? `${(((selectedRazorpayPlan.item as unknown) as Record<string, unknown>)['interval_count'] ?? ((selectedRazorpayPlan.item as unknown) as Record<string, unknown>)['interval'] ?? '--')}` : '--'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="mt-2">
                    {selectedRazorpayPlan.notes ? (
                      <div className="space-y-1 text-sm">
                        {Object.entries(selectedRazorpayPlan.notes).map(([k, v]) => (
                          <div key={k}><strong>{k}:</strong> {v}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">--</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No plan selected.</div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button variant="outline" onClick={() => { setSelectedRazorpayPlan(null); setPlanDialogOpen(false); }}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Details Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedRazorpaySubscription(null); setSubscriptionError(null); } setSubscriptionDialogOpen(open); }}>
        <DialogContent hideClose className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>Subscription Details</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subscriptionError ? (
              <div className="text-red-600">{subscriptionError}</div>
            ) : selectedRazorpaySubscription ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:gap-6">
                  <div className="md:w-1/3 bg-muted/50 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Next Due</div>
                    <div className="text-lg font-semibold">{selectedRazorpaySubscription.current_end ? new Date(selectedRazorpaySubscription.current_end * 1000).toLocaleString() : '--'}</div>
                    <div className="mt-3 text-sm text-muted-foreground">Quantity</div>
                    <div className="font-medium">{selectedRazorpaySubscription.quantity ?? '--'}</div>
                    <div className="mt-3 text-sm text-muted-foreground">Short URL</div>
                    <div>
                      {selectedRazorpaySubscription.short_url ? (
                        <a href={selectedRazorpaySubscription.short_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open Link</a>
                      ) : (<span className="text-muted-foreground">--</span>)}
                    </div>
                  </div>

                  <div className="md:flex-1 p-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Subscription ID</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm truncate">{selectedRazorpaySubscription.id}</div>
                          <Button size="sm" variant="outline" onClick={() => copySubscriptionId(selectedRazorpaySubscription.id)}>
                            {copiedSubscriptionId ? (<span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4 mr-1" />Copied</span>) : 'Copy ID'}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Plan</div>
                        <div>
                          {selectedRazorpaySubscription.plan_id ? (
                            <button type="button" className="text-primary underline hover:text-primary/80" onClick={() => { loadRazorpayPlan(selectedRazorpaySubscription.plan_id); setPlanDialogOpen(true); }}>{selectedRazorpaySubscription.plan_id}</button>
                          ) : (<span className="text-muted-foreground">--</span>)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Created</div>
                        <div className="text-sm">{selectedRazorpaySubscription.created_at ? new Date(selectedRazorpaySubscription.created_at * 1000).toLocaleString() : '--'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="text-sm">{selectedRazorpaySubscription.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                        ) : selectedRazorpaySubscription.status === 'created' ? (
                          <Badge className="bg-neutral-100 text-neutral-700 border-neutral-200">Created</Badge>
                        ) : selectedRazorpaySubscription.status === 'cancelled' ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>
                        ) : (
                          <Badge variant="outline">{selectedRazorpaySubscription.status}</Badge>
                        )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="text-sm text-muted-foreground">Notes</div>
                        <div className="mt-2 text-sm">
                          {selectedRazorpaySubscription.notes ? (
                            <div className="space-y-1">
                              {Object.entries(selectedRazorpaySubscription.notes).map(([k, v]) => (<div key={k}><strong>{k}:</strong> {v}</div>))}
                            </div>
                          ) : (<span className="text-muted-foreground">--</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoices list */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Invoices</div>
                  {invoicesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading invoices...</div>
                  ) : invoicesError ? (
                    <div className="text-sm text-red-600">{invoicesError}</div>
                  ) : subscriptionInvoices.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No invoices found.</div>
                  ) : (
                    <div className="overflow-x-auto mt-2">
                      <DataTable selectable={true}
                        columns={invoiceColumns}
                        data={subscriptionInvoices}
                        searchable={true}
                        columnSearch={false}
                        pagination={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No subscription selected.</div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button size="sm" variant="outline" onClick={() => selectedRazorpaySubscription && pauseRazorpaySubscription(selectedRazorpaySubscription.id)}>Pause</Button>
            <Button size="sm" variant="secondary" onClick={() => selectedRazorpaySubscription && resumeRazorpaySubscription(selectedRazorpaySubscription.id)}>Resume</Button>
            <Button size="sm" variant="destructive" onClick={() => selectedRazorpaySubscription && cancelRazorpaySubscription(selectedRazorpaySubscription.id)}>Cancel Subscription</Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedRazorpaySubscription(null); setSubscriptionDialogOpen(false); }}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Basic Plan Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-accent text-primary">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Subscription Plan</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditPlan} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Plan Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Basic, Pro, Enterprise"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price *</Label>
                  <Input
                    id="edit-price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., $9.99, $29.99"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-razorpaySubscriptionId">Razorpay Subscription ID</Label>
                  <Input
                    id="edit-razorpaySubscriptionId"
                    value={formData.razorpaySubscriptionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpaySubscriptionId: e.target.value }))}
                    placeholder="Enter Razorpay Subscription ID"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-razorpaySubscriptionPlanId">Razorpay Subscription Plan ID</Label>
                  <Input
                    id="edit-razorpaySubscriptionPlanId"
                    value={formData.razorpaySubscriptionPlanId}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpaySubscriptionPlanId: e.target.value }))}
                    placeholder="Enter Razorpay Subscription Plan ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-razorpaySubscriptionLink">Razorpay Subscription Link</Label>
                  <Input
                    id="edit-razorpaySubscriptionLink"
                    value={formData.razorpaySubscriptionLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpaySubscriptionLink: e.target.value }))}
                    placeholder="Enter Razorpay Subscription Link"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the plan benefits..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-billingCycle">Billing Cycle *</Label>
                  <select
                    id="edit-billingCycle"
                    title="Select billing cycle"
                    value={formData.billingCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-isActive">Active Plan</Label>
                </div>
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline">
                      Add
                    </Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm">{feature}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Plan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the plan &ldquo;{selectedPlan?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Deleting this plan may affect existing subscriptions and billing.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Delete Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
