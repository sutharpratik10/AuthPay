import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { freeTrialSettings } from "@/server/db/schema";
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { eq } from "drizzle-orm";
import { z } from "zod";

const freeTrialUpdateSchema = z.object({
  planId: z.string().uuid(),
  durationDays: z.number().int().positive(),
  isActive: z.boolean(),
});

async function putHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const validatedData = freeTrialUpdateSchema.parse(body);

    const [updated] = await db
      .update(freeTrialSettings)
      .set({
        planId: validatedData.planId,
        durationDays: validatedData.durationDays,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(freeTrialSettings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Free trial settings not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated, message: "Free trial settings updated successfully" });
  } catch (error: any) {
    console.error("Error updating free trial settings:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update free trial settings" },
      { status: error.status || 500 }
    );
  }
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [deleted] = await db
      .delete(freeTrialSettings)
      .where(eq(freeTrialSettings.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Free trial settings not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deleted, message: "Free trial settings deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting free trial settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete free trial settings" },
      { status: error.status || 500 }
    );
  }
}

export const PUT = withPolicy(putHandler, API_POLICIES.ADMIN_ACCESS);
export const DELETE = withPolicy(deleteHandler, API_POLICIES.ADMIN_ACCESS);
