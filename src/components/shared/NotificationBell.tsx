'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected, subscribeToPushNotifications, disablePushNotifications, isPushSupported, isPushEnabled } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-yellow-500 border border-background"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs h-auto py-1 px-2">
                Mark all read
              </Button>
            )}
            {isPushSupported && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={isPushEnabled ? disablePushNotifications : subscribeToPushNotifications} 
                className="text-[10px] h-6 px-2"
              >
                {isPushEnabled ? 'Disable Push' : 'Enable Push'}
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${n.isRead ? 'opacity-70' : 'bg-muted/20'}`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
