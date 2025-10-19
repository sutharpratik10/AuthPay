/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Search, Plus, Edit, Trash2, Shield, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isSystemManaged?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
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
  });

  // Fetch roles with pagination and search
  const fetchRoles = useCallback(async (page: number = currentPage, search: string = searchTerm) => {
    try {
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
    }
  }, [currentPage, searchTerm, toast]);

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
    if (activeTab === 'roles') {
      fetchRoles();
    } else {
      fetchUserRoles();
    }
  }, [activeTab, fetchRoles, fetchUserRoles]);

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
        fetchRoles();
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
        fetchRoles();
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
        fetchRoles();
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
    fetchRoles(page);
  };

  // Open edit dialog
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
  isDefault: !!role.isDefault,
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with specific permissions for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter role name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter role description"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-default"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="is-default">Default role for new users</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRole}>
                    Create Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Shield className="h-4 w-4 text-gray-500" />
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
                              <Users className="h-4 w-4 text-gray-400" />
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
                                disabled={role.isSystemManaged}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(role)}
                                disabled={role.isSystemManaged || role.isDefault}
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
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
              />
              <Label htmlFor="edit-is-default">Default role for new users</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedRole.name}</div>
                  <div className="text-sm text-gray-500">{selectedRole.description || 'No description'}</div>
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
