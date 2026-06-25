/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableHeadSortable,
  TableColumnSearch,
  TablePagination
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, Shield, Users, CheckCircle, AlertTriangle, Key, FileText, UserCog, UserPlus } from 'lucide-react';
import { PermissionMatrix } from './PermissionMatrix';

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isSystemManaged?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  priority?: number;
  isSuperAdmin?: boolean;
  permissions?: { id: string; name: string }[];
}

interface RoleResponse {
  success: boolean;
  data: {
    roles: Role[];
    pagination?: {
      total: number;
      page: number;
      pages: number;
    };
  };
  error?: string;
}

interface UserRole {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  roleId: string;
  roleName: string;
  assignedAt: string;
}

interface UserRoleResponse {
  success: boolean;
  data: {
    userRoles: UserRole[];
    pagination?: {
      total: number;
      page: number;
      pages: number;
    };
  };
  error?: string;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'assignments'>('roles');

  // Use refs to prevent duplicate fetches (React Strict Mode causes double mounting)
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const { toast } = useToast();

  // Sorting state
  type SortColumn = 'name' | 'description' | 'type' | 'userCount' | 'createdAt' | null;
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    description: '',
    type: '',
    userCount: '',
    createdAt: '',
  });

  // Form state for create/edit role
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    priority: 0,
    permissionIds: [] as string[],
  });

  // Fetch roles with pagination and search
  const fetchRoles = useCallback(async (page: number, search: string) => {
    // Prevent duplicate fetches in React Strict Mode
    if (isFetchingRef.current) {
      console.log('[AdminRolesPage] Fetch already in progress, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search,
      });

      const response = await fetch(`/api/admin/roles?${params}`);
      const data: RoleResponse = await response.json();

      if (data.success) {
        setRoles(data.data.roles);
        setTotalPages(data.data.pagination?.pages || 1);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch roles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]); // Remove currentPage and searchTerm from deps - they're passed as parameters

  // Fetch user role assignments
  const fetchUserRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/user-roles');
      const data: UserRoleResponse = await response.json();

      if (data.success) {
        setUserRoles(data.data.userRoles);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch user role assignments',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user role assignments',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'roles' && !hasFetchedRef.current) {
      fetchRoles(currentPage, searchTerm);
      hasFetchedRef.current = true;
    } else if (activeTab === 'assignments') {
      fetchUserRoles();
    }
  }, [activeTab, currentPage, searchTerm, fetchRoles, fetchUserRoles]);

  // Create role
  const createRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Role created successfully',
          variant: 'success',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        hasFetchedRef.current = false; // Reset to allow refetch
        fetchRoles(currentPage, searchTerm);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
    }
  };

  // Update role
  const updateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Role updated successfully',
          variant: 'success',
        });
        setIsEditDialogOpen(false);
        resetForm();
        hasFetchedRef.current = false; // Reset to allow refetch
        fetchRoles(currentPage, searchTerm);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  // Delete role
  const deleteRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Role deleted successfully',
          variant: 'success',
        });
        setIsDeleteDialogOpen(false);
        hasFetchedRef.current = false; // Reset to allow refetch
        fetchRoles(currentPage, searchTerm);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      priority: 0,
      permissionIds: [],
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchRoles(1, value);
  };

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle column filter
  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  // Filter and sort roles
  const filteredAndSortedRoles = React.useMemo(() => {
    let filtered = [...roles];

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((role) => {
          const value = column === 'type'
            ? (role.isSystemManaged ? 'System' : 'Custom')
            : column === 'userCount'
              ? String(role.userCount || 0)
              : String(role[column as keyof Role] || '');
          return value.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortColumn) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'description':
            aValue = a.description || '';
            bValue = b.description || '';
            break;
          case 'type':
            aValue = a.isSystemManaged ? 'System' : 'Custom';
            bValue = b.isSystemManaged ? 'System' : 'Custom';
            break;
          case 'userCount':
            aValue = a.userCount || 0;
            bValue = b.userCount || 0;
            break;
          case 'createdAt':
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
            break;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtered;
  }, [roles, columnFilters, sortColumn, sortDirection]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    hasFetchedRef.current = false; // Reset to allow refetch
    fetchRoles(page, searchTerm);
  };

  // Open edit dialog
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      isDefault: !!role.isDefault,
      priority: role.priority || 0,
      permissionIds: role.permissions?.map(p => p.id) || [],
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">

      <>
        {/* Header with search and create button */}
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/protected/admin/permissions">
                <Shield className="h-4 w-4 mr-2" />
                Permissions & Audit
              </Link>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[1400px] h-[90vh] overflow-y-auto bg-white dark:bg-neutral-950 border border-[#EAEAEA] dark:border-neutral-800 shadow-xl rounded-[20px] p-0 flex flex-col">
                <DialogHeader className="px-5 py-2 border-b border-[#EAEAEA] dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950 rounded-t-[20px]">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <UserPlus className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                    </div>
                    <div>
                      <DialogTitle className="text-[22px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">Create Role</DialogTitle>
                      <DialogDescription className="text-[14px] text-neutral-500 dark:text-neutral-400 mt-1">
                        Create a new role with specific permissions for your organization.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-neutral-900 px-10 py-10 space-y-10">
                  {/* ROLE DETAILS Section */}
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">ROLE DETAILS</h3>
                    <div className="border border-[#EAEAEA] dark:border-neutral-800 rounded-[16px] p-8 bg-white dark:bg-neutral-950 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Col 1 */}
                        <div className="space-y-3">
                          <Label htmlFor="name" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Role Name <span className="text-neutral-500 dark:text-neutral-400">*</span></Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter role name"
                            className="h-11 bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                          />
                        </div>
                        {/* Col 2 */}
                        <div className="space-y-3">
                          <Label htmlFor="description" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter role description"
                            rows={2}
                            className="min-h-[44px] bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] resize-none focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                          />
                        </div>
                        {/* Col 3 */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="priority" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Priority Level</Label>
                            <div className="group relative cursor-help text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                              <Shield className="w-4 h-4" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-neutral-900 dark:bg-neutral-100 text-xs text-white dark:text-neutral-900 rounded shadow-lg z-10">
                                Used to prevent users from modifying roles with equal or higher priority.
                              </div>
                            </div>
                          </div>
                          <Input
                            id="priority"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                            placeholder="0-100"
                            className="h-11 bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                          />
                          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-tight">Used to prevent users from modifying roles with equal or higher priority.</p>
                        </div>
                        {/* Col 4 */}
                        <div className="flex flex-col justify-center space-y-3 md:pl-4">
                          <div className="flex items-center space-x-4">
                            <Switch
                              id="is-default"
                              checked={formData.isDefault}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                              className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100"
                            />
                            <Label htmlFor="is-default" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer">Default role for new users</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PERMISSIONS Section */}
                  <div className="space-y-4 pb-8">
                    <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">PERMISSIONS</h3>
                    <div className="border border-[#EAEAEA] dark:border-neutral-800 rounded-[16px] p-8 bg-white dark:bg-neutral-950 shadow-sm">
                      <PermissionMatrix
                        selectedPermissionIds={formData.permissionIds}
                        onChange={(ids) => setFormData(prev => ({ ...prev, permissionIds: ids }))}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-10 py-6 border-t border-[#EAEAEA] dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-b-[20px] shrink-0">
                  <Button variant="outline" className="border-[#EAEAEA] dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 h-11 px-6 rounded-[10px] hover:bg-neutral-50 dark:hover:bg-neutral-900 font-bold" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRole} className="bg-neutral-900 dark:bg-neutral-100 hover:bg-black dark:hover:bg-white text-white dark:text-neutral-900 h-11 px-8 rounded-[10px] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] font-bold border-transparent">
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Roles table */}
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Manage roles and their permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    {/* Header row with sorting */}
                    <TableRow>
                      <TableHeadSortable
                        sortable
                        sortDirection={sortColumn === 'name' ? sortDirection : null}
                        onSort={() => handleSort('name')}
                      >
                        Role
                      </TableHeadSortable>
                      <TableHeadSortable
                        sortable
                        sortDirection={sortColumn === 'description' ? sortDirection : null}
                        onSort={() => handleSort('description')}
                      >
                        Description
                      </TableHeadSortable>
                      <TableHeadSortable
                        sortable
                        sortDirection={sortColumn === 'type' ? sortDirection : null}
                        onSort={() => handleSort('type')}
                      >
                        Type
                      </TableHeadSortable>
                      <TableHeadSortable
                        sortable
                        sortDirection={sortColumn === 'userCount' ? sortDirection : null}
                        onSort={() => handleSort('userCount')}
                      >
                        Users
                      </TableHeadSortable>
                      <TableHeadSortable
                        sortable
                        sortDirection={sortColumn === 'createdAt' ? sortDirection : null}
                        onSort={() => handleSort('createdAt')}
                      >
                        Created
                      </TableHeadSortable>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>

                    {/* Search row */}
                    <TableRow>
                      <TableHead>
                        <TableColumnSearch
                          placeholder="Search role..."
                          onSearch={(value) => handleColumnFilter('name', value)}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnSearch
                          placeholder="Search description..."
                          onSearch={(value) => handleColumnFilter('description', value)}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnSearch
                          placeholder="Search type..."
                          onSearch={(value) => handleColumnFilter('type', value)}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnSearch
                          placeholder="Search count..."
                          onSearch={(value) => handleColumnFilter('userCount', value)}
                        />
                      </TableHead>
                      <TableHead>
                        <TableColumnSearch
                          placeholder="Search date..."
                          onSearch={(value) => handleColumnFilter('createdAt', value)}
                        />
                      </TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No roles found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                                  <Shield className="h-4 w-4 text-neutral-500" />
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{role.name}</div>
                                {role.isDefault && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {role.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.isSystemManaged ? 'default' : 'secondary'}>
                              {role.isSystemManaged ? 'System' : 'Custom'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-neutral-400" />
                              <span>{role.userCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(role.createdAt ?? '')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(role)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(role)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={10}
                    totalItems={roles.length}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </>
      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[1400px] h-[90vh] overflow-y-auto bg-white dark:bg-neutral-950 border border-[#EAEAEA] dark:border-neutral-800 shadow-xl rounded-[20px] p-0 flex flex-col">
          <DialogHeader className="px-8 py-5 border-b border-[#EAEAEA] dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950 rounded-t-[20px]">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <UserCog className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
              </div>
              <div>
                <DialogTitle className="text-[22px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">Edit Role</DialogTitle>
                <DialogDescription className="text-[14px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Update the role information and permissions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-neutral-900 px-10 py-10 space-y-10">
            {/* ROLE DETAILS Section */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">ROLE DETAILS</h3>
              <div className="border border-[#EAEAEA] dark:border-neutral-800 rounded-[16px] p-8 bg-white dark:bg-neutral-950 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Col 1 */}
                  <div className="space-y-3">
                    <Label htmlFor="edit-name" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Role Name <span className="text-neutral-500 dark:text-neutral-400">*</span></Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter role name"
                      className="h-11 bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                    />
                  </div>
                  {/* Col 2 */}
                  <div className="space-y-3">
                    <Label htmlFor="edit-description" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter role description"
                      rows={2}
                      className="min-h-[44px] bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] resize-none focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                    />
                  </div>
                  {/* Col 3 */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="edit-priority" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Priority Level</Label>
                      <div className="group relative cursor-help text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                        <Shield className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-neutral-900 dark:bg-neutral-100 text-xs text-white dark:text-neutral-900 rounded shadow-lg z-10">
                          Used to prevent users from modifying roles with equal or higher priority.
                        </div>
                      </div>
                    </div>
                    <Input
                      id="edit-priority"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      placeholder="0-100"
                      className="h-11 bg-white dark:bg-neutral-950 border-[#EAEAEA] dark:border-neutral-800 rounded-[10px] focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                    />
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-tight">Used to prevent users from modifying roles with equal or higher priority.</p>
                  </div>
                  {/* Col 4 */}
                  <div className="flex flex-col justify-center space-y-3 md:pl-4">
                    <div className="flex items-center space-x-4">
                      <Switch
                        id="edit-is-default"
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                        className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100"
                      />
                      <Label htmlFor="edit-is-default" className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer">Default role for new users</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PERMISSIONS Section */}
            <div className="space-y-4 pb-8">
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">PERMISSIONS</h3>
              <div className="border border-[#EAEAEA] dark:border-neutral-800 rounded-[16px] p-8 bg-white dark:bg-neutral-950 shadow-sm">
                <PermissionMatrix
                  selectedPermissionIds={formData.permissionIds}
                  onChange={(ids) => setFormData(prev => ({ ...prev, permissionIds: ids }))}
                  disabled={selectedRole?.isSuperAdmin}
                />
                {selectedRole?.isSuperAdmin && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-6 bg-neutral-100 dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    Super Admin role permissions cannot be modified.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-10 py-6 border-t border-[#EAEAEA] dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-b-[20px] shrink-0">
            <Button variant="outline" className="border-[#EAEAEA] dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 h-11 px-6 rounded-[10px] hover:bg-neutral-50 dark:hover:bg-neutral-900 font-bold" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateRole} className="bg-neutral-900 dark:bg-neutral-100 hover:bg-black dark:hover:bg-white text-white dark:text-neutral-900 h-11 px-8 rounded-[10px] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] font-bold border-transparent">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-neutral-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedRole.name}</div>
                  <div className="text-sm text-neutral-500">{selectedRole.description || 'No description'}</div>
                </div>
              </div>

              {(selectedRole.userCount ?? 0) > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-800 font-medium">Warning</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    This role is currently assigned to {selectedRole.userCount ?? 0} user(s).
                    Deleting it will remove these assignments.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRole}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
