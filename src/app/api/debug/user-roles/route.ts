/**
 * DEBUG ENDPOINT - Check current user's roles
 * GET /api/debug/user-roles
 */

import { NextRequest } from 'next/server';
import { 
  withApiHandler, 
  successResponse,
} from '@/lib/api/helpers';
import { RBACService } from '@/lib/rbac/rbac-service';
import { db } from "@/server/db";
import { userRoles, roles } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";

export const GET = withApiHandler(
  async (request: NextRequest, { user }) => {
    const userId = user!.id;

    // Get user roles from database
    const userRolesRecords = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: {
          columns: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    // Get role names using RBACService
    const roleNames = await RBACService.getUserRoles(userId);
    
    // Check if user is admin
    const isAdmin = await RBACService.isAdmin(userId);

    return successResponse({ 
      userId,
      userEmail: user!.email,
      roleNames,
      isAdmin,
      rolesDetails: userRolesRecords.map(ur => ({
        roleId: ur.roleId,
        roleName: ur.role?.name,
        roleDescription: ur.role?.description,
        assignedAt: ur.assignedAt,
      }))
    });
  },
  { requireAuth: true }
);
