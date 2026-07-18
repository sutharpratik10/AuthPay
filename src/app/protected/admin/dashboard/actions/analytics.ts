'use server';

import { db } from "@/server/db";
import { billings, users, userSubscriptions } from "@/server/db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";

export async function getOverviewStats() {
  try {
    const now = new Date();
    const startOfCurrentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthDateDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const startOfCurrentMonth = startOfCurrentMonthDate.toISOString();
    const startOfLastMonth = startOfLastMonthDate.toISOString();

    // 1. Revenue
    const totalRevResult = await db.select({ value: sql<number>`sum(cast(${billings.amount} as numeric))` })
      .from(billings).where(eq(billings.status, 'paid'));
    const currentRevResult = await db.select({ value: sql<number>`sum(cast(${billings.amount} as numeric))` })
      .from(billings).where(and(eq(billings.status, 'paid'), gte(billings.createdAt, startOfCurrentMonthDate)));
    const lastRevResult = await db.select({ value: sql<number>`sum(cast(${billings.amount} as numeric))` })
      .from(billings).where(and(eq(billings.status, 'paid'), gte(billings.createdAt, startOfLastMonthDate), lt(billings.createdAt, startOfCurrentMonthDate)));

    const totalRevenue = Number(totalRevResult[0]?.value) || 0;
    const currentRev = Number(currentRevResult[0]?.value) || 0;
    const lastRev = Number(lastRevResult[0]?.value) || 0;
    const revenueChange = lastRev === 0 ? 100 : ((currentRev - lastRev) / lastRev) * 100;

    // 2. Active Users (using total users as proxy for now)
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const currentUsersResult = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(gte(users.createdAt, startOfCurrentMonth));
    const lastUsersResult = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(and(gte(users.createdAt, startOfLastMonth), lt(users.createdAt, startOfCurrentMonth)));

    const totalUsers = Number(totalUsersResult[0]?.count) || 0;
    const currentUsers = Number(currentUsersResult[0]?.count) || 0;
    const lastUsers = Number(lastUsersResult[0]?.count) || 0;
    const userChange = lastUsers === 0 ? 100 : ((currentUsers - lastUsers) / lastUsers) * 100;

    // 3. MoM Growth (revenue based)
    const momGrowth = revenueChange;
    const prevRevResult = await db.select({ value: sql<number>`sum(cast(${billings.amount} as numeric))` })
      .from(billings).where(and(eq(billings.status, 'paid'), gte(billings.createdAt, prevMonthDateDate), lt(billings.createdAt, startOfLastMonthDate)));
    const prevRev = Number(prevRevResult[0]?.value) || 0;
    const lastRevChange = prevRev === 0 ? 100 : ((lastRev - prevRev) / prevRev) * 100;
    const momGrowthChange = momGrowth - lastRevChange;

    // 4. Churn Rate (simplified)
    const activeSubsResult = await db.select({ count: sql<number>`count(*)` })
      .from(userSubscriptions); // Simplified active count
    const activeSubs = Number(activeSubsResult[0]?.count) || 1;
    const churnCurrentResult = await db.select({ count: sql<number>`count(*)` })
      .from(userSubscriptions).where(gte(userSubscriptions.updatedAt, startOfCurrentMonth)); // Simplified churn count
    const churnRate = (Number(churnCurrentResult[0]?.count) || 0) / activeSubs * 100;

    return {
      totalRevenue,
      revenueChange,
      momGrowth,
      momGrowthChange,
      activeUsers: totalUsers,
      activeUsersChange: userChange,
      churnRate: churnRate,
      churnRateChange: 0, // simplified
    };
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return {
      totalRevenue: 0, revenueChange: 0, momGrowth: 0, momGrowthChange: 0,
      activeUsers: 0, activeUsersChange: 0, churnRate: 0, churnRateChange: 0
    };
  }
}
