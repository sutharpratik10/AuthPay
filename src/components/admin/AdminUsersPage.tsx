'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableColumn } from '@/components/ui/data-table/types';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, Shield, User, Mail, Calendar, Activity, AlertTriangle, Clock, Key } from 'lucide-react';
import { getExpiryStatus } from '@/lib/utils/subscription-utils';
import { UserPermissionViewer } from './UserPermissionViewer';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string; // Primary role for backward compatibility
  roles?: string[]; // All user roles
  isEmailVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  subscriptionName: string | null;
  subscriptionBillingCycle: string | null;
  subscriptionStartDate: string | null;
  subscriptionExpiryDate: string | null;
}

interface UserResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  billingCycle: string;
  features: string | null;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleEditDialogOpen, setIsRoleEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const { toast } = useToast();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    password: '',
    isActive: true,
    isEmailVerified: true,
  });

  // Role options from DB
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  const loadRoleOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      if (data.success && data.data?.roles) {
        // Fix roleOptions mapping to avoid 'any' type
        setRoleOptions(
          data.data.roles.map((role: { name: string }) => ({ value: role.name, label: role.name.charAt(0).toUpperCase() + role.name.slice(1) }))
        );
      } else {
        setRoleOptions([]);
      }
    } catch {
      setRoleOptions([]);
    }
  }, []);

  // Load subscription plans
  const loadSubscriptionPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      const data = await response.json();

      if (data.success) {
        setSubscriptionPlans(data.data.plans);
      } else {
        console.error('Failed to load subscription plans:', data.error);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  }, []);
  // Assign subscription plan to user
  const assignSubscriptionPlan = async (userId: string, planId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/assign-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
          variant: 'success',
        });
        fetchUsers(); // Refresh the users list to show updated subscription info
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to assign subscription plan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error assigning subscription plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign subscription plan',
        variant: 'destructive',
      });
    }
  };

  // Remove subscription plan from user
  const removeSubscriptionPlan = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/remove-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
          variant: 'success',
        });
        fetchUsers(); // Refresh the users list to show updated subscription info
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove subscription plan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing subscription plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove subscription plan',
        variant: 'destructive',
      });
    }
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '500',
        search: '',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UserResponse = await response.json();

      if (data.success) {
        setUsers(data.data.users);
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
  }, [toast]);

  // Create user
  const createUser = async () => {
    try {
      // Transform formData to match API expectations
      const payload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        roleName: formData.role, // API expects 'roleName' instead of 'role'
        isActive: formData.isActive,
        isEmailVerified: formData.isEmailVerified,
      };

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'User created successfully',
          variant: 'success',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  // Update user roles (supports multiple roles)
  const updateUserRoles = async (userId: string, selectedRoles: string[]) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleNames: selectedRoles }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `User roles updated to: ${selectedRoles.join(', ')}`,
          variant: 'success',
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user roles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user roles',
        variant: 'destructive',
      });
    }
  };  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      // Update user details
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
          isEmailVerified: formData.isEmailVerified,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Handle subscription changes
        const currentPlan = subscriptionPlans.find(plan => plan.name === selectedUser.subscriptionName);
        const currentPlanId = currentPlan?.id || '';

        if (selectedPlanId !== currentPlanId) {
          if (selectedPlanId && selectedPlanId !== '') {
            // Assign new subscription plan
            await assignSubscriptionPlan(selectedUser.id, selectedPlanId);
          } else if (currentPlanId) {
            // Remove current subscription plan (user selected "No Subscription")
            await removeSubscriptionPlan(selectedUser.id);
          }
        }

        toast({
          title: 'Success',
          description: 'User updated successfully',
          variant: 'success',
        });
        setIsEditDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!selectedUser) return;

    // Additional check to prevent self-deletion
    if (selectedUser.id === currentUserId) {
      toast({
        title: 'Action not allowed',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
          variant: 'success',
        });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };
  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'user',
      password: '',
      isActive: true,
      isEmailVerified: true,
    });
    setSelectedPlanId('');
  };



  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open edit dialog
  const openEditDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    });

    // Find the current subscription plan ID for this user
    const currentPlan = subscriptionPlans.find(plan => plan.name === user.subscriptionName);
    setSelectedPlanId(currentPlan?.id || '');

    setIsEditDialogOpen(true);
  }, [subscriptionPlans]);

  // Open delete dialog
  const openDeleteDialog = useCallback((user: User) => {
    // Prevent opening delete dialog for current user
    if (user.id === currentUserId) {
      toast({
        title: 'Action not allowed',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  }, [currentUserId, toast]);

  // Close role edit dialog
  const closeRoleEditDialog = () => {
    setIsRoleEditDialogOpen(false);
    setSelectedUserForRoles(null);
    setSelectedRoles([]);
  };

  const userColumns: DataTableColumn<User>[] = React.useMemo(() => [
    {
      id: 'name',
      header: 'User',
      accessorKey: 'name',
      searchable: true,
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <User className="h-4 w-4 text-neutral-500" />
            </div>
          </div>
          <div>
            <div className="font-medium">{row.name || 'No name'}</div>
            <div className="text-sm text-neutral-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      header: 'Roles',
      accessorKey: 'role',
      searchable: true,
      sortable: true,
      filterType: 'multi-select',
      filterOptions: roleOptions,
      cell: ({ row }) => {
        const user = row;
        return (
          <div className="flex flex-wrap gap-1">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((roleName) => (
                <Badge
                  key={roleName}
                  variant={roleName === 'admin' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {roleName === 'admin' ? (
                    <Shield className="h-3 w-3 mr-1" />
                  ) : (
                    <User className="h-3 w-3 mr-1" />
                  )}
                  {roleName}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">
                <User className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'isActive',
      searchable: true,
      sortable: true,
      filterType: 'multi-select',
      filterOptions: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
      cell: ({ row }) => {
        const user = row;
        return (
          <div className="flex flex-col space-y-1">
            <Badge variant={user.isActive ? 'default' : 'destructive'}>
              <Activity className="h-3 w-3 mr-1" />
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {user.isEmailVerified && (
              <Badge variant="outline" className="text-xs">
                Email Verified
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      id: 'subscription',
      header: 'Subscription',
      accessorKey: 'subscriptionName',
      searchable: true,
      sortable: true,
      cell: ({ row }) => {
        const user = row;
        return user.subscriptionName ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {user.subscriptionName}
          </Badge>
        ) : (
          <span className="text-neutral-400">No Subscription</span>
        );
      }
    },
    {
      id: 'billingCycle',
      header: 'Cycle',
      accessorKey: 'subscriptionBillingCycle',
      searchable: true,
      sortable: true,
      cell: ({ row }) => {
        const user = row;
        return user.subscriptionBillingCycle ? (
          <span className="text-sm capitalize">{user.subscriptionBillingCycle}</span>
        ) : (
          <span className="text-neutral-400">-</span>
        );
      }
    },
    {
      id: 'subscriptionStartDate',
      header: 'Start Date',
      accessorKey: 'subscriptionStartDate',
      searchable: true,
      sortable: true,
      filterType: 'date',
      cell: ({ row }) => {
        const user = row;
        return user.subscriptionStartDate ? (
          <div className="text-sm">
            {formatDate(user.subscriptionStartDate)}
          </div>
        ) : (
          <span className="text-neutral-400">-</span>
        );
      }
    },
    {
      id: 'expiryDate',
      header: 'Expiry Date',
      accessorKey: 'subscriptionExpiryDate',
      searchable: true,
      sortable: true,
      filterType: 'date',
      cell: ({ row }) => {
        const user = row;
        if (!user.subscriptionExpiryDate) {
          return <span className="text-neutral-400">No Expiry</span>;
        }

        const statusInfo = getExpiryStatus(new Date(user.subscriptionExpiryDate));
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let badgeClass = "";
        let icon = <Clock className="h-3 w-3 mr-1" />;

        switch (statusInfo.status) {
          case 'expired':
            badgeVariant = "destructive";
            icon = <AlertTriangle className="h-3 w-3 mr-1" />;
            break;
          case 'expiring':
            badgeVariant = "secondary";
            badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
            icon = <AlertTriangle className="h-3 w-3 mr-1" />;
            break;
          case 'active':
            badgeVariant = "outline";
            badgeClass = "bg-green-50 text-green-700 border-green-200";
            break;
          case 'lifetime':
            badgeVariant = "outline";
            badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            break;
        }

        return (
          <div className="flex flex-col space-y-1">
            <div className="text-sm">
              {formatDate(user.subscriptionExpiryDate)}
            </div>
            <Badge variant={badgeVariant} className={`text-xs ${badgeClass}`}>
              {icon}
              {statusInfo.message}
            </Badge>
          </div>
        );
      }
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      accessorKey: 'lastLoginAt',
      searchable: true,
      sortable: true,
      filterType: 'date',
      cell: ({ row }) => {
        const user = row;
        return user.lastLoginAt ? (
          <div className="text-sm">
            <Calendar className="h-3 w-3 inline mr-1" />
            {formatDate(user.lastLoginAt)}
          </div>
        ) : (
          <span className="text-neutral-400">Never</span>
        );
      }
    },
    {
      id: 'created',
      header: 'Created',
      accessorKey: 'createdAt',
      searchable: true,
      sortable: true,
      filterType: 'date',
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.createdAt)}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: ({ row }) => {
        const user = row;
        return (
          <div className="flex justify-end space-x-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={user.id === currentUserId}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserForRoles(user);
                setSelectedRoles(user.roles || [user.role]);
                setIsRoleEditDialogOpen(true);
              }}
              title="Manage Roles"
            >
              <Shield className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
                setIsPermissionsDialogOpen(true);
              }}
              title="View Permissions"
            >
              <Key className="h-3 w-3" />
            </Button>

            <div className="flex items-center space-x-2 border-l border-neutral-200 dark:border-neutral-700 pl-2 ml-2">
              <Switch
                checked={user.isSuspended}
                onCheckedChange={async (checked) => {
                  try {
                    setUsers(prevUsers =>
                      prevUsers.map(u =>
                        u.id === user.id
                          ? { ...u, isSuspended: checked }
                          : u
                      )
                    );

                    const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isSuspended: checked })
                    });

                    if (!res.ok) {
                      setUsers(prevUsers =>
                        prevUsers.map(u =>
                          u.id === user.id
                            ? { ...u, isSuspended: !checked }
                            : u
                        )
                      );
                      throw new Error('Failed to update suspension');
                    }
                    toast({
                      title: 'Success',
                      description: `User ${checked ? 'suspended' : 'unsuspended'} successfully`,
                      variant: 'success',
                    });
                  } catch {
                    toast({
                      title: 'Error',
                      description: 'Failed to update suspension',
                      variant: 'destructive',
                    });
                  }
                }}
                id={`suspend-switch-${user.id}`}
                disabled={user.id === currentUserId}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(user);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(user);
                }}
                disabled={user.id === currentUserId}
                className={user.id === currentUserId ? "cursor-not-allowed" : "cursor-allowed"}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        );
      }
    }
  ], [currentUserId, subscriptionPlans, toast, setUsers, openEditDialog, openDeleteDialog, roleOptions]);

  useEffect(() => {
    fetchUsers();
    loadSubscriptionPlans();
    loadRoleOptions();
    // Get current user id
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        setCurrentUserId(data?.user?.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, [fetchUsers, loadSubscriptionPlans, loadRoleOptions]);

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex justify-end items-center">      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => resetForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with specified role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>              <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'admin' | 'user' }))}
                options={roleOptions}
                placeholder="Select role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>) : (
            <>
              <DataTable
                columns={userColumns}
                data={users}
                searchable={true}
                columnSearch={true}
                pagination={true}
                export={true}
                selectable={true}
                title="Users"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-neutral-50 dark:bg-neutral-800"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subscription-plan">Subscription Plan</Label>
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                options={[
                  { value: '', label: 'No Subscription' },
                  ...subscriptionPlans
                    .filter(plan => plan.isActive)
                    .map(plan => ({
                      value: plan.id,
                      label: `${plan.name} - $${plan.price}/${plan.billingCycle}`
                    }))
                ]}
                placeholder="Select subscription plan"
              />
              {selectedUser?.subscriptionName && (
                <div className="text-sm text-neutral-500">
                  Current: {selectedUser.subscriptionName} ({selectedUser.subscriptionBillingCycle})
                </div>
              )}
            </div><div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean | "indeterminate") => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                disabled={selectedUser?.id === currentUserId}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-verified"
                checked={formData.isEmailVerified}
                onCheckedChange={(checked: boolean | "indeterminate") => setFormData(prev => ({ ...prev, isEmailVerified: !!checked }))}
              />
              <Label htmlFor="edit-verified">Email Verified</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Roles Dialog */}
      <Dialog open={isRoleEditDialogOpen} onOpenChange={setIsRoleEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              Select roles for {selectedUserForRoles?.name || selectedUserForRoles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              {roleOptions.map((roleOption) => (
                <div key={roleOption.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`role-${roleOption.value}`}
                    checked={selectedRoles.includes(roleOption.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles([...selectedRoles, roleOption.value]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== roleOption.value));
                      }
                    }}
                  />
                  <label
                    htmlFor={`role-${roleOption.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                  >
                    {roleOption.value === 'admin' ? (
                      <Shield className="h-4 w-4 mr-2" />
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    {roleOption.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Please select at least one role
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (selectedUserForRoles && selectedRoles.length > 0) {
                  await updateUserRoles(selectedUserForRoles.id, selectedRoles);
                  setIsRoleEditDialogOpen(false);
                }
              }}
              disabled={selectedRoles.length === 0}
            >
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              {selectedUser?.id === currentUserId
                ? "You cannot delete your own account."
                : "Are you sure you want to delete this user? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                <div className="font-medium">{selectedUser.name || 'No name'}</div>
                <div className="text-sm text-neutral-500">{selectedUser.email}</div>
                <div className="text-sm text-neutral-500">Role: {selectedUser.role}</div>
                {selectedUser.id === currentUserId && (
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    This is your current account
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteUser}
              disabled={selectedUser?.id === currentUserId}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-800">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
            <DialogDescription>
              Effective access rights for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && <UserPermissionViewer userId={selectedUser.id} />}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPermissionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
