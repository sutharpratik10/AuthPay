'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TablePagination } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Key, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export function RBACActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  const fetchLogs = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/rbac-audit?page=${page}&limit=15`);
      const json = await res.json();

      if (json.success) {
        setLogs(json.data.logs);
        setTotalPages(json.data.pagination.pages);
        setTotalItems(json.data.pagination.total);
      } else {
        throw new Error(json.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load RBAC activity logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [fetchLogs, currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('role')) return <Shield className="h-4 w-4 text-blue-500" />;
    if (action.includes('permission')) return <Key className="h-4 w-4 text-amber-500" />;
    return <Clock className="h-4 w-4 text-neutral-500" />;
  };

  return (
    <Card className="mt-4 border-neutral-200 dark:border-neutral-800 shadow-sm">
      <CardHeader className="bg-neutral-50/50 dark:bg-neutral-800/20 pb-4 border-b">
        <CardTitle>RBAC Activity Log</CardTitle>
        <CardDescription>
          Audit trail of role assignments and permission changes
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="flex items-center space-x-2">
                              <User className="h-3.5 w-3.5 text-neutral-400" />
                              <span className="text-sm font-medium">{log.user.name || log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400 italic">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <Badge variant="secondary" className="text-xs bg-neutral-100 dark:bg-neutral-800 font-normal">
                              {formatAction(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          <span className="font-medium">{log.entityType}</span>
                          <span className="text-neutral-400 ml-1 text-xs">({log.entityId.substring(0, 8)}...)</span>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate text-muted-foreground">
                          {log.newValues ? (
                            <span className="font-mono text-xs">{JSON.stringify(log.newValues).substring(0, 50)}{JSON.stringify(log.newValues).length > 50 ? '...' : ''}</span>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={15}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
