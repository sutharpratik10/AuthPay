import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { freeTrialSettings } from "@/server/db/schema";
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { eq } from "drizzle-orm";
import { z } from "zod";

const freeTrialSchema = z.object({
  planId: z.string().uuid(),
  durationDays: z.number().int().positive(),
  isActive: z.boolean(),
});

async function getHandler() {
  try {
    const [settings] = await db.select().from(freeTrialSettings).limit(1);

    if (!settings) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("Error fetching free trial settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch free trial settings" },
      { status: error.status || 500 }
    );
  }
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = freeTrialSchema.parse(body);

    // Ensure only one row exists, so try to find existing first
    const [existing] = await db.select().from(freeTrialSettings).limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(freeTrialSettings)
        .set({
          planId: validatedData.planId,
          durationDays: validatedData.durationDays,
          isActive: validatedData.isActive,
          updatedAt: new Date(),
        })
        .where(eq(freeTrialSettings.id, existing.id))
        .returning();

      return NextResponse.json({ data: updated, message: "Free trial settings updated successfully" });
    } else {
      // Create new
      const [created] = await db
        .insert(freeTrialSettings)
        .values({
          planId: validatedData.planId,
          durationDays: validatedData.durationDays,
          isActive: validatedData.isActive,
        })
        .returning();

      return NextResponse.json({ data: created, message: "Free trial settings created successfully" });
    }
  } catch (error: any) {
    console.error("Error creating/updating free trial settings:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to save free trial settings" },
      { status: error.status || 500 }
    );
  }
}

export const GET = withPolicy(getHandler, API_POLICIES.ADMIN_ACCESS);
export const POST = withPolicy(postHandler, API_POLICIES.ADMIN_ACCESS);
