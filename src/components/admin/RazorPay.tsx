"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableHeadSortable,
  TableColumnSearch,
  TablePagination
} from '@/components/ui/table';
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
  Check
} from 'lucide-react';

interface SubscriptionPlan extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCountActive?: number;
  razorpay_subscription_id?: string;
  razorpay_subscription_plan_id?: string;
  razorpay_subscription_link?: string;
}

interface CreatePlanData {
  name: string;
  description: string;
  price: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  razorpay_subscription_id?: string;
  razorpay_subscription_plan_id?: string;
  razorpay_subscription_link?: string;
}

// Razorpay Subscription Interface
interface RazorpaySubscription {
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

interface RazorpayInvoice {
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
  notes?: Record<string,string>;
  created_at?: number;
}

export default function RazorPay() {
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
  type SubSortField = 'id'|'plan_id'|'short_url'|'customer_id'|'current_end'|'created_at'|'status';
  const [sortField, setSortField] = useState<SubSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('desc');

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
    razorpay_subscription_id: '',
    razorpay_subscription_plan_id: '',
    razorpay_subscription_link: '',
  });

  // Razorpay Plan Create (Dialog) state
  const [razorCreateDialogOpen, setRazorCreateDialogOpen] = useState(false);
  const [rpPeriod, setRpPeriod] = useState<'daily'|'weekly'|'monthly'|'quarterly'|'yearly'>('monthly');
  const [rpInterval, setRpInterval] = useState<number>(1);
  const [rpName, setRpName] = useState('');
  const [rpAmount, setRpAmount] = useState(''); // user-facing amount (e.g., 699.00) or smallest unit depending on UI
  const [rpCurrency, setRpCurrency] = useState('INR');
  const [rpDescription, setRpDescription] = useState('');
  const [rpNotes, setRpNotes] = useState(''); // simple JSON string of notes key-values (optional)
  // const [creatingRp, setCreatingRp] = useState(false);

  const resetRazorCreateForm = () => {
    setRpPeriod('monthly');
    setRpInterval(1);
    setRpName('');
    setRpAmount('');
    setRpCurrency('INR');
    setRpDescription('');
    setRpNotes('');
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
      if (data && !data.error) {
        setSelectedRazorpayPlan(data as RazorpayPlan);
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
      razorpay_subscription_id: '',
      razorpay_subscription_plan_id: '',
      razorpay_subscription_link: '',
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

      const data = await response.json();      if (data.success) {
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

      const data = await response.json();      if (data.success) {
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
    const features = plan.features ? JSON.parse(plan.features) : [];
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: features,
      isActive: plan.isActive,
      razorpay_subscription_id: plan.razorpay_subscription_id || '',
      razorpay_subscription_plan_id: plan.razorpay_subscription_plan_id || '',
      razorpay_subscription_link: plan.razorpay_subscription_link || '',
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
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
    let result = [...filteredPlans];

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
    try {
      return JSON.parse(featuresStr);
    } catch {
      return [];
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
        <CardHeader className="relative">
          <CardTitle className="m-0">Basic Plans</CardTitle>
          <div className="absolute right-3 top-3 flex items-center gap-2 w-auto sm:w-80 md:w-96">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans by name, description, or billing cycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'name' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('name')}
                  >
                    Plan
                  </TableHeadSortable>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'price' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('price')}
                  >
                    Price
                  </TableHeadSortable>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'billingCycle' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('billingCycle')}
                  >
                    Billing Cycle
                  </TableHeadSortable>
                  <TableHead>Features</TableHead>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'isActive' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('isActive')}
                  >
                    Status
                  </TableHeadSortable>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'createdAt' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('createdAt')}
                  >
                    Created
                  </TableHeadSortable>
                  <TableHeadSortable
                    sortable
                    sortDirection={basicPlanSortField === 'userCountActive' ? basicPlanSortDirection : null}
                    onSort={() => handleBasicPlanSort('userCountActive')}
                  >
                    User Count
                  </TableHeadSortable>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search plan..."
                      onSearch={(value) => handleBasicPlanColumnFilter('name', value)}
                    />
                  </TableHead>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search price..."
                      onSearch={(value) => handleBasicPlanColumnFilter('price', value)}
                    />
                  </TableHead>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search cycle..."
                      onSearch={(value) => handleBasicPlanColumnFilter('billingCycle', value)}
                    />
                  </TableHead>
                  <TableHead></TableHead>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search status..."
                      onSearch={(value) => handleBasicPlanColumnFilter('isActive', value)}
                    />
                  </TableHead>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search date..."
                      onSearch={(value) => handleBasicPlanColumnFilter('createdAt', value)}
                    />
                  </TableHead>
                  <TableHead>
                    <TableColumnSearch
                      placeholder="Search count..."
                      onSearch={(value) => handleBasicPlanColumnFilter('userCountActive', value)}
                    />
                  </TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBasicPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No plans found matching your search.' : 'No subscription plans found.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedBasicPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          {plan.description && (
                            <div className="max-w-xs">{plan.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="font-medium">{plan.price}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.billingCycle}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {parseFeatures(plan.features).length > 0 ? (
                            <div className="text-sm">
                              <span className="text-muted-foreground">{parseFeatures(plan.features).length} features</span>
                              <div className="text-xs text-muted-foreground truncate">
                                {parseFeatures(plan.features).slice(0, 2).join(', ')}{parseFeatures(plan.features).length > 2 && '...'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No features</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{new Date(plan.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{plan.userCountActive ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (!(plan.userCountActive && plan.userCountActive > 0)) openDeleteDialog(plan); }}
                            className={`text-red-600 hover:text-red-900 ${plan.userCountActive && plan.userCountActive > 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                            title={plan.userCountActive && plan.userCountActive > 0 ? 'Cannot delete: plan has active users' : 'Delete plan'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Razorpay Plans Table */}
      <Card>
        <CardHeader className="relative">
          <CardTitle>Razorpay Plans</CardTitle>
          <div className="absolute right-3 top-3 flex items-center gap-2 w-auto sm:w-80 md:w-96">
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
                        <select id="rp-period" aria-label="Razorpay plan period" value={rpPeriod} onChange={e => setRpPeriod(e.target.value as 'daily'|'weekly'|'monthly'|'quarterly'|'yearly')} className="w-full px-3 py-2 border border-input rounded">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {plansLoading ? (
            <div className="flex items-center justify-center min-h-24 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            </div>
          ) : plansError ? (
            <div className="text-red-600 p-4">{plansError}</div>
          ) : (
            <div className="w-full">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHeadSortable
                      sortable
                      sortDirection={razorpayPlanSortField === 'id' ? razorpayPlanSortDirection : null}
                      onSort={() => handleRazorpayPlanSort('id')}
                    >
                      Plan Id
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={razorpayPlanSortField === 'name' ? razorpayPlanSortDirection : null}
                      onSort={() => handleRazorpayPlanSort('name')}
                    >
                      Plan Name
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={razorpayPlanSortField === 'amount' ? razorpayPlanSortDirection : null}
                      onSort={() => handleRazorpayPlanSort('amount')}
                    >
                      Amount/Unit
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={razorpayPlanSortField === 'period' ? razorpayPlanSortDirection : null}
                      onSort={() => handleRazorpayPlanSort('period')}
                    >
                      Billing Cycle
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={razorpayPlanSortField === 'created_at' ? razorpayPlanSortDirection : null}
                      onSort={() => handleRazorpayPlanSort('created_at')}
                    >
                      Created At
                    </TableHeadSortable>
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search ID..."
                        onSearch={(value) => handleRazorpayPlanColumnFilter('id', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search name..."
                        onSearch={(value) => handleRazorpayPlanColumnFilter('name', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search amount..."
                        onSearch={(value) => handleRazorpayPlanColumnFilter('amount', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search cycle..."
                        onSearch={(value) => handleRazorpayPlanColumnFilter('period', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search date..."
                        onSearch={(value) => handleRazorpayPlanColumnFilter('created_at', value)}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRazorpayPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No plans found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRazorpayPlans.map((p: RazorpayPlan) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="text-primary underline hover:text-primary/80 cursor-pointer"
                            onClick={() => { loadRazorpayPlan(p.id); setPlanDialogOpen(true); }}
                          >
                            {p.id}
                          </button>
                        </TableCell>
                        <TableCell>{p.item?.name || '-'}</TableCell>
                        <TableCell>
                          {p.item?.currency ? (
                            <span>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: p.item.currency }).format((p.item.amount || p.item.unit_amount || 0) / 100)}
                            </span>
                          ) : (
                            (p.item?.amount || p.item?.unit_amount || '-')
                          )}
                        </TableCell>
                        <TableCell>{p.period || '-'}</TableCell>
                        <TableCell>{p.created_at ? new Date(p.created_at * 1000).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <TablePagination
                currentPage={plansPage}
                totalPages={Math.ceil(plansTotal / plansPageSize)}
                pageSize={plansPageSize}
                totalItems={plansTotal}
                onPageChange={setPlansPage}
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
        <CardContent className="overflow-x-auto p-0">
          {subscriptionsLoading ? (
            <div className="flex flex-col items-center justify-center min-h-32 py-8 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <span className="text-muted-foreground text-center">Loading subscriptions...</span>
            </div>
          ) : subscriptionsError ? (
            <div className="text-red-600 p-4">{subscriptionsError}</div>
          ) : (
            <div className="w-full">
              <Table className="">
                <TableHeader>
                  <TableRow>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'id' ? sortDirection : null}
                      onSort={() => handleSort('id')}
                    >
                      Subscription Id
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'plan_id' ? sortDirection : null}
                      onSort={() => handleSort('plan_id')}
                    >
                      Plan Id
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'short_url' ? sortDirection : null}
                      onSort={() => handleSort('short_url')}
                    >
                      Subscription Link
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'customer_id' ? sortDirection : null}
                      onSort={() => handleSort('customer_id')}
                    >
                      Customer Id
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'current_end' ? sortDirection : null}
                      onSort={() => handleSort('current_end')}
                    >
                      Next Due on
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'created_at' ? sortDirection : null}
                      onSort={() => handleSort('created_at')}
                    >
                      Created At
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortField === 'status' ? sortDirection : null}
                      onSort={() => handleSort('status')}
                    >
                      Status
                    </TableHeadSortable>
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter ID..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, id: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter plan..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, plan_id: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter link..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, short_url: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter customer..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, customer_id: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter date..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, current_end: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter date..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, created_at: value }))}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Filter status..."
                        onSearch={(value) => setSubscriptionFilters(f => ({ ...f, status: value }))}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRazorpaySubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRazorpaySubscriptions.map((subscription) => (
                      <TableRow key={subscription.id} >
                        <TableCell>
                          <button
                            type="button"
                            className="text-primary underline hover:text-primary/80 cursor-pointer"
                            onClick={() => { loadRazorpaySubscription(subscription.id); }}
                          >
                            {subscription.id}
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="text-primary underline hover:text-primary/80 cursor-pointer"
                            onClick={() => { loadRazorpayPlan(subscription.plan_id); setPlanDialogOpen(true); }}
                          >
                            {subscription.plan_id}
                          </button>
                        </TableCell>
                        <TableCell>
                          {subscription.short_url ? (
                            <a 
                              href={subscription.short_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {subscription.short_url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {subscription.customer_id || <span className="text-muted-foreground">--</span>}
                        </TableCell>
                        <TableCell>
                          {subscription.current_end ? (
                            <span className="text-sm">
                              {new Date(subscription.current_end * 1000).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(subscription.created_at * 1000).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {subscription.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : subscription.status === 'created' ? (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              Created
                            </Badge>
                          ) : subscription.status === 'cancelled' ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              {subscription.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <TablePagination
                currentPage={subscriptionsPage}
                totalPages={Math.ceil(subscriptionsTotal / subscriptionsPageSize)}
                pageSize={subscriptionsPageSize}
                totalItems={subscriptionsTotal}
                onPageChange={setSubscriptionsPage}
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
                          <div>{`${(((selectedRazorpayPlan.item as unknown) as Record<string, unknown>)['interval_count'] ?? ((selectedRazorpayPlan.item as unknown) as Record<string, unknown>)['interval'] ?? '--')}`}</div>
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
                              {copiedSubscriptionId ? (<span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4 mr-1"/>Copied</span>) : 'Copy ID'}
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
                              <Badge className="bg-gray-100 text-gray-700 border-gray-200">Created</Badge>
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
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="pr-4">Invoice ID</th>
                              <th className="pr-4">Status</th>
                              <th className="pr-4">Amount</th>
                              <th className="pr-4">Issued</th>
                              <th className="pr-4">Paid</th>
                              <th className="pr-4">Link</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscriptionInvoices.map((inv: RazorpayInvoice) => (
                              <tr key={inv.id} className="border-t">
                                <td className="py-2 pr-4 font-mono text-xs">{inv.id}</td>
                                <td className="py-2 pr-4">
                                  {inv.status === 'paid' ? <Badge className="bg-green-100 text-green-700">Paid</Badge> : inv.status === 'pending' ? <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge> : <span className="text-sm">{inv.status}</span>}
                                </td>
                                <td className="py-2 pr-4">{inv.amount ? (inv.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency }).format(inv.amount / 100) : inv.amount) : '--'}</td>
                                <td className="py-2 pr-4">{inv.issued_at ? new Date(inv.issued_at * 1000).toLocaleString() : '--'}</td>
                                <td className="py-2 pr-4">{inv.paid_at ? new Date(inv.paid_at * 1000).toLocaleString() : '--'}</td>
                                <td className="py-2 pr-4">{inv.short_url ? (<a href={inv.short_url} target="_blank" rel="noreferrer" className="text-primary underline">Open</a>) : '--'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                  <Label htmlFor="edit-razorpay_subscription_id">Razorpay Subscription ID</Label>
                  <Input
                    id="edit-razorpay_subscription_id"
                    value={formData.razorpay_subscription_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_id: e.target.value }))}
                    placeholder="Enter Razorpay Subscription ID"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-razorpay_subscription_plan_id">Razorpay Subscription Plan ID</Label>
                  <Input
                    id="edit-razorpay_subscription_plan_id"
                    value={formData.razorpay_subscription_plan_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_plan_id: e.target.value }))}
                    placeholder="Enter Razorpay Subscription Plan ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-razorpay_subscription_link">Razorpay Subscription Link</Label>
                  <Input
                    id="edit-razorpay_subscription_link"
                    value={formData.razorpay_subscription_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_link: e.target.value }))}
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
    </div>
  );
}
