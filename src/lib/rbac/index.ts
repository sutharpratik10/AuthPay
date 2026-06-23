/**
 * Policy-Based RBAC System
 * 
 * Export all RBAC utilities for easy import throughout the application.
 * 
 * IMPORTANT: All policies/permissions are stored exclusively in the database.
 * There are NO hardcoded policy constants. Use the admin panel to manage permissions.
 * The seed script (scripts/seed-rbac.ts) bootstraps default permissions.
 */

export { RBACService } from "./rbac-service";
export {
  requirePolicy,
  requireAnyPolicy,
  requireAllPolicies,
  requireAdmin,
  getAuthenticatedUser,
  type AuthCheckResult
} from "./policy-middleware";

// Export routing utilities
export {
  getDashboardUrl,
  getAuthorizedRoute,
  getPostLoginRedirect,
  getAuthPageRedirect,
  isAdminUser,
  hasAnyPolicy,
  ROUTE_POLICIES,
  DASHBOARD_PATHS
} from "./routing-utils";

// Export all types
export type {
  PolicyName,
  RoleName,
  UserWithRoles,
  RoleWithPolicies,
  RoleWithPermissionDetails,
  PermissionDetail,
  PermissionGroup,
  EffectivePermissions,
  AdminActionResult,
  Policy,
  Role,
  UserRole,
  RBACApiResponse,
  CheckPermissionResponse,
  UserPoliciesResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  AssignRoleToPolicyRequest,
  AssignRoleToUserRequest,
  CheckPermissionRequest
} from "./types";
