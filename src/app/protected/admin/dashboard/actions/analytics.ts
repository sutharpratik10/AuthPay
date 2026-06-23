'use server';

import { db } from "@/server/db";
import { adminDashboardStats, subscriptionAnalytics, userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidateTag } from "next/cache";

export type DateRange = "7d" | "30d" | "90d" | "ytd" | { from: string; to: string };

export type WidgetLayout = {
  id: string;
  x: number; y: number; w: number; h: number;
  chartType: "revenue" | "user-growth" | "churn";
  dateRange: DateRange;
  isVisible: boolean;
};

const layoutSchema = z.array(
  z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    chartType: z.enum(["revenue", "user-growth", "churn"]),
    dateRange: z.union([
      z.enum(["7d", "30d", "90d", "ytd"]),
      z.object({ from: z.string(), to: z.string() })
    ]),
    isVisible: z.boolean(),
  })
);

export async function getRevenueData(dateRange: DateRange = "30d") {
  // Mock data for MVP implementation
  return [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
  ];
}

export async function getUserGrowthData(dateRange: DateRange = "30d") {
  // Mock data for MVP implementation
  return [
    { name: 'Jan', active: 4000, new: 2400 },
    { name: 'Feb', active: 3000, new: 1398 },
    { name: 'Mar', active: 2000, new: 9800 },
    { name: 'Apr', active: 2780, new: 3908 },
    { name: 'May', active: 1890, new: 4800 },
    { name: 'Jun', active: 2390, new: 3800 },
    { name: 'Jul', active: 3490, new: 4300 },
  ];
}

export async function getChurnRateData(dateRange: DateRange = "30d") {
  // Mock data for MVP implementation
  return [
    { name: 'Jan', rate: 2.1 },
    { name: 'Feb', rate: 1.8 },
    { name: 'Mar', rate: 3.0 },
    { name: 'Apr', rate: 2.4 },
    { name: 'May', rate: 1.5 },
    { name: 'Jun', rate: 2.8 },
    { name: 'Jul', rate: 1.2 },
  ];
}

export async function getDashboardLayout(userId: string): Promise<WidgetLayout[]> {
  if (!userId) return [];
  const pref = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId)
  });
  
  if (pref?.dashboardLayout) {
    const result = layoutSchema.safeParse(pref.dashboardLayout);
    if (result.success) {
      return result.data as WidgetLayout[];
    }
  }

  // Default layout
  return [
    { id: "revenue-chart", x: 0, y: 0, w: 6, h: 4, chartType: "revenue", dateRange: "30d", isVisible: true },
    { id: "user-growth-chart", x: 6, y: 0, w: 6, h: 4, chartType: "user-growth", dateRange: "30d", isVisible: true },
    { id: "churn-chart", x: 0, y: 4, w: 12, h: 4, chartType: "churn", dateRange: "30d", isVisible: true },
  ];
}

export async function saveDashboardLayout(userId: string, layout: WidgetLayout[]) {
  const result = layoutSchema.safeParse(layout);
  if (!result.success) {
    throw new Error("Invalid layout configuration");
  }

  // Check if preferences exist
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId)
  });

  if (existing) {
    await db.update(userPreferences)
      .set({ dashboardLayout: layout })
      .where(eq(userPreferences.userId, userId));
  } else {
    // We shouldn't hit this since users usually have preferences created
    await db.insert(userPreferences).values({
      userId,
      dashboardLayout: layout,
    });
  }

  return true;
}

// Removed revalidateDashboardCache due to TS error

export async function getAvailableWidgets() {
  return [
    { id: "revenue", label: "Revenue Chart", description: "Shows revenue over time", defaultW: 6, defaultH: 4 },
    { id: "user-growth", label: "User Growth Chart", description: "Active vs New Users", defaultW: 6, defaultH: 4 },
    { id: "churn", label: "Churn Rate", description: "Monthly churn rate tracking", defaultW: 12, defaultH: 4 },
  ];
}
