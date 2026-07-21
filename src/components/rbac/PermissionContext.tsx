'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { EffectivePermissions } from '@/lib/rbac/types';

interface PermissionContextType {
  permissions: EffectivePermissions | null;
  isLoading: boolean;
  error: Error | null;
  hasPolicy: (policy: string) => boolean;
  hasAnyPolicy: (policies: string[]) => boolean;
  hasAllPolicies: (policies: string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rbac/user/policies');
      if (!res.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const json = await res.json();
      if (json.success && json.data) {
        setPermissions(json.data);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const hasPolicy = (policy: string): boolean => {
    if (!permissions) return false;
    if (permissions.isSuperAdmin) return true;
    return permissions.allPermissions.includes(policy);
  };

  const hasAnyPolicy = (policies: string[]): boolean => {
    if (!permissions) return false;
    if (permissions.isSuperAdmin) return true;
    return policies.some(p => permissions.allPermissions.includes(p));
  };

  const hasAllPolicies = (policies: string[]): boolean => {
    if (!permissions) return false;
    if (permissions.isSuperAdmin) return true;
    return policies.every(p => permissions.allPermissions.includes(p));
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        isLoading,
        error,
        hasPolicy,
        hasAnyPolicy,
        hasAllPolicies,
        isAdmin: permissions?.isAdmin || false,
        isSuperAdmin: permissions?.isSuperAdmin || false,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
