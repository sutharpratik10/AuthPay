/**
 * API: Update a role
 * PUT /api/rbac/roles/[roleId]
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/server/db";
import { roles } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { roleId } = params;
    const body = await req.json();
    const { name, description, isDefault } = body;

    // Check if role exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent updating system-managed roles
    if (existingRole.isSystemManaged) {
      return NextResponse.json(
        { error: "Cannot update system-managed roles" },
        { status: 403 }
      );
    }

    // Update role
    const [updatedRole] = await db.update(roles)
      .set({
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        isDefault: isDefault !== undefined ? isDefault : existingRole.isDefault,
        updatedAt: new Date()
      })
      .where(eq(roles.id, roleId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

/**
 * API: Delete a role
 * DELETE /api/rbac/roles/[roleId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const authCheck = await requireAdmin(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { roleId } = params;

    // Check if role exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Prevent deleting system-managed roles
    if (existingRole.isSystemManaged) {
      return NextResponse.json(
        { error: "Cannot delete system-managed roles" },
        { status: 403 }
      );
    }

    // Delete role (cascade will handle rolePermissions and userRoles)
    await db.delete(roles).where(eq(roles.id, roleId));

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
