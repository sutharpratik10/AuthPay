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
}

export default function AdminSubscriptionPlansPage() {
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans by name, description, or billing cycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans ({filteredPlans.length})</CardTitle>
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
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {plan.description}
                            </div>
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
                        <Badge variant="outline">
                          {plan.billingCycle}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {parseFeatures(plan.features).length > 0 ? (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                {parseFeatures(plan.features).length} features
                              </span>
                              <div className="text-xs text-muted-foreground truncate">
                                {parseFeatures(plan.features).slice(0, 2).join(', ')}
                                {parseFeatures(plan.features).length > 2 && '...'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No features</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{plan.userCountActive ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!(plan.userCountActive && plan.userCountActive > 0)) {
                                openDeleteDialog(plan);
                              }
                            }}
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
                  <TableRow>
                    <TableHead>Subscription Id</TableHead>
                    <TableHead>Plan Id</TableHead>
                    <TableHead>Subscription Link</TableHead>
                    <TableHead>Customer Id</TableHead>
                    <TableHead>Next Due on</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {razorpaySubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    razorpaySubscriptions.map((subscription) => (
                      <TableRow key={subscription.id} >
                        <TableCell>
                          <a 
                            href={`https://dashboard.razorpay.com/app/subscriptions/${subscription.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {subscription.id}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={`https://dashboard.razorpay.com/app/plans/${subscription.plan_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {subscription.plan_id}
                          </a>
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
