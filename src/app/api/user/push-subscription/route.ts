import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { webPushSubscriptions } from '@/server/db/schema/logs';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Check if the subscription already exists
    const existing = await db
      .select()
      .from(webPushSubscriptions)
      .where(and(
        eq(webPushSubscriptions.userId, session.user.id),
        eq(webPushSubscriptions.endpoint, subscription.endpoint)
      ));

    if (existing.length === 0) {
      // Create new subscription
      await db.insert(webPushSubscriptions).values({
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await db.delete(webPushSubscriptions)
      .where(and(
        eq(webPushSubscriptions.userId, session.user.id),
        eq(webPushSubscriptions.endpoint, endpoint)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete push subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
