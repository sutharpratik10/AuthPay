'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, Key, CheckCircle } from 'lucide-react';
import { PermissionDetail } from '@/lib/rbac/types';

interface PermissionResponse {
  success: boolean;
  data: {
    permissions: PermissionDetail[];
  };
  error?: string;
}

export function AdminPoliciesPage() {
  const [permissions, setPermissions] = useState<PermissionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPermission, setSelectedPermission] = useState<PermissionDetail | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;
  
  type SortColumn = 'name' | 'displayName' | 'category' | 'type' | null;
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const [columnFilters, setColumnFilters] = useState({
    name: '',
    displayName: '',
    category: '',
    type: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: '',
    resource: '',
    action: '',
  });

  const fetchPermissions = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);

      const response = await fetch(`/api/admin/permissions?flat=true`);
      const data: PermissionResponse = await response.json();

      if (data.success) {
        setPermissions(data.data.permissions || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch policies',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchPermissions();
      hasFetchedRef.current = true;
    }
  }, [fetchPermissions]);

  const createPermission = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Policy created successfully',
          variant: 'success',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        hasFetchedRef.current = false;
        fetchPermissions();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create policy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to create policy',
        variant: 'destructive',
      });
    }
  };

  const updatePermission = async () => {
    if (!selectedPermission) return;

    try {
      const response = await fetch(`/api/admin/permissions/${selectedPermission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Policy updated successfully',
          variant: 'success',
        });
        setIsEditDialogOpen(false);
        resetForm();
        hasFetchedRef.current = false;
        fetchPermissions();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update policy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update policy',
        variant: 'destructive',
      });
    }
  };

  const deletePermission = async () => {
    if (!selectedPermission) return;

    try {
      const response = await fetch(`/api/admin/permissions/${selectedPermission.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Policy deleted successfully',
          variant: 'success',
        });
        setIsDeleteDialogOpen(false);
        hasFetchedRef.current = false;
        fetchPermissions();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete policy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete policy',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      category: '',
      resource: '',
      action: '',
    });
  };

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

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  const filteredAndSortedPermissions = React.useMemo(() => {
    let filtered = [...permissions];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((perm) => {
          const value = column === 'type' 
            ? (perm.isSystemManaged ? 'System' : 'Custom')
            : String(perm[column as keyof PermissionDetail] || '');
          return value.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: string = '';
        let bValue: string = '';

        switch (sortColumn) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'displayName':
            aValue = a.displayName || '';
            bValue = b.displayName || '';
            break;
          case 'category':
            aValue = a.category || '';
            bValue = b.category || '';
            break;
          case 'type':
            aValue = a.isSystemManaged ? 'System' : 'Custom';
            bValue = b.isSystemManaged ? 'System' : 'Custom';
            break;
        }

        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtered;
  }, [permissions, columnFilters, sortColumn, sortDirection, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedPermissions.length / ITEMS_PER_PAGE);
  const currentItems = filteredAndSortedPermissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openEditDialog = (perm: PermissionDetail) => {
    setSelectedPermission(perm);
    setFormData({
      name: perm.name,
      displayName: perm.displayName || '',
      description: perm.description || '',
      category: perm.category || '',
      resource: perm.resource || '',
      action: perm.action || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (perm: PermissionDetail) => {
    setSelectedPermission(perm);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search policies by name or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Add a new policy (permission) to the system. Format is usually resource:action.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. content:create"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g. Create Content"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. content"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this policy allows"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createPermission}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policies (Permissions)</CardTitle>
          <CardDescription>
            Manage the granular policies that can be assigned to roles.
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
                  <TableRow>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'name' ? sortDirection : null}
                      onSort={() => handleSort('name')}
                    >
                      Policy Name
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'displayName' ? sortDirection : null}
                      onSort={() => handleSort('displayName')}
                    >
                      Display Name
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'category' ? sortDirection : null}
                      onSort={() => handleSort('category')}
                    >
                      Category
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'type' ? sortDirection : null}
                      onSort={() => handleSort('type')}
                    >
                      Type
                    </TableHeadSortable>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search name..."
                        onSearch={(value) => handleColumnFilter('name', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search display name..."
                        onSearch={(value) => handleColumnFilter('displayName', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search category..."
                        onSearch={(value) => handleColumnFilter('category', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search type..."
                        onSearch={(value) => handleColumnFilter('type', value)}
                      />
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No policies found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">{perm.name}</span>
                          </div>
                          {perm.description && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                              {perm.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{perm.displayName || '-'}</TableCell>
                        <TableCell>
                          {perm.category ? (
                            <Badge variant="outline">{perm.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={perm.isSystemManaged ? 'default' : 'secondary'}>
                            {perm.isSystemManaged ? 'System' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(perm)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(perm)}
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
              
              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={ITEMS_PER_PAGE}
                  totalItems={filteredAndSortedPermissions.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update the policy details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Policy Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updatePermission}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the policy <span className="font-semibold">{selectedPermission?.name}</span>?
              This action cannot be undone and will remove it from all roles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePermission}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
