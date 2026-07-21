import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { platformSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = "singleton";

export const GET = async (req: NextRequest) => {
  try {
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

    // Only expose safe public fields
    return NextResponse.json({
      success: true,
      data: {
        refundsEnabled: settings.refundsEnabled,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
