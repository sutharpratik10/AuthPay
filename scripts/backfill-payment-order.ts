import { db } from "../src/server/db";
import { userSubscriptions, paymentOrders } from "../src/server/db/schema";
import { eq, inArray, isNotNull, and, desc } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("Starting backfill for userSubscriptions.paymentOrderId...");
  
  // 1. Fetch all subscriptions that need a paymentOrderId (where it is currently null)
  // But wait, Drizzle doesn't support complex UPDATE FROM out of the box nicely, 
  // so we will do it in code.
  
  const subs = await db.query.userSubscriptions.findMany({
    where: and(
      isNotNull(userSubscriptions.providerSubscriptionId)
      // Note: testing if it's null would be isNull(userSubscriptions.paymentOrderId) but it's new so all are null
    )
  });
  
  console.log(`Found ${subs.length} subscriptions with providerSubscriptionId to check.`);
  
  let updatedCount = 0;
  
  for (const sub of subs) {
    if (sub.paymentOrderId) continue; // Already set
    if (!sub.providerSubscriptionId) continue;
    
    // Find the latest successful payment order for this subscription ID
    // Note: providerSubscriptionId maps to either razorpaySubscriptionId or providerOrderId in paymentOrders
    
    const orders = await db.query.paymentOrders.findMany({
      where: and(
        eq(paymentOrders.status, 'success'),
        // Could be either Razorpay or Stripe
        // In Razorpay, it's stored in razorpaySubscriptionId or providerOrderId
        // In Stripe, it's typically providerTransactionId or providerOrderId
        inArray(paymentOrders.providerOrderId, [sub.providerSubscriptionId, `rzsub-${sub.providerSubscriptionId}`]) // For Razorpay sub it's rzsub-... sometimes, or direct ID
      ),
      orderBy: [desc(paymentOrders.createdAt)]
    });
    
    // Let's also check razorpaySubscriptionId if the above is empty
    let latestOrder = orders[0];
    
    if (!latestOrder) {
      const rpOrders = await db.query.paymentOrders.findMany({
        where: and(
          eq(paymentOrders.status, 'success'),
          eq(paymentOrders.razorpaySubscriptionId, sub.providerSubscriptionId)
        ),
        orderBy: [desc(paymentOrders.createdAt)]
      });
      latestOrder = rpOrders[0];
    }
    
    if (!latestOrder) {
      // One more fallback for Stripe: providerTransactionId might have the sub_XXX
      const stOrders = await db.query.paymentOrders.findMany({
        where: and(
          eq(paymentOrders.status, 'success'),
          eq(paymentOrders.providerTransactionId, sub.providerSubscriptionId)
        ),
        orderBy: [desc(paymentOrders.createdAt)]
      });
      latestOrder = stOrders[0];
    }

    if (latestOrder) {
      console.log(`Updating sub ${sub.id} with payment order ${latestOrder.id} (${latestOrder.provider})`);
      await db.update(userSubscriptions)
        .set({ paymentOrderId: latestOrder.id })
        .where(eq(userSubscriptions.id, sub.id));
      updatedCount++;
    } else {
      console.log(`No payment order found for sub ${sub.id} (providerSubId: ${sub.providerSubscriptionId})`);
    }
  }
  
  console.log(`Backfill complete. Updated ${updatedCount} subscriptions.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
