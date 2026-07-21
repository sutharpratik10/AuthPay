'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGroup } from '@/lib/rbac/types';
import { 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Settings, 
  Database, 
  FileText, 
  LayoutDashboard, 
  CreditCard,
  Key,
  Users,
  BarChart,
  TerminalSquare
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface PermissionMatrixProps {
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
}

const getCategoryStyles = (category: string) => {
  // All categories use neutral/black/white shades now as requested
  return { 
    icon: <LayoutDashboard className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />,
    bg: "bg-neutral-100 dark:bg-neutral-800",
    border: "border-neutral-200 dark:border-neutral-700"
  };
};

export function PermissionMatrix({
  selectedPermissionIds,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/admin/permissions');
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const json = await res.json();
        if (json.success && json.data?.groups) {
          setGroups(json.data.groups);
          
          // Expand all by default initially
          const initialExpanded: Record<string, boolean> = {};
          json.data.groups.forEach((g: PermissionGroup) => {
            initialExpanded[g.category] = true;
          });
          setExpandedGroups(initialExpanded);
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

  const allPermissionIds = useMemo(() => {
    return groups.flatMap(g => g.permissions.map(p => p.id));
  }, [groups]);

  const handleToggle = (permissionId: string) => {
    if (disabled) return;
    
    if (selectedPermissionIds.includes(permissionId)) {
      onChange(selectedPermissionIds.filter(id => id !== permissionId));
    } else {
      onChange([...selectedPermissionIds, permissionId]);
    }
  };

  const handleToggleGroup = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isAllSelected = allPermissionIds.length > 0 && allPermissionIds.every(id => selectedPermissionIds.includes(id));
  const isIndeterminate = allPermissionIds.some(id => selectedPermissionIds.includes(id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allPermissionIds);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">Loading permissions...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <p className="text-[15px] text-neutral-500 dark:text-neutral-400">
          Select the permissions assigned to this role.
        </p>
        <div className="flex items-center space-x-2">
          <label htmlFor="select-all-perms" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer">Select All</label>
          <Checkbox 
            id="select-all-perms"
            checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
            className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100 data-[state=checked]:border-neutral-900 dark:data-[state=checked]:border-neutral-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const groupPermIds = group.permissions.map(p => p.id);
          const selectedCount = groupPermIds.filter(id => selectedPermissionIds.includes(id)).length;
          const totalCount = groupPermIds.length;
          const isFullySelected = selectedCount === totalCount && totalCount > 0;
          const isExpanded = expandedGroups[group.category];
          
          const styles = getCategoryStyles(group.category);

          // Badge logic: Neutral/Black/White scale
          let badgeClass = "bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800";
          if (isFullySelected) badgeClass = "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"; 
          else if (selectedCount > 0) badgeClass = "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100";

          return (
            <div 
              key={group.category} 
              className={cn(
                "bg-white dark:bg-neutral-950 rounded-xl transition-all duration-200 overflow-hidden",
                "border border-[#EAEAEA] dark:border-neutral-800", // Soft gray border
                "hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]", // Subtle hover shadow
                !isExpanded && "h-[68px]" // Fixed height when collapsed to match header
              )}
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer select-none"
                onClick={() => handleToggleGroup(group.category)}
              >
                <div className="flex items-center space-x-4">
                  {/* Hexagon/Rounded square icon container */}
                  <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", styles.bg, styles.border, "border")}>
                    {styles.icon}
                  </div>
                  <h4 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                    {group.category}
                  </h4>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={cn("px-3 py-1 text-xs font-bold rounded-full transition-colors", badgeClass)}>
                    {selectedCount} of {totalCount} selected
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <>
                  <div className="mx-4 border-t border-[#EAEAEA] dark:border-neutral-800"></div>
                  <div className="p-5">
                    {/* Inner 2-column grid for permissions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                      {group.permissions.map((perm) => (
                        <div key={perm.id} className="flex items-start space-x-3 group cursor-pointer" onClick={(e) => {
                          e.preventDefault();
                          handleToggle(perm.id);
                        }}>
                          <div className="mt-0.5">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={selectedPermissionIds.includes(perm.id)}
                              onCheckedChange={() => handleToggle(perm.id)}
                              disabled={disabled}
                              className="w-4 h-4 rounded-[4px] data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100 data-[state=checked]:border-neutral-900 dark:data-[state=checked]:border-neutral-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex flex-col space-y-0.5 select-none -mt-0.5">
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggle(perm.id);
                              }}
                            >
                              {perm.displayName || perm.name}
                            </label>
                            {perm.description && (
                              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-tight">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
