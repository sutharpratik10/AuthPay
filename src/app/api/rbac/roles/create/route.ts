/**
 * API: Create a new role
 * POST /api/rbac/roles/create
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { roles } from "@/server/db/schema";
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
export const POST = rateLimiters.api(async (req: NextRequest) =>req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const { name, description, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await db.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.name, name)
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 409 }
      );
    }

    // Create role
    const [newRole] = await db.insert(roles).values({
      name,
      description: description || null,
      isDefault: isDefault || false,
      isSystemManaged: false
    }).returning();

    return NextResponse.json({
      success: true,
      data: newRole
    });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
});
