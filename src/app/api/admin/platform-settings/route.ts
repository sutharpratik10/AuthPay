import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, successResponse, errorResponse } from "@/lib/api/helpers";
import { db } from "@/server/db";
import { platformSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api/permissions";

export const runtime = "nodejs";

const SETTINGS_ID = "singleton";

export const GET = withApiHandler(async (_req: NextRequest, { user }) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  let settings = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, SETTINGS_ID),
  });

  if (!settings) {
    const inserted = await db.insert(platformSettings).values({
      id: SETTINGS_ID,
      autoProcessRefunds: false,
      refundsEnabled: true,
    }).returning();
    settings = inserted[0];
  }

  return successResponse(settings, "Platform settings loaded");
});

export const PATCH = withApiHandler(async (req: NextRequest, { user }) => {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { autoProcessRefunds, refundsEnabled } = body;

  let settings = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, SETTINGS_ID),
  });

  if (!settings) {
    const inserted = await db.insert(platformSettings).values({
      id: SETTINGS_ID,
      autoProcessRefunds: autoProcessRefunds ?? false,
      refundsEnabled: refundsEnabled ?? true,
    }).returning();
    settings = inserted[0];
  } else {
    const updated = await db
      .update(platformSettings)
      .set({
        autoProcessRefunds: autoProcessRefunds !== undefined ? !!autoProcessRefunds : settings.autoProcessRefunds,
        refundsEnabled: refundsEnabled !== undefined ? !!refundsEnabled : settings.refundsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, SETTINGS_ID))
      .returning();
    settings = updated[0];
  }

  return successResponse(settings, "Platform settings updated");
});

export const PUT = PATCH;
