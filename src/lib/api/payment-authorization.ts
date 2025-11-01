/**
 * Payment API Authorization Helpers
 * 
 * Provides authorization checks for payment-related APIs:
 * - Admins can access all user data
 * - Regular users can only access their own data
 */

import { db } from '@/server/db';
import { userSubscriptions, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { RBACService } from '@/lib/rbac/rbac-service';

export interface UserSubscriptionData {
  razorpaySubscriptionId: string;
  razorpayCustomerId: string | null;
  email: string;
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return await RBACService.isAdmin(userId);
}

/**
 * Get all Razorpay subscription IDs for a specific user
 */
export async function getUserRazorpaySubscriptions(userId: string): Promise<UserSubscriptionData[]> {
  const subscriptions = await db
    .select({
      razorpaySubscriptionId: userSubscriptions.razorpaySubscriptionId,
      razorpayCustomerId: userSubscriptions.razorpayCustomerId,
      userId: userSubscriptions.userId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true }
  });

  return subscriptions
    .filter(s => s.razorpaySubscriptionId)
    .map(s => ({
      razorpaySubscriptionId: s.razorpaySubscriptionId!,
      razorpayCustomerId: s.razorpayCustomerId,
      email: user?.email || ''
    }));
}

/**
 * Check if a user owns a specific Razorpay subscription
 */
export async function userOwnsSubscription(
  userId: string,
  razorpaySubscriptionId: string
): Promise<boolean> {
  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId),
    columns: { userId: true }
  });

  return subscription?.userId === userId;
}

/**
 * Filter Razorpay subscriptions to only show user's own data
 * Admins can see all subscriptions, regular users only see their own
 */
export async function filterSubscriptionsForUser(
  userId: string,
  allSubscriptions: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const isAdminUser = await isAdmin(userId);
  
  if (isAdminUser) {
    // Admin sees all subscriptions
    return allSubscriptions;
  }

  // Get user's Razorpay subscription IDs
  const userSubs = await getUserRazorpaySubscriptions(userId);
  const userSubIds = new Set(userSubs.map(s => s.razorpaySubscriptionId));

  // Filter to only user's subscriptions
  return allSubscriptions.filter(sub => userSubIds.has(sub.id as string));
}

/**
 * Filter Razorpay payments to only show user's own data
 * Admins can see all payments, regular users only see their own
 */
export async function filterPaymentsForUser(
  userId: string,
  allPayments: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const isAdminUser = await isAdmin(userId);
  
  if (isAdminUser) {
    // Admin sees all payments
    return allPayments;
  }

  // Get user's email and customer IDs
  const userSubs = await getUserRazorpaySubscriptions(userId);
  const userEmails = new Set([...userSubs.map(s => s.email)]);
  const userCustomerIds = new Set(
    userSubs.map(s => s.razorpayCustomerId).filter(Boolean) as string[]
  );

  // Filter to only user's payments (matched by email or customer_id)
  return allPayments.filter(payment => {
    // Check if payment email matches user email
    if (payment.email && userEmails.has(payment.email as string)) {
      return true;
    }
    // Check if payment customer_id matches user's customer_id
    if (payment.customer_id && userCustomerIds.has(payment.customer_id as string)) {
      return true;
    }
    return false;
  });
}

/**
 * Filter Razorpay invoices to only show user's own data
 * Admins can see all invoices, regular users only see their own
 */
export async function filterInvoicesForUser(
  userId: string,
  allInvoices: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const isAdminUser = await isAdmin(userId);
  
  if (isAdminUser) {
    // Admin sees all invoices
    return allInvoices;
  }

  // Get user's subscription IDs and customer IDs
  const userSubs = await getUserRazorpaySubscriptions(userId);
  const userSubIds = new Set(userSubs.map(s => s.razorpaySubscriptionId));
  const userCustomerIds = new Set(
    userSubs.map(s => s.razorpayCustomerId).filter(Boolean) as string[]
  );

  // Filter to only user's invoices
  return allInvoices.filter(invoice => {
    // Check if invoice subscription_id matches user's subscription
    if (invoice.subscription_id && userSubIds.has(invoice.subscription_id as string)) {
      return true;
    }
    // Check if invoice customer_id matches user's customer_id
    if (invoice.customer_id && userCustomerIds.has(invoice.customer_id as string)) {
      return true;
    }
    return false;
  });
}

/**
 * Check if a user can access a specific subscription
 * Returns { canAccess: boolean, isAdmin: boolean }
 */
export async function canAccessSubscription(
  userId: string,
  razorpaySubscriptionId: string
): Promise<{ canAccess: boolean; isAdmin: boolean }> {
  const isAdminUser = await isAdmin(userId);
  
  if (isAdminUser) {
    return { canAccess: true, isAdmin: true };
  }

  const owns = await userOwnsSubscription(userId, razorpaySubscriptionId);
  return { canAccess: owns, isAdmin: false };
}
