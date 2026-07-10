import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { userSubscriptions, freeTrialSettings, subscriptionStatuses } from "@/server/db/schema";
import { auth } from "@/config/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if free trial is configured and active
    const [settings] = await db.select().from(freeTrialSettings).where(eq(freeTrialSettings.isActive, true)).limit(1);

    if (!settings) {
      return NextResponse.json({ error: "Free trial is not currently available" }, { status: 400 });
    }

    // Check if user has ANY existing subscriptions
    const existingSubscriptions = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));

    if (existingSubscriptions.length > 0) {
      return NextResponse.json({ error: "You are not eligible for a free trial as you have previously subscribed." }, { status: 400 });
    }

    // Find the 'free-trial' status
    const [status] = await db.select().from(subscriptionStatuses).where(eq(subscriptionStatuses.name, 'free-trial')).limit(1);

    if (!status) {
      console.error("Free trial status not found in database");
      return NextResponse.json({ error: "System configuration error" }, { status: 500 });
    }

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + settings.durationDays);

    // Create the free trial subscription
    const [newSubscription] = await db.insert(userSubscriptions).values({
      userId,
      planId: settings.planId,
      paymentOrderId: null,
      statusId: status.id,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      paymentGatewayProvider: "free-trial",
    }).returning();

    return NextResponse.json({ data: newSubscription, message: "Free trial activated successfully!" });
  } catch (error: any) {
    console.error("Error activating free trial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate free trial" },
      { status: error.status || 500 }
    );
  }
}
