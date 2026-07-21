import { db } from "@/server/db";
import { refundRequests, paymentOrders, paymentTransactions, userSubscriptions, auditLogs, users, subscriptionPlans, platformSettings, subscriptionStatuses } from "@/server/db/schema";
import { eq, and, desc, sql, SQL } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments/gateway";
import { emailService } from "./email";
import { getAppName } from "@/lib/utils/config";
import { NotificationService } from "./notification";
import Razorpay from "razorpay";

export class RefundService {
  /**
   * Resolve the actual payment amount for a payment order.
   * For Razorpay subscription setup orders, amountMinor is 0 — we fetch
   * the real plan cost from Razorpay's API (mirrors the estimate endpoint logic).
   */
  private async resolveActualAmountMinor(order: {
    amountMinor: number;
    provider: string;
    razorpaySubscriptionId?: string | null;
    providerOrderId?: string | null;
  }): Promise<number> {
    let amount = order.amountMinor;

    if (amount === 0 && order.provider === 'razorpay') {
      const subId = order.razorpaySubscriptionId || order.providerOrderId;
      if (subId) {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });
          const sub = await razorpay.subscriptions.fetch(subId);
          if (sub && (sub as any).plan_id) {
            const plan = await razorpay.plans.fetch((sub as any).plan_id);
            if (plan && (plan.item as any)?.amount) {
              amount = Number((plan.item as any).amount);
            } else if (plan && (plan as any).amount) {
              amount = Number((plan as any).amount);
            }
          }
        } catch (err) {
          console.error('[RefundService] Failed to fetch Razorpay plan amount:', err);
        }
      }
    }

    return amount;
  }

  /**
   * User initiates a refund request from their dashboard
   */
  async createUserRefundRequest(userId: string, input: {
    paymentOrderId: string;
    reason: string;
    expectedRefundAmountMinor?: number;
  }) {
    // Validate payment order
    const order = await db.query.paymentOrders.findFirst({
      where: and(
        eq(paymentOrders.id, input.paymentOrderId),
        eq(paymentOrders.userId, userId)
      ),
      with: { plan: true }
    });

    if (!order) throw new Error("Payment order not found");
    if (order.status !== 'success') throw new Error("Only successful payments can be refunded");

    // Check if a refund request already exists
    const existing = await db.query.refundRequests.findFirst({
      where: and(
        eq(refundRequests.paymentOrderId, input.paymentOrderId),
        eq(refundRequests.status, 'pending')
      )
    });

    if (existing) throw new Error("A refund request is already pending for this payment");

    // Resolve the actual payment amount (handles Razorpay setup orders with 0 amount)
    const actualAmountMinor = await this.resolveActualAmountMinor(order);
    const amountToRefund = input.expectedRefundAmountMinor ?? actualAmountMinor;
    if (amountToRefund > actualAmountMinor) {
      throw new Error("Refund amount cannot exceed the original payment amount.");
    }

    // Check platform settings for automation
    const settings = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.id, "singleton")
    });
    const isAutoProcess = settings?.autoProcessRefunds === true;

    const [request] = await db.insert(refundRequests).values({
      paymentOrderId: order.id,
      userId: userId,
      planId: order.planId,
      amountMinor: amountToRefund,
      currency: order.currency,
      reason: input.reason,
      status: isAutoProcess ? 'approved' : 'pending',
      gateway: order.provider,
      gatewayPaymentId: order.providerTransactionId || order.providerOrderId || '',
      revokeSubscription: true,
      approvedAt: isAutoProcess ? new Date() : undefined,
    }).returning();

    // Pause subscription if active
    let subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.paymentOrderId, order.id)
    });

    if (!subscription && order.planId) {
      // Fallback for older data or non-subscription orders that might map by plan
      subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, order.planId)
        )
      });
    }

    if (subscription) {
      const holdStatus = await db.query.subscriptionStatuses.findFirst({
        where: eq(subscriptionStatuses.name, 'on-hold')
      });
      if (holdStatus) {
        await db.update(userSubscriptions)
          .set({ statusId: holdStatus.id })
          .where(eq(userSubscriptions.id, subscription.id));
      }
    }

    // Send email to User
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (user && user.email) {
      const formattedAmount = `${order.currency} ${(amountToRefund / 100).toFixed(2)}`;
      emailService.sendRefundRequestedEmail(user.email, formattedAmount, order.plan?.name || 'Subscription', input.reason).catch(e => console.error("[RefundService] Failed to send requested email:", e));
      NotificationService.createUserNotification(userId, "Refund Requested", `Your refund request for ${formattedAmount} has been received.`, "info").catch(e => console.error(e));
      NotificationService.createAdminNotification("New Refund Request", `User ${user.email} requested a refund of ${formattedAmount}.`, "info", "high").catch(e => console.error(e));
    }

    // Log audit
    await db.insert(auditLogs).values({
      userId: userId,
      action: 'refund_requested',
      entityType: 'payment_order',
      entityId: order.id,
      metadata: { amountMinor: amountToRefund, reason: input.reason, autoProcessed: isAutoProcess },
    });

    if (isAutoProcess) {
      await this.processRefund(request).catch(e => {
        console.error("[RefundService] Auto-process failed:", e);
      });
      // Fetch the updated request after processing
      const updatedReq = await db.query.refundRequests.findFirst({
        where: eq(refundRequests.id, request.id)
      });
      return updatedReq || request;
    }

    return request;
  }

  /**
   * Admin creates a refund directly
   */
  async createRefundRequest(adminId: string, input: {
    paymentOrderId: string;
    amountMinor: number;
    reason: string;
    revokeSubscription: boolean;
  }) {
    const order = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.id, input.paymentOrderId),
      with: { plan: true }
    });

    if (!order) throw new Error("Payment order not found");

    const [request] = await db.insert(refundRequests).values({
      paymentOrderId: order.id,
      userId: order.userId!,
      planId: order.planId,
      amountMinor: input.amountMinor,
      currency: order.currency,
      reason: input.reason,
      status: 'pending',
      gateway: order.provider,
      gatewayPaymentId: order.providerOrderId || order.providerTransactionId || '',
      revokeSubscription: input.revokeSubscription,
      approvedBy: adminId, // Automatically attribute if admin creates
    }).returning();

    return request;
  }

  /**
   * Admin approves and triggers gateway refund
   */
  async approveRefund(adminId: string, refundId: string, revokeSubscription: boolean = true) {
    const request = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.id, refundId)
    });

    if (!request) throw new Error("Refund request not found");
    if (request.status !== 'pending') throw new Error("Refund request is not pending");

    const updated = await db.update(refundRequests)
      .set({
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        revokeSubscription
      })
      .where(and(eq(refundRequests.id, refundId), eq(refundRequests.status, 'pending')))
      .returning();

    if (updated.length === 0) {
      throw new Error("Refund request is no longer pending or already processed.");
    }

    // Process the refund with the gateway
    const finalRequest = await this.processRefund(updated[0]);

    return { success: finalRequest.status !== 'failed', refundRequest: finalRequest };
  }

  /**
   * Resolve the actual Razorpay payment ID (pay_XXX) needed for refunds.
   * The gatewayPaymentId stored on a refund request might be a sub_XXX,
   * order_XXX, or empty string — none of which work for Razorpay's
   * POST /v1/payments/:id/refund endpoint.
   */
  private async resolveRazorpayPaymentId(request: any): Promise<string> {
    let paymentId = request.gatewayPaymentId;

    // If it already looks like a Razorpay payment ID, use it directly
    if (paymentId && paymentId.startsWith('pay_')) {
      return paymentId;
    }

    // Step 1: Try to get providerTransactionId from the linked payment order
    const order = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.id, request.paymentOrderId)
    });

    if (order?.providerTransactionId && order.providerTransactionId.startsWith('pay_')) {
      return order.providerTransactionId;
    }

    // Step 2: Try checking via the subscription FK mapping
    const sub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.paymentOrderId, request.paymentOrderId)
    });
    
    if (sub && sub.providerSubscriptionId && sub.providerSubscriptionId.startsWith('sub_')) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        // Fetch the subscription to find the latest payment
        const rpSub = await razorpay.subscriptions.fetch(sub.providerSubscriptionId) as any;
        // payment_id on the subscription is the most recent captured payment
        if (rpSub?.payment_id) {
          return rpSub.payment_id;
        }
      } catch (err) {
        console.error('[RefundService] Failed to resolve payment ID from Razorpay subscription:', err);
      }
    }

    // Fallback: return whatever we have (will likely cause a descriptive Razorpay error)
    console.warn(`[RefundService] Could not resolve a pay_XXX ID for refund ${request.id}. Using: "${paymentId}"`);
    return paymentId || '';
  }

  /**
   * Actually call the gateway API
   */
  async processRefund(request: any) {
    try {
      let paymentId = request.gatewayPaymentId;

      // For Razorpay: resolve the actual payment ID (pay_XXX) and validate payment state
      if (request.gateway === 'razorpay') {
        paymentId = await this.resolveRazorpayPaymentId(request);
        
        try {
          const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
          const rpPayment = await razorpay.payments.fetch(paymentId);
          
          if (rpPayment.status !== 'captured') {
            throw new Error(`Payment ${paymentId} cannot be refunded because its status is '${rpPayment.status}' (expected 'captured')`);
          }
          if (request.amountMinor > Number(rpPayment.amount)) {
            throw new Error(`Refund amount (${request.amountMinor}) exceeds captured payment amount (${rpPayment.amount})`);
          }
        } catch (validationErr: any) {
          console.warn(`[RefundService] Pre-refund validation failed for ${paymentId}:`, validationErr.message);
          if (validationErr.message.includes('Payment') || validationErr.message.includes('Refund amount')) {
            throw validationErr;
          }
        }
      }

      console.log(`[RefundService] Processing refund ${request.id} via ${request.gateway} | paymentId: ${paymentId} | amount: ${request.amountMinor} ${request.currency}`);

      const provider = getPaymentProvider(request.gateway);
      const result = await provider.createRefund({
        providerPaymentId: paymentId,
        amountMinor: request.amountMinor,
        currency: request.currency,
        reason: 'requested_by_customer',
      });

      let nextStatus = 'processing';
      if (result.status === 'succeeded' || result.status === 'processed') {
        nextStatus = 'completed';
      } else if (result.status === 'failed' || result.status === 'canceled') {
        nextStatus = 'failed';
      }

      console.log(`[RefundService] Refund ${request.id} gateway response: status=${result.status}, refundId=${result.providerRefundId}, nextStatus=${nextStatus}`);

      const [updated] = await db.update(refundRequests)
        .set({
          status: nextStatus as any,
          gatewayRefundId: result.providerRefundId,
          gatewayResponse: result.gatewayResponse as any,
          processedAt: new Date(),
          completedAt: nextStatus === 'completed' ? new Date() : undefined,
          failureReason: nextStatus === 'failed' ? (result.gatewayResponse as any)?.failure_reason || 'Gateway reported failure' : undefined,
        })
        .where(eq(refundRequests.id, request.id))
        .returning();

      if (nextStatus === 'completed') {
        if (request.revokeSubscription) {
          await this.cancelSubscriptionOnRefund(request.paymentOrderId);
        }
        const user = await db.query.users.findFirst({ where: eq(users.id, request.userId) });
        if (user && user.email) {
          const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, request.planId) });
          const formattedAmount = `${request.currency} ${(request.amountMinor / 100).toFixed(2)}`;
          emailService.sendRefundCompletedEmail(user.email, formattedAmount, plan?.name || 'Plan', result.providerRefundId).catch(e => console.error("[RefundService] Failed to send completed email:", e));
          NotificationService.createUserNotification(request.userId, "Refund Completed", `Your refund of ${formattedAmount} has been completed successfully.`, "success").catch(e => console.error(e));
        }
      } else if (nextStatus === 'failed') {
        // Refund failed at the gateway — restore the user's subscription access
        await this.restoreSubscriptionAccess(request.userId, request.paymentOrderId);
      }
      return updated;
    } catch (error: any) {
      const failureReason = error.error?.description || error.message || 'Gateway error';
      console.error(`[RefundService] Refund ${request.id} FAILED:`, failureReason, error.error || error);

      const [updated] = await db.update(refundRequests)
        .set({
          status: 'failed',
          failureReason,
          gatewayResponse: (error.error || { message: error.message }) as any,
        })
        .where(eq(refundRequests.id, request.id))
        .returning();

      // Refund failed — restore the user's subscription access
      await this.restoreSubscriptionAccess(request.userId, request.paymentOrderId).catch(e =>
        console.error('[RefundService] Failed to restore subscription after refund failure:', e)
      );

      return updated;
    }
  }

  /**
   * Admin rejects
   */
  async rejectRefund(adminId: string, refundId: string, reason: string) {
    const updatedRes = await db.update(refundRequests)
      .set({
        status: 'rejected',
        approvedBy: adminId,
        failureReason: reason
      })
      .where(and(eq(refundRequests.id, refundId), eq(refundRequests.status, 'pending')))
      .returning();

    if (updatedRes.length === 0) {
      throw new Error("Only pending refund requests can be rejected.");
    }
    const updated = updatedRes[0];

    // Restore the user's subscription access since refund was denied
    await this.restoreSubscriptionAccess(updated.userId, updated.paymentOrderId).catch(e =>
      console.error('[RefundService] Failed to restore subscription after rejection:', e)
    );

    const user = await db.query.users.findFirst({ where: eq(users.id, updated.userId) });
    const plan = updated.planId ? await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, updated.planId) }) : null;
    if (user && user.email) {
      emailService.sendRefundRejectedEmail(user.email, plan?.name || 'Plan', reason).catch(e => console.error("[RefundService] Failed to send rejected email:", e));
      NotificationService.createUserNotification(updated.userId, "Refund Rejected", `Your refund request was rejected: ${reason}`, "error").catch(e => console.error(e));
    }

    return updated;
  }

  /**
   * Handle webhook update
   */
  async handleWebhookUpdate(gatewayRefundId: string, status: string, gatewayResponse: any = null) {
    const request = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.gatewayRefundId, gatewayRefundId)
    });
    if (!request) return;

    if (status === 'processed' || status === 'succeeded') {
      await db.update(refundRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          gatewayResponse: gatewayResponse || request.gatewayResponse
        })
        .where(eq(refundRequests.id, request.id));

      if (request.revokeSubscription) {
        await this.cancelSubscriptionOnRefund(request.paymentOrderId);
      }

      const user = await db.query.users.findFirst({ where: eq(users.id, request.userId) });
      const plan = await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, request.planId!) });
      if (user && user.email) {
        const formattedAmount = `${request.currency} ${(request.amountMinor / 100).toFixed(2)}`;
        emailService.sendRefundCompletedEmail(user.email, formattedAmount, plan?.name || 'Plan', gatewayRefundId).catch(e => console.error("[RefundService] Failed to send completed email:", e));
        NotificationService.createUserNotification(request.userId, "Refund Completed", `Your refund of ${formattedAmount} has been completed successfully.`, "success").catch(e => console.error(e));
      }
    } else if (status === 'failed') {
      await db.update(refundRequests)
        .set({
          status: 'failed',
          gatewayResponse: gatewayResponse || request.gatewayResponse
        })
        .where(eq(refundRequests.id, request.id));
    }
  }

  async cancelSubscriptionOnRefund(paymentOrderId: string) {
    const order = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.id, paymentOrderId)
    });
    if (!order || !order.planId || !order.userId) return;

    await db.update(userSubscriptions)
      .set({
        endDate: new Date().toISOString(), // mark as cancelled
        cancellationReason: 'refunded',
      })
      .where(and(
        eq(userSubscriptions.userId, order.userId),
        eq(userSubscriptions.planId, order.planId)
      ));
  }

  /**
   * Restore subscription access when a refund fails or is rejected.
   * Changes status from 'on-hold' back to 'active'.
   */
  async restoreSubscriptionAccess(userId: string, paymentOrderId: string) {
    const order = await db.query.paymentOrders.findFirst({
      where: eq(paymentOrders.id, paymentOrderId)
    });

    const providerSubId = order?.razorpaySubscriptionId || order?.providerOrderId;
    // Find the on-hold status
    const holdStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'on-hold')
    });
    const activeStatus = await db.query.subscriptionStatuses.findFirst({
      where: eq(subscriptionStatuses.name, 'active')
    });

    if (!holdStatus || !activeStatus) {
      console.error('[RefundService] Could not find on-hold or active status IDs');
      return;
    }

    let subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.paymentOrderId, paymentOrderId)
    });

    if (!subscription) {
      // Fallback 
      const order = await db.query.paymentOrders.findFirst({
        where: eq(paymentOrders.id, paymentOrderId)
      });
      if (order && order.planId) {
        subscription = await db.query.userSubscriptions.findFirst({
          where: and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.planId, order.planId),
            eq(userSubscriptions.statusId, holdStatus.id)
          )
        });
      }
    }

    if (subscription) {
      await db.update(userSubscriptions)
        .set({ statusId: activeStatus.id })
        .where(eq(userSubscriptions.id, subscription.id));
      console.log(`[RefundService] Restored subscription ${subscription.id} to active for user ${userId}`);
    } else {
      console.warn(`[RefundService] No on-hold subscription found to restore for user ${userId}`);
    }
  }

  async getRefundRequests(filters: {
    status?: string;
    gateway?: string;
    page: number;
    limit: number;
  }) {
    const conditions: any[] = [];
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(refundRequests.status, filters.status as any));
    }
    if (filters.gateway && filters.gateway !== 'all') {
      conditions.push(eq(refundRequests.gateway, filters.gateway as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (filters.page - 1) * filters.limit;

    const data = await db.query.refundRequests.findMany({
      where: whereClause as any,
      limit: filters.limit,
      offset: offset,
      orderBy: [desc(refundRequests.createdAt)],
      with: {
        user: true,
        plan: true,
        paymentOrder: true,
      }
    });

    const totalRes = await db.select({ count: sql<number>`count(*)` }).from(refundRequests).where(whereClause as any);
    return { requests: data, total: Number(totalRes[0].count) };
  }

  async getRefundStats() {
    const stats = await db.select({
      status: refundRequests.status,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${refundRequests.amountMinor})`
    })
      .from(refundRequests)
      .groupBy(refundRequests.status);

    const result = {
      totalRefunded: 0,
      pendingCount: 0,
      approvedCount: 0,
      completedCount: 0,
      rejectedCount: 0,
      failedCount: 0,
      monthlyBreakdown: [] // Can be implemented with grouping later
    };

    for (const row of stats) {
      if (row.status === 'pending') result.pendingCount = Number(row.count);
      if (row.status === 'approved') result.approvedCount = Number(row.count);
      if (row.status === 'completed') {
        result.completedCount = Number(row.count);
        result.totalRefunded = Number(row.totalAmount || 0);
      }
      if (row.status === 'rejected') result.rejectedCount = Number(row.count);
      if (row.status === 'failed') result.failedCount = Number(row.count);
    }

    return result;
  }
}

export const refundService = new RefundService();
