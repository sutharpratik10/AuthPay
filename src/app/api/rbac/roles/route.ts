/**
 * API: Get all roles
 * GET /api/rbac/roles
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { roles } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const GET = rateLimiters.api(async (req: NextRequest) =>req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const allRoles = await db.query.roles.findMany({
      orderBy: [desc(roles.createdAt)]
    });

    return NextResponse.json({
      success: true,
      data: allRoles
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
});
