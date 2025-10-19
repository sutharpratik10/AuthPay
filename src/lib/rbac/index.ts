/**
 * Policy-Based RBAC System
 * 
 * Export all RBAC utilities for easy import throughout the application
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

// Common policy definitions for consistency
export const POLICIES = {
  // Content Management
  CONTENT_VIEW: "content:view",
  CONTENT_CREATE: "content:create",
  CONTENT_UPDATE: "content:update",
  CONTENT_DELETE: "content:delete",
  CONTENT_MANAGE: "content:manage",

  // User Management
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_MANAGE: "user:manage",

  // Role Management
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_MANAGE: "role:manage",

  // Permission/Policy Management
  POLICY_VIEW: "policy:view",
  POLICY_CREATE: "policy:create",
  POLICY_UPDATE: "policy:update",
  POLICY_DELETE: "policy:delete",
  POLICY_MANAGE: "policy:manage",

  // Billing Management
  BILLING_VIEW: "billing:view",
  BILLING_CREATE: "billing:create",
  BILLING_UPDATE: "billing:update",
  BILLING_MANAGE: "billing:manage",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_MANAGE: "analytics:manage",

  // System Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_MANAGE: "settings:manage",

  // Profile Management
  PROFILE_VIEW: "profile:view",
  PROFILE_UPDATE: "profile:update",

  // Account Management
  ACCOUNT_VIEW: "account:view",
  ACCOUNT_MANAGE: "account:manage",

  // Admin Access
  ADMIN_ACCESS: "admin:access",

  // User Access (default for all authenticated users)
  USER_ACCESS: "user:access",
} as const;

// Type for policy values
export type PolicyValue = typeof POLICIES[keyof typeof POLICIES];
