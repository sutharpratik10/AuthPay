import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { paymentOrders, tenants, tenantUsers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { phonePeService } from '@/lib/phonepe';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, subscriptionId } = await req.json();

    if (!action || !subscriptionId) {
      return NextResponse.json(
        { error: 'Action and subscription ID are required' },
        { status: 400 }
      );
    }

    if (!['cancel', 'pause', 'unpause'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: cancel, pause, or unpause' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify that the subscription belongs to the user
    const paymentOrder = await db.query.paymentOrders.findFirst({
      where: and(
        eq(paymentOrders.providerOrderId, subscriptionId),
        eq(paymentOrders.userId, userId)
      ),
      with: {
        plan: true
      }
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    let response;
    let statusMessage;

    try {      if (action === 'cancel') {
        const cancelRequest = await phonePeService.cancelSubscription(subscriptionId);
        
        response = await axios.post(cancelRequest.url, cancelRequest.payload, {
          headers: cancelRequest.headers
        });

        statusMessage = 'Subscription cancelled successfully';

        // Update tenant status
        await db.update(tenants)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(tenants.id, paymentOrder.tenantId));      } else if (action === 'pause' || action === 'unpause') {
        const pauseRequest = await phonePeService.pauseUnpauseSubscription(
          subscriptionId, 
          action.toUpperCase() as 'PAUSE' | 'UNPAUSE'
        );
        
        response = await axios.post(pauseRequest.url, pauseRequest.payload, {
          headers: pauseRequest.headers
        });

        statusMessage = `Subscription ${action}d successfully`;

        // Update tenant status for pause/unpause
        if (action === 'pause') {
          await db.update(tenants)
            .set({
              isActive: false,
              updatedAt: new Date()
            })
            .where(eq(tenants.id, paymentOrder.tenantId));
        } else {
          await db.update(tenants)
            .set({
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(tenants.id, paymentOrder.tenantId));
        }
      }      // Log the action in payment orders
      await db.update(paymentOrders)
        .set({
          status: action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'active',
          updatedAt: new Date()
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      return NextResponse.json({
        success: true,
        message: statusMessage,
        data: {
          action,
          subscriptionId,
          phonepeResponse: response?.data
        }
      });    } catch (phonepeError: unknown) {
      console.error(`Error ${action}ing subscription with PhonePe:`, phonepeError);
      
      // Return a user-friendly error even if PhonePe API fails
      const errorMessage = phonepeError instanceof Error ? phonepeError.message : 'Unknown error';
      return NextResponse.json({
        success: false,
        error: `Failed to ${action} subscription. Please try again or contact support.`,
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch subscription details
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;    // Get user's active subscription
    const tenantUser = await db.query.tenantUsers.findFirst({
      where: eq(tenantUsers.userId, userId),
      with: {
        tenant: {
          with: {
            subscriptionPlan: true
          }
        }
      }
    });

    if (!tenantUser?.tenant) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No active subscription found'
        }
      });
    }

    // Get the most recent payment order for this tenant
    const recentPaymentOrder = await db.query.paymentOrders.findFirst({
      where: and(
        eq(paymentOrders.tenantId, tenantUser.tenant.id),
        eq(paymentOrders.userId, userId)
      ),
      orderBy: (paymentOrders, { desc }) => [desc(paymentOrders.createdAt)],
      with: {
        plan: true
      }
    });    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          tenantId: tenantUser.tenant.id,
          tenantName: tenantUser.tenant.name,
          planName: tenantUser.tenant.subscriptionPlan?.name,
          planId: tenantUser.tenant.planId,
          isActive: tenantUser.tenant.isActive,
          planEffectiveDate: tenantUser.tenant.planEffectiveDate,
          planExpiryDate: tenantUser.tenant.planExpiryDate,
          subscriptionId: recentPaymentOrder?.providerOrderId,
          status: recentPaymentOrder?.status,
          billingCycle: tenantUser.tenant.subscriptionPlan?.billingCycle,
          price: tenantUser.tenant.subscriptionPlan?.price
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
