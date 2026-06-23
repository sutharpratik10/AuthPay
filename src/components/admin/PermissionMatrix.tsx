'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PermissionGroup, PermissionDetail } from '@/lib/rbac/types';

interface PermissionMatrixProps {
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({
  selectedPermissionIds,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/admin/permissions');
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const json = await res.json();
        if (json.success && json.data?.groups) {
          setGroups(json.data.groups);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Could not load permissions');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPermissions();
  }, []);

  const handleToggle = (permissionId: string) => {
    if (disabled) return;
    
    if (selectedPermissionIds.includes(permissionId)) {
      onChange(selectedPermissionIds.filter(id => id !== permissionId));
    } else {
      onChange([...selectedPermissionIds, permissionId]);
    }
  };

  const handleToggleGroup = (group: PermissionGroup) => {
    if (disabled) return;

    const groupPermIds = group.permissions.map(p => p.id);
    const allSelected = groupPermIds.every(id => selectedPermissionIds.includes(id));

    if (allSelected) {
      // Remove all group permissions
      onChange(selectedPermissionIds.filter(id => !groupPermIds.includes(id)));
    } else {
      // Add all group permissions
      const newSelections = new Set([...selectedPermissionIds, ...groupPermIds]);
      onChange(Array.from(newSelections));
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading permissions...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupPermIds = group.permissions.map(p => p.id);
        const allSelected = groupPermIds.length > 0 && groupPermIds.every(id => selectedPermissionIds.includes(id));
        const someSelected = groupPermIds.some(id => selectedPermissionIds.includes(id)) && !allSelected;

        return (
          <Card key={group.category} className="overflow-hidden border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-neutral-50 dark:bg-neutral-900/80 py-3 px-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`group-${group.category}`}
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={() => handleToggleGroup(group)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`group-${group.category}`}
                  className="text-sm font-semibold cursor-pointer"
                >
                  {group.category}
                </Label>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={selectedPermissionIds.includes(perm.id)}
                      onCheckedChange={() => handleToggle(perm.id)}
                      disabled={disabled}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`perm-${perm.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {perm.displayName || perm.name}
                      </Label>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
