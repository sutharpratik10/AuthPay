/**
 * API: Create a new policy (permission)
 * POST /api/rbac/policies/create
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { permissions } from "@/server/db/schema";

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const { name, description, category, displayName, resource, action } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Policy name is required" },
        { status: 400 }
      );
    }

    // Validate policy name format (should be "resource:action")
    if (!name.includes(':')) {
      return NextResponse.json(
        { error: "Policy name should be in format 'resource:action' (e.g., 'content:create')" },
        { status: 400 }
      );
    }

    // Check if policy already exists
    const existingPolicy = await db.query.permissions.findFirst({
      where: (permissions, { eq }) => eq(permissions.name, name)
    });

    if (existingPolicy) {
      return NextResponse.json(
        { error: "Policy with this name already exists" },
        { status: 409 }
      );
    }

    // Parse resource and action from name if not provided
    const [parsedResource, parsedAction] = name.split(':');

    // Create policy
    const [newPolicy] = await db.insert(permissions).values({
      name,
      description: description || null,
      category: category || null,
      displayName: displayName || name,
      resource: resource || parsedResource,
      action: action || parsedAction,
      isSystemManaged: false
    }).returning();

    return NextResponse.json({
      success: true,
      data: newPolicy
    });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json(
      { error: "Failed to create policy" },
      { status: 500 }
    );
  }
}
