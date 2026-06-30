import { db } from "@/server/db";
import { refundRequests, paymentOrders, paymentTransactions, userSubscriptions, auditLogs, users, subscriptionPlans, platformSettings, subscriptionStatuses } from "@/server/db/schema";
import { eq, and, desc, sql, SQL } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments/gateway";
import { emailService } from "./email";
import { getAppName } from "@/lib/utils/config";

export class RefundService {
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

    // We assume the frontend passed the correct calculated amount or we default to the full amount.
    // In a real pro-rata system, backend should recalculate to ensure safety.
    const amountToRefund = input.expectedRefundAmountMinor ?? order.amountMinor;

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
    const providerSubscriptionId = order.razorpaySubscriptionId || order.providerOrderId;
    let subscription;

    if (providerSubscriptionId) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.providerSubscriptionId, providerSubscriptionId)
        )
      });
    } else if (order.planId) {
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
      .where(eq(refundRequests.id, refundId))
      .returning();

    // Process the refund with the gateway
    const finalRequest = await this.processRefund(updated[0]);

    return { success: finalRequest.status !== 'failed', refundRequest: finalRequest };
  }

  /**
   * Actually call the gateway API
   */
  async processRefund(request: any) {
    try {
      let paymentId = request.gatewayPaymentId;

      // For Razorpay: if gatewayPaymentId is a subscription ID (sub_XXX),
      // resolve it to the actual payment transaction ID (pay_XXX)
      if (request.gateway === 'razorpay' && paymentId && paymentId.startsWith('sub_')) {
        const order = await db.query.paymentOrders.findFirst({
          where: eq(paymentOrders.id, request.paymentOrderId)
        });
        if (order?.providerTransactionId) {
          paymentId = order.providerTransactionId;
        }
      }

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
        }
      } else if (nextStatus === 'failed') {
        // Refund failed at the gateway — restore the user's subscription access
        await this.restoreSubscriptionAccess(request.userId, request.paymentOrderId);
      }
      return updated;
    } catch (error: any) {
      const failureReason = error.error?.description || error.message || 'Gateway error';
      const [updated] = await db.update(refundRequests)
        .set({
          status: 'failed',
          failureReason,
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
    const [updated] = await db.update(refundRequests)
      .set({
        status: 'rejected',
        approvedBy: adminId,
        failureReason: reason
      })
      .where(eq(refundRequests.id, refundId))
      .returning();

    // Restore the user's subscription access since refund was denied
    await this.restoreSubscriptionAccess(updated.userId, updated.paymentOrderId).catch(e =>
      console.error('[RefundService] Failed to restore subscription after rejection:', e)
    );

    const user = await db.query.users.findFirst({ where: eq(users.id, updated.userId) });
    const plan = updated.planId ? await db.query.subscriptionPlans.findFirst({ where: eq(subscriptionPlans.id, updated.planId) }) : null;
    if (user && user.email) {
      emailService.sendRefundRejectedEmail(user.email, plan?.name || 'Plan', reason).catch(e => console.error("[RefundService] Failed to send rejected email:", e));
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

    // Find the on-hold subscription
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

    // Try to find subscription by provider ID first, then by planId
    let subscription;
    if (providerSubId) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.providerSubscriptionId, providerSubId),
          eq(userSubscriptions.statusId, holdStatus.id)
        )
      });
    }
    if (!subscription && order?.planId) {
      subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, order.planId),
          eq(userSubscriptions.statusId, holdStatus.id)
        )
      });
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
    const all = await db.select().from(refundRequests);

    let totalRefunded = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;
    let failedCount = 0;

    for (const r of all) {
      if (r.status === 'pending') pendingCount++;
      if (r.status === 'approved') approvedCount++;
      if (r.status === 'completed') {
        completedCount++;
        totalRefunded += r.amountMinor;
      }
      if (r.status === 'rejected') rejectedCount++;
      if (r.status === 'failed') failedCount++;
    }

    return {
      totalRefunded,
      pendingCount,
      approvedCount,
      completedCount,
      rejectedCount,
      failedCount,
      monthlyBreakdown: [] // Can be implemented with grouping later
    };
  }
}

export const refundService = new RefundService();
