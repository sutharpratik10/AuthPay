'use client';

import { useEffect, useState } from 'react';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function AdminNotificationPanel() {
  const { notifications, isConnected } = useNotificationStream('/api/admin/notifications/stream');

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">System Alerts</CardTitle>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
              Reconnecting...
            </Badge>
          )}
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent alerts
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm">{n.title}</p>
                    {n.priority && (
                      <Badge variant={getPriorityColor(n.priority) as any} className="text-[10px] px-1.5 py-0 uppercase">
                        {n.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
