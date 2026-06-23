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
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, User, Mail, Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface UserRole {
  id: string;
  name: string | null;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserRoleResponse {
  success: boolean;
  data: {
    users: UserRole[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
  error?: string;
}

export default function AdminUserRolesPage() {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    newRole: 'admin' | 'user';
  } | null>(null);
  const { toast } = useToast();

  // Sorting state
  type SortColumn = 'name' | 'email' | 'role' | 'status' | 'emailStatus' | 'lastLogin' | 'created' | null;
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    emailStatus: '',
    lastLogin: '',
    created: '',
  });

  // Role options for Select components
  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  // Fetch users with role information
  const fetchUsers = useCallback(async (page: number = currentPage, search: string = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UserRoleResponse = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, toast]);

  // Update user role with confirmation
  const initiateRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    const user = users.find(u => u.id === userId);
    if (user && user.role !== newRole) {
      setSelectedUser(user);
      setPendingRoleChange({ userId, newRole });
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: pendingRoleChange.userId, 
          role: pendingRoleChange.newRole 
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `User role updated to ${pendingRoleChange.newRole}`,
          variant: 'success',
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingRoleChange(null);
      setSelectedUser(null);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchUsers(1, value);
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

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = [...users];

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((user) => {
          let value = '';
          switch (column) {
            case 'name':
              value = user.name || 'No name';
              break;
            case 'email':
              value = user.email;
              break;
            case 'role':
              value = user.role;
              break;
            case 'status':
              value = user.isActive ? 'Active' : 'Inactive';
              break;
            case 'emailStatus':
              value = user.isEmailVerified ? 'Verified' : 'Unverified';
              break;
            case 'lastLogin':
              value = user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never';
              break;
            case 'created':
              value = formatDate(user.createdAt);
              break;
          }
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
            aValue = a.name || 'No name';
            bValue = b.name || 'No name';
            break;
          case 'email':
            aValue = a.email;
            bValue = b.email;
            break;
          case 'role':
            aValue = a.role;
            bValue = b.role;
            break;
          case 'status':
            aValue = a.isActive ? 'Active' : 'Inactive';
            bValue = b.isActive ? 'Active' : 'Inactive';
            break;
          case 'emailStatus':
            aValue = a.isEmailVerified ? 'Verified' : 'Unverified';
            bValue = b.isEmailVerified ? 'Verified' : 'Unverified';
            break;
          case 'lastLogin':
            aValue = a.lastLoginAt || '';
            bValue = b.lastLoginAt || '';
            break;
          case 'created':
            aValue = a.createdAt;
            bValue = b.createdAt;
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
  }, [users, columnFilters, sortColumn, sortDirection]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleStats = () => {
    const adminCount = users.filter(user => user.role === 'admin').length;
    const userCount = users.filter(user => user.role === 'user').length;
    const activeCount = users.filter(user => user.isActive).length;
    const verifiedCount = users.filter(user => user.isEmailVerified).length;
    
    return { adminCount, userCount, activeCount, verifiedCount };
  };

  const stats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Migration Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
            <AlertTriangle className="h-5 w-5 mr-2" />
            System Migration Notice
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            This page is being migrated to a new advanced roles system. Current simple role assignments will continue to work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              For advanced role management, visit the new Roles page.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/protected/admin/roles'}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              Go to Advanced Roles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Admins</p>
              <p className="text-2xl font-bold">{stats.adminCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <User className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Users</p>
              <p className="text-2xl font-bold">{stats.userCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Active</p>
              <p className="text-2xl font-bold">{stats.activeCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Mail className="h-8 w-8 text-slate-700 dark:text-slate-300" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Verified</p>
              <p className="text-2xl font-bold">{stats.verifiedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="text-sm text-neutral-600">
          Total: {users.length} users
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Management (Simple)</CardTitle>
          <CardDescription>
            Manage basic admin/user roles for system access. For advanced permissions, use the new Roles system.
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
                      User
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'role' ? sortDirection : null}
                      onSort={() => handleSort('role')}
                    >
                      Current Role
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'status' ? sortDirection : null}
                      onSort={() => handleSort('status')}
                    >
                      Status
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'emailStatus' ? sortDirection : null}
                      onSort={() => handleSort('emailStatus')}
                    >
                      Email Status
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'lastLogin' ? sortDirection : null}
                      onSort={() => handleSort('lastLogin')}
                    >
                      Last Login
                    </TableHeadSortable>
                    <TableHeadSortable
                      sortable
                      sortDirection={sortColumn === 'created' ? sortDirection : null}
                      onSort={() => handleSort('created')}
                    >
                      Created
                    </TableHeadSortable>
                    <TableHead className="text-right">Change Role</TableHead>
                  </TableRow>

                  {/* Search row */}
                  <TableRow>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search user..."
                        onSearch={(value) => handleColumnFilter('name', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search role..."
                        onSearch={(value) => handleColumnFilter('role', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search status..."
                        onSearch={(value) => handleColumnFilter('status', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search email..."
                        onSearch={(value) => handleColumnFilter('emailStatus', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search login..."
                        onSearch={(value) => handleColumnFilter('lastLogin', value)}
                      />
                    </TableHead>
                    <TableHead>
                      <TableColumnSearch
                        placeholder="Search date..."
                        onSearch={(value) => handleColumnFilter('created', value)}
                      />
                    </TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredAndSortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                              <User className="h-4 w-4 text-neutral-500" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'No name'}</div>
                            <div className="text-sm text-neutral-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={user.isEmailVerified ? 'default' : 'destructive'}>
                          {user.isEmailVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div className="text-sm text-neutral-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(user.lastLoginAt)}
                          </div>
                        ) : (
                          <span className="text-neutral-400">Never</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Select
                          value={user.role}
                          onValueChange={(value) => initiateRoleChange(user.id, value as 'admin' | 'user')}
                          options={roleOptions}
                          className="w-24"
                        />
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
                  totalItems={users.length}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change this user&apos;s role? This will affect their system permissions.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && pendingRoleChange && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedUser.name || 'No name'}</div>
                  <div className="text-sm text-neutral-500">{selectedUser.email}</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    Role: <span className="font-medium">{selectedUser.role}</span> → <span className="font-medium text-blue-600">{pendingRoleChange.newRole}</span>
                  </div>
                </div>
              </div>
              
              {pendingRoleChange.newRole === 'admin' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-sm text-amber-800 font-medium">Warning</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    You are about to grant admin privileges to this user. Admins have full access to all system features and user data.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRoleChange}
              variant={pendingRoleChange?.newRole === 'admin' ? 'destructive' : 'default'}
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>    </div>
  );
}
