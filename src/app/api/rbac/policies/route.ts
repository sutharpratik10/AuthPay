/**
 * API: Get all policies (permissions)
 * GET /api/rbac/policies
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { permissions } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const allPolicies = await db.query.permissions.findMany({
      orderBy: [desc(permissions.createdAt)]
    });

    return NextResponse.json({
      success: true,
      data: allPolicies
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}
