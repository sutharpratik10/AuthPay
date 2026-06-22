/**
 * TypeScript Types for RBAC System
 */

// Policy names type
export type PolicyName = string;

// Role names type
export type RoleName = "Admin" | "Author" | "User" | string;

// User with roles
export interface UserWithRoles {
  id: string;
  email: string;
  roles: {
    id: string;
    name: string;
    description: string | null;
    assignedAt: Date;
  }[];
}

// Role with policies
export interface RoleWithPolicies {
  id: string;
  name: string;
  description: string | null;
  isSystemManaged: boolean;
  policies: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    resource: string | null;
    action: string | null;
  }[];
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
}

// API Request types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
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
