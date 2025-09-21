// src/lib/role-utils.ts

/**
 * Utility to get the role name from a user object (supports both session and DB user)
 * - If user.role is present (populated from join), use it
 * - If user.roleName is present, use it
 * - If user.roleId is present but not role name, fallback to 'user' (or fetch from DB server-side)
 * - If nothing, fallback to 'user'
 */
interface UserLike {
  role?: string;
  roleName?: string;
  roleId?: string;
  [key: string]: unknown;
}

export function getRoleName(user: UserLike): string {
  if (!user) return 'user';
  if (typeof user.role === 'string') return user.role;
  if (typeof user.roleName === 'string') return user.roleName;
  // If you want to fetch from DB by roleId, do it server-side only
  if (typeof user.roleId === 'string') {
    // In client-side code, we can't fetch from DB, so fallback to 'user'
    return 'user';
  }
  return 'user';
}
