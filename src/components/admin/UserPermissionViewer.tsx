'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EffectivePermissions } from '@/lib/rbac/types';

interface UserPermissionViewerProps {
  userId: string;
}

export function UserPermissionViewer({ userId }: UserPermissionViewerProps) {
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserPermissions() {
      try {
        const res = await fetch(`/api/admin/users/${userId}/permissions`);
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const json = await res.json();
        if (json.success && json.data) {
          setPermissions(json.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching user permissions:', err);
        setError('Could not load effective permissions for this user.');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (userId) {
      fetchUserPermissions();
    }
  }, [userId]);

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading effective permissions...</div>;
  if (error) return <div className="p-4 text-center text-sm text-destructive">{error}</div>;
  if (!permissions) return null;

  return (
    <Card className="mt-4 shadow-sm border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-3 bg-muted/20">
        <CardTitle className="text-lg flex items-center">
          Effective Permissions
        </CardTitle>
        <CardDescription>
          This user has the following roles and effective access rights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">Assigned Roles</h4>
          <div className="flex flex-wrap gap-2">
            {permissions.roles.length > 0 ? (
              permissions.roles.map(role => (
                <Badge key={role} variant="default" className="px-2 py-1">{role}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">No roles assigned</span>
            )}
          </div>
        </div>

        {permissions.isSuperAdmin && (
          <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-500 font-medium flex items-center">
              <span className="mr-2">🛡️</span> Super Admin Access
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-600 mt-1">This user has unrestricted access to all resources and permissions.</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">Capabilities</h4>
          <div className="flex flex-wrap gap-1.5">
            {permissions.allPermissions.length > 0 ? (
              permissions.allPermissions.map(perm => (
                <Badge key={perm} variant="outline" className="font-normal text-xs">{perm}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">No specific permissions</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
