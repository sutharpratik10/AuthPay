'use client';

import React, { createContext, useContext } from 'react';
import { useNotificationStream, AppNotification } from '@/hooks/use-notification-stream';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ 
  children,
  initialEndpoint = '/api/user/notifications/stream'
}: { 
  children: React.ReactNode,
  initialEndpoint?: string
}) {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsReadLocal, 
    markAllAsReadLocal 
  } = useNotificationStream(initialEndpoint);

  const markAsRead = async (id: string) => {
    try {
      // Assuming you create a route for marking read
      await fetch(`/api/user/notifications/${id}/read`, { method: 'POST' });
      markAsReadLocal(id);
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/user/notifications/read-all`, { method: 'POST' });
      markAllAsReadLocal();
    } catch (e) {
      console.error('Failed to mark all notifications as read', e);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
