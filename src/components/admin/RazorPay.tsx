"use client"

import React, { useState, useEffect, useCallback } from 'react';
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
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
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
  Users
} from 'lucide-react';

interface SubscriptionPlan {
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

// Razorpay Plan interfaces (minimal)
interface RazorpayPlanItem {
  id: string;
  active?: boolean;
  name?: string;
  description?: string | null;
  amount?: number;
  unit_amount?: number;
  currency?: string;
  created_at?: number;
}

interface RazorpayPlan {
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
  
  // Razorpay Plans State
  const [razorpayPlans, setRazorpayPlans] = useState<RazorpayPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [plansPage, setPlansPage] = useState(1);
  const [plansTotal, setPlansTotal] = useState(0);
  const plansPageSize = 10;

  // Single plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedRazorpayPlan, setSelectedRazorpayPlan] = useState<RazorpayPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Single subscription dialog state
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedRazorpaySubscription, setSelectedRazorpaySubscription] = useState<RazorpaySubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

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

  // Load single Razorpay subscription by id
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
      } else {
        setSubscriptionError(data?.error?.description || 'Failed to load subscription');
      }
    } catch (err) {
      console.error('Error fetching subscription', err);
      setSubscriptionError('Failed to load subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

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
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razorpay_subscription_id">Razorpay Subscription ID</Label>
                    <Input
                      id="razorpay_subscription_id"
                      value={formData.razorpay_subscription_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_id: e.target.value }))}
                      placeholder="Enter Razorpay Subscription ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="razorpay_subscription_plan_id">Razorpay Subscription Plan ID</Label>
                    <Input
                      id="razorpay_subscription_plan_id"
                      value={formData.razorpay_subscription_plan_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_plan_id: e.target.value }))}
                      placeholder="Enter Razorpay Subscription Plan ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razorpay_subscription_link">Razorpay Subscription Link</Label>
                    <Input
                      id="razorpay_subscription_link"
                      value={formData.razorpay_subscription_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, razorpay_subscription_link: e.target.value }))}
                      placeholder="Enter Razorpay Subscription Link"
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

      {/* Plans Table */}
      <Card>
        <CardHeader className="relative">
          <CardTitle className="m-0">Basic Plans</CardTitle>
          <div className="absolute right-3 top-3 w-50 sm:w-40 md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans by name, description, or billing cycle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>User Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No plans found matching your search.' : 'No subscription plans found.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
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
        <CardHeader>
          <CardTitle>Razorpay Plans</CardTitle>
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
                    <TableHead>Plan Id</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Amount/Unit</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {razorpayPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No plans found.</TableCell>
                    </TableRow>
                  ) : (
                    razorpayPlans.map((p: RazorpayPlan) => (
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

              {plansTotal > plansPageSize && (
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-slate-50 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">Page {plansPage} of {Math.ceil(plansTotal / plansPageSize)} ({plansTotal} total plans)</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={plansPage === 1} onClick={() => setPlansPage(p => Math.max(1, p - 1))}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={plansPage === Math.ceil(plansTotal / plansPageSize)} onClick={() => setPlansPage(p => Math.min(Math.ceil(plansTotal / plansPageSize), p + 1))}>Next</Button>
                  </div>
                </div>
              )}
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
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="py-3 align-middle" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Subscription Id</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.id}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, id: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Plan Id</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.plan_id}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, plan_id: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Subscription Link</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.short_url}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, short_url: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Customer Id</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.customer_id}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, customer_id: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Next Due on</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.current_end}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, current_end: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Created At</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.created_at}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, created_at: e.target.value }))}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col py-2">
                        <span>Status</span>
                        <input
                          type="text"
                          className="mt-1 px-2 py-1 border rounded text-xs bg-background"
                          placeholder="Filter..."
                          value={subscriptionFilters.status}
                          onChange={e => setSubscriptionFilters(f => ({ ...f, status: e.target.value }))}
                        />
                      </div>
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
                    filteredRazorpaySubscriptions.map((subscription) => (
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
              {/* Pagination */}
              {subscriptionsTotal > subscriptionsPageSize && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t bg-slate-50 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">
                    Page {subscriptionsPage} of {Math.ceil(subscriptionsTotal / subscriptionsPageSize)} 
                    ({subscriptionsTotal} total subscriptions)
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={subscriptionsPage === 1} 
                      onClick={() => setSubscriptionsPage(p => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={subscriptionsPage === Math.ceil(subscriptionsTotal / subscriptionsPageSize)} 
                      onClick={() => setSubscriptionsPage(p => Math.min(Math.ceil(subscriptionsTotal / subscriptionsPageSize), p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedRazorpayPlan(null); setPlanError(null); } setPlanDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRazorpayPlan ? selectedRazorpayPlan.id : 'Plan Details'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {planLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : planError ? (
              <div className="text-red-600">{planError}</div>
            ) : selectedRazorpayPlan ? (
              <div>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">Plan Name</div>
                  <div className="font-medium">{selectedRazorpayPlan.item?.name || '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Plan Description</div>
                    <div>{selectedRazorpayPlan.item?.description || '--'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Billing Amount</div>
                    <div>
                      {selectedRazorpayPlan.item?.currency ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: selectedRazorpayPlan.item.currency }).format((selectedRazorpayPlan.item.amount || selectedRazorpayPlan.item.unit_amount || 0) / 100) : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Billing Frequency</div>
                    <div>{selectedRazorpayPlan.period || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created At</div>
                    <div>{selectedRazorpayPlan.created_at ? new Date(selectedRazorpayPlan.created_at * 1000).toLocaleString() : '--'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No plan selected.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Details Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedRazorpaySubscription(null); setSubscriptionError(null); } setSubscriptionDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRazorpaySubscription ? selectedRazorpaySubscription.id : 'Subscription Details'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subscriptionError ? (
              <div className="text-red-600">{subscriptionError}</div>
            ) : selectedRazorpaySubscription ? (
              <div>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">Subscription ID</div>
                  <div className="font-medium">{selectedRazorpaySubscription.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Plan</div>
                    <div>
                      {selectedRazorpaySubscription.plan_id ? (
                        <button
                          type="button"
                          className="text-primary underline hover:text-primary/80"
                          onClick={() => { loadRazorpayPlan(selectedRazorpaySubscription.plan_id); setPlanDialogOpen(true); }}
                        >
                          {selectedRazorpaySubscription.plan_id}
                        </button>
                      ) : (<span className="text-muted-foreground">--</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div>{selectedRazorpaySubscription.status}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Created At</div>
                    <div>{selectedRazorpaySubscription.created_at ? new Date(selectedRazorpaySubscription.created_at * 1000).toLocaleString() : '--'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Next Due</div>
                    <div>{selectedRazorpaySubscription.current_end ? new Date(selectedRazorpaySubscription.current_end * 1000).toLocaleString() : '--'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Short URL</div>
                    <div>
                      {selectedRazorpaySubscription.short_url ? (
                        <a href={selectedRazorpaySubscription.short_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {selectedRazorpaySubscription.short_url}
                        </a>
                      ) : (<span className="text-muted-foreground">--</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Quantity</div>
                    <div>{selectedRazorpaySubscription.quantity ?? '--'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Paid Count</div>
                    <div>{selectedRazorpaySubscription.paid_count ?? '--'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Total Count</div>
                    <div>{selectedRazorpaySubscription.total_count ?? '--'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Remaining</div>
                    <div>{selectedRazorpaySubscription.remaining_count ?? '--'}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Notes</div>
                    <div>
                      {selectedRazorpaySubscription.notes ? (
                        <div className="space-y-1">
                          {Object.entries(selectedRazorpaySubscription.notes).map(([k, v]) => (
                            <div key={k} className="text-sm"><strong>{k}:</strong> {v}</div>
                          ))}
                        </div>
                      ) : (<span className="text-muted-foreground">--</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No subscription selected.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
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
