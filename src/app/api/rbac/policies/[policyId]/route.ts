/**
 * API: Update or Delete a policy
 * PUT/DELETE /api/rbac/policies/[policyId]
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { permissions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { policyId } = await params;
    const body = await req.json();
    const { name, description, category, displayName, resource, action } = body;

    // Check if policy exists
    const existingPolicy = await db.query.permissions.findFirst({
      where: eq(permissions.id, policyId)
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    // Prevent updating system-managed policies
    if (existingPolicy.isSystemManaged) {
      return NextResponse.json(
        { error: "Cannot update system-managed policies" },
        { status: 403 }
      );
    }

    // Update policy
    const [updatedPolicy] = await db.update(permissions)
      .set({
        name: name || existingPolicy.name,
        description: description !== undefined ? description : existingPolicy.description,
        category: category !== undefined ? category : existingPolicy.category,
        displayName: displayName !== undefined ? displayName : existingPolicy.displayName,
        resource: resource !== undefined ? resource : existingPolicy.resource,
        action: action !== undefined ? action : existingPolicy.action,
        updatedAt: new Date()
      })
      .where(eq(permissions.id, policyId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedPolicy
    });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { policyId } = await params;

    // Check if policy exists
    const existingPolicy = await db.query.permissions.findFirst({
      where: eq(permissions.id, policyId)
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    // Prevent deleting system-managed policies
    if (existingPolicy.isSystemManaged) {
      return NextResponse.json(
        { error: "Cannot delete system-managed policies" },
        { status: 403 }
      );
    }

    // Delete policy (cascade will handle rolePermissions)
    await db.delete(permissions).where(eq(permissions.id, policyId));

    return NextResponse.json({
      success: true,
      message: "Policy deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
