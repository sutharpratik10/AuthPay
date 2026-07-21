/**
 * TypeScript Types for RBAC System
 */

// Policy names type
export type PolicyName = string;

// Role names type
export type RoleName = string;

// User with roles
export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  roles: {
    id: string;
    name: string;
    description: string | null;
    priority: number;
    assignedAt: Date;
  }[];
}

// Role with policies/permissions
export interface RoleWithPolicies {
  id: string;
  name: string;
  description: string | null;
  isSystemManaged: boolean;
  isSuperAdmin: boolean;
  priority: number;
  policies: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    resource: string | null;
    action: string | null;
  }[];
}

// Full role with permission details (for admin UI)
export interface RoleWithPermissionDetails {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystemManaged: boolean;
  isSuperAdmin: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  permissions: PermissionDetail[];
}

// Permission detail
export interface PermissionDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  displayName: string | null;
  resource: string | null;
  action: string | null;
  isSystemManaged: boolean;
}

// Policy/Permission
export interface Policy {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  displayName: string | null;
  resource: string | null;
  action: string | null;
  isSystemManaged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystemManaged: boolean;
  isSuperAdmin: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

// User-Role assignment
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string | null;
}

// Effective permissions (includes inherited)
export interface EffectivePermissions {
  userId: string;
  roles: string[];
  explicitPermissions: string[];  // Directly assigned via roles
  inheritedPermissions: string[]; // Implied by *:manage → *:view etc.
  allPermissions: string[];       // Union of explicit + inherited
  isAdmin: boolean;
  isSuperAdmin: boolean;
  highestPriority: number;
}

// Admin action result
export interface AdminActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  auditId?: string;
}

// API Response types
export interface RBACApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CheckPermissionResponse {
  success: boolean;
  hasAccess?: boolean;
  policy?: string;
  results?: Record<string, boolean>;
}

export interface UserPoliciesResponse {
  userId: string;
  roles: string[];
  policies: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// API Request types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  priority?: number;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
  priority?: number;
}

export interface CreatePolicyRequest {
  name: string;
  description?: string;
  category?: string;
  displayName?: string;
  resource?: string;
  action?: string;
}

export interface UpdatePolicyRequest {
  name?: string;
  description?: string;
  category?: string;
  displayName?: string;
  resource?: string;
  action?: string;
}

export interface AssignRoleToPolicyRequest {
  policyId: string;
}

export interface AssignRoleToUserRequest {
  roleId: string;
}

export interface CheckPermissionRequest {
  policy?: string;
  policies?: string[];
}

// Permission grouped by category (for admin UI)
export interface PermissionGroup {
  category: string;
  permissions: PermissionDetail[];
}
