"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: string;
  billingCycle: string;
  stripePriceId?: string | null;
  razorpaySubscriptionPlanId?: string | null;
}

interface FreeTrialConfig {
  id?: string;
  planId: string;
  durationDays: number;
  isActive: boolean;
}

export default function SalesOffers() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [config, setConfig] = useState<FreeTrialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FreeTrialConfig>({
    planId: "",
    durationDays: 7,
    isActive: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, configRes] = await Promise.all([
          fetch("/api/admin/subscription-plans"),
          fetch("/api/admin/free-trial"),
        ]);

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData.data?.plans || []);
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.data) {
            setConfig(configData.data);
            setFormData({
              planId: configData.data.planId,
              durationDays: configData.data.durationDays,
              isActive: configData.data.isActive,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId) {
      toast({ title: "Error", description: "Please select a plan", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const url = config?.id 
        ? `/api/admin/free-trial/${config.id}` 
        : `/api/admin/free-trial`;
      const method = config?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to save free trial configuration");
      }

      const data = await res.json();
      setConfig(data.data);
      toast({ title: "Success", description: "Free trial configuration saved successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config?.id) return;
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/free-trial/${config.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete free trial configuration");
      }

      setConfig(null);
      setFormData({
        planId: "",
        durationDays: 7,
        isActive: true,
      });
      toast({ title: "Success", description: "Free trial configuration deleted." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sales and Offers</h1>
      
      <div className="bg-card text-card-foreground shadow-sm rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">One-Time Free Trial Configuration</h2>
        <p className="text-muted-foreground mb-6">
          Configure a free trial offer for newly registered users. Users can only claim this offer once if they have never subscribed before.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Subscription Plan for Trial</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
              {plans.length === 0 ? (
                <div className="text-sm text-muted-foreground col-span-2 p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 text-center">
                  No subscription plans available.
                </div>
              ) : (
                plans.map((plan) => {
                  const isSelected = formData.planId === plan.id;
                  const provider = plan.stripePriceId ? "Stripe" : (plan.razorpaySubscriptionPlanId ? "Razorpay" : "Unknown");
                  
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, planId: plan.id })}
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary" 
                          : "border-gray-200 dark:border-gray-800 bg-background hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-base">{plan.name}</div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-bold mb-3">
                        ${plan.price} <span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle || 'cycle'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          provider === 'Stripe' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          provider === 'Razorpay' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {provider}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {!formData.planId && plans.length > 0 && (
              <p className="text-xs text-destructive mt-1">Please select a plan to proceed.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trial Duration (Days)</label>
            <input
              type="number"
              min="1"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 7 })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Offer is active and visible to eligible users
            </label>
          </div>

          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
            
            {config && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2"
              >
                Delete Configuration
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
