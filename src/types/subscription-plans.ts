export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  razorpaySubscriptionId: string | null;
  razorpaySubscriptionPlanId: string | null;
  razorpaySubscriptionLink: string | null;
  createdAt: string;
  updatedAt: string;
  priceNumber: number;
  formattedPrice: string;
  canPurchase: boolean;
}

export interface RazorpayPlanItem {
  id: string;
  active: boolean;
  name: string;
  description?: string;
  amount: number | string; // Razorpay might return string or number
  unit_amount: number | string;
  currency: string;
  type: string;
  unit?: string;
  tax_inclusive: boolean;
  hsn_code?: string;
  sac_code?: string;
  tax_rate?: number;
  tax_id?: string;
  tax_group_id?: string;
  created_at: number;
  updated_at: number;
}

export interface RazorpayPlan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: RazorpayPlanItem;
  notes: Record<string, unknown>;
  created_at: number;
}

export interface CreateSubscriptionPlanData {
  name: string;
  description?: string;
  price: string;
  billingCycle: string;
  features?: string[];
  isActive?: boolean;
  razorpaySubscriptionId?: string;
  razorpaySubscriptionPlanId?: string;
  razorpaySubscriptionLink?: string;
}

export interface SyncResult {
  synced: number;
  updated: number;
  created: number;
  errors: string[];
}
