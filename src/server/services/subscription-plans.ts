import { db } from '@/server/db';
import { subscriptionPlans } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';

export interface RazorpayPlan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    active: boolean;
    name: string;
    description?: string;
    amount: number;
    unit_amount: number;
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
  };
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
  badgeText?: string;
  enableAutoPopular?: boolean;
}


export class SubscriptionPlanService {
  private razorpay: Razorpay | null;

  constructor() {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.warn('Missing Razorpay credentials - using placeholder for build');
      this.razorpay = null;
      return;
    }

    this.razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
  }

  /**
   * Fetch all subscription plans from Razorpay
   */
  async fetchRazorpayPlans(options?: { count?: number; skip?: number }): Promise<RazorpayPlan[]> {
    if (!this.razorpay) {
      throw new Error('Razorpay client not initialized - missing credentials');
    }
    try {
      const response = await this.razorpay.plans.all(options || {});
      // Cast to our interface - Razorpay types may vary
      return (response.items || []) as unknown as RazorpayPlan[];
    } catch (error) {
      console.error('Error fetching Razorpay plans:', error);
      throw new Error('Failed to fetch plans from Razorpay');
    }
  }

  /**
   * Sync Razorpay plans with local database (upsert logic)
   */
  async syncRazorpayPlans(): Promise<{ synced: number; updated: number; created: number; errors: string[] }> {
    const results = {
      synced: 0,
      updated: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // Fetch all plans from Razorpay
      const razorpayPlans = await this.fetchRazorpayPlans({ count: 100 });

      for (const rzPlan of razorpayPlans) {
        try {
          // Check if plan already exists by razorpaySubscriptionPlanId
          const existingPlan = await db.query.subscriptionPlans.findFirst({
            where: eq(subscriptionPlans.razorpaySubscriptionPlanId, rzPlan.id)
          });

          const planData: CreateSubscriptionPlanData = {
            name: rzPlan.item.name,
            description: rzPlan.item.description || `${rzPlan.item.name} - ${rzPlan.period}ly subscription`,
            price: this.formatPrice(rzPlan.item.amount, rzPlan.item.currency),
            billingCycle: rzPlan.period.toLowerCase(),
            features: rzPlan.notes ? [JSON.stringify(rzPlan.notes)] : [],
            isActive: rzPlan.item.active,
            razorpaySubscriptionPlanId: rzPlan.id,
            razorpaySubscriptionId: rzPlan.id, // Use plan ID as subscription ID if not provided
            razorpaySubscriptionLink: `https://dashboard.razorpay.com/plans/${rzPlan.id}`
          };

          if (existingPlan) {
            // Update existing plan
            await db
              .update(subscriptionPlans)
              .set({
                name: planData.name,
                description: planData.description,
                price: planData.price,
                billingCycle: planData.billingCycle,
                features: planData.features ? JSON.stringify(planData.features) : null,
                isActive: planData.isActive,
                razorpaySubscriptionId: planData.razorpaySubscriptionId,
                razorpaySubscriptionLink: planData.razorpaySubscriptionLink,
                updatedAt: new Date()
              })
              .where(eq(subscriptionPlans.id, existingPlan.id));

            results.updated++;
          } else {
            // Create new plan
            await db.insert(subscriptionPlans).values({
              name: planData.name,
              description: planData.description,
              price: planData.price,
              billingCycle: planData.billingCycle,
              features: planData.features ? JSON.stringify(planData.features) : null,
              isActive: planData.isActive ?? true,
              razorpaySubscriptionId: planData.razorpaySubscriptionId,
              razorpaySubscriptionPlanId: planData.razorpaySubscriptionPlanId,
              razorpaySubscriptionLink: planData.razorpaySubscriptionLink
            });

            results.created++;
          }

          results.synced++;
        } catch (error) {
          const errorMsg = `Failed to sync plan ${rzPlan.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to fetch Razorpay plans: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
  }

  /**
   * Get all active subscription plans for user display
   */
  async getActiveSubscriptionPlans() {
    try {
      const plans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlans.isActive, true),
        columns: {
          id: true,
          name: true,
          description: true,
          price: true,
          billingCycle: true,
          features: true,
          razorpaySubscriptionPlanId: true,
          razorpaySubscriptionLink: true,
          createdAt: true
        },
        orderBy: (plans, { asc }) => [asc(plans.name)]
      });

      // Format plans for frontend consumption
      return plans.map(plan => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        priceNumber: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
        formattedPrice: this.formatDisplayPrice(plan.price),
        canPurchase: !!plan.razorpaySubscriptionPlanId
      }));
    } catch (error) {
      console.error('Error fetching active subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlanById(planId: string) {
    try {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return {
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        priceNumber: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
        formattedPrice: this.formatDisplayPrice(plan.price)
      };
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan by Razorpay plan ID
   */
  async getSubscriptionPlanByRazorpayId(razorpayPlanId: string) {
    try {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.razorpaySubscriptionPlanId, razorpayPlanId)
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return {
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        priceNumber: parseFloat(plan.price.replace(/[^0-9.]/g, '')),
        formattedPrice: this.formatDisplayPrice(plan.price)
      };
    } catch (error) {
      console.error('Error fetching subscription plan by Razorpay ID:', error);
      throw error;
    }
  }

  /**
   * Create or update subscription plan manually
   */
  async upsertSubscriptionPlan(planData: CreateSubscriptionPlanData & { id?: string }) {
    try {
      const dataToUpsert = {
        name: planData.name,
        description: planData.description,
        price: planData.price,
        billingCycle: planData.billingCycle,
        features: planData.features ? JSON.stringify(planData.features) : null,
        isActive: planData.isActive ?? true,
        razorpaySubscriptionId: planData.razorpaySubscriptionId,
        razorpaySubscriptionPlanId: planData.razorpaySubscriptionPlanId,
        razorpaySubscriptionLink: planData.razorpaySubscriptionLink,
        badgeText: planData.badgeText,
        enableAutoPopular: planData.enableAutoPopular,
        updatedAt: new Date()
      };

      if (planData.id) {
        // Update existing plan
        const updated = await db
          .update(subscriptionPlans)
          .set(dataToUpsert)
          .where(eq(subscriptionPlans.id, planData.id))
          .returning();

        return updated[0];
      } else if (planData.razorpaySubscriptionPlanId) {
        // Check if plan exists by Razorpay ID
        const existing = await db.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.razorpaySubscriptionPlanId, planData.razorpaySubscriptionPlanId)
        });

        if (existing) {
          // Update existing
          const updated = await db
            .update(subscriptionPlans)
            .set(dataToUpsert)
            .where(eq(subscriptionPlans.id, existing.id))
            .returning();

          return updated[0];
        }
      }

      // Create new plan
      const created = await db
        .insert(subscriptionPlans)
        .values(dataToUpsert)
        .returning();

      return created[0];
    } catch (error) {
      console.error('Error upserting subscription plan:', error);
      throw error;
    }
  }

  /**
   * Helper method to format price from Razorpay (paisa to rupees)
   */
  private formatPrice(amount: number | string, currency: string): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const value = currency.toLowerCase() === 'inr' ? numericAmount / 100 : numericAmount;
    return `${currency.toUpperCase()} ${value.toFixed(2)}`;
  }

  /**
   * Helper method to format price for display
   */
  private formatDisplayPrice(price: string): string {
    const match = price.match(/(\w+)\s+([\d.]+)/);
    if (!match) return price;

    const [, currency, amount] = match;
    const value = parseFloat(amount);

    if (currency.toUpperCase() === 'INR') {
      return `₹${value.toLocaleString('en-IN')}`;
    }

    return `${currency} ${value.toFixed(2)}`;
  }
}

// Export singleton instance
export const subscriptionPlanService = new SubscriptionPlanService();
