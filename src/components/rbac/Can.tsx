'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from './PermissionContext';

interface CanProps {
  policy?: string;
  anyPolicy?: string[];
  allPolicies?: string[];
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({
  policy,
  anyPolicy,
  allPolicies,
  adminOnly,
  superAdminOnly,
  children,
  fallback = null,
}: CanProps) {
  const { isLoading, hasPolicy, hasAnyPolicy, hasAllPolicies, isAdmin, isSuperAdmin } = usePermissions();

  if (isLoading) {
    // Optionally return a loading skeleton or null while resolving permissions
    // Usually it's better to render null to prevent layout shifts of unauthorized content
    return null;
  }

  let isAuthorized = true;

  if (superAdminOnly && !isSuperAdmin) {
    isAuthorized = false;
  } else if (adminOnly && !isAdmin) {
    isAuthorized = false;
  } else if (policy && !hasPolicy(policy)) {
    isAuthorized = false;
  } else if (anyPolicy && anyPolicy.length > 0 && !hasAnyPolicy(anyPolicy)) {
    isAuthorized = false;
  } else if (allPolicies && allPolicies.length > 0 && !hasAllPolicies(allPolicies)) {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
