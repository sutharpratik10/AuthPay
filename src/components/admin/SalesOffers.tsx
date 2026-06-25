"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: string;
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscription Plan for Trial</label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              required
            >
              <option value="" disabled>Select a plan...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (${plan.price})
                </option>
              ))}
            </select>
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
