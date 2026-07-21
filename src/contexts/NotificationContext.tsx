'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificationStream, AppNotification } from '@/hooks/use-notification-stream';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToPushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  isPushSupported: boolean;
  isPushEnabled: boolean;
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

  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsPushEnabled(!!subscription);
        });
      });
    }
  }, []);

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported by the browser.');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied.');
        return false;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not found in env.');
        return false;
      }

      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      const res = await fetch('/api/user/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        setIsPushEnabled(true);
      }
      return res.ok;
    } catch (e) {
      console.error('Failed to subscribe to push notifications', e);
      return false;
    }
  };

  const disablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Send to server to remove
        const res = await fetch('/api/user/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        if (res.ok) {
          // Unsubscribe locally
          await subscription.unsubscribe();
          setIsPushEnabled(false);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to disable push notifications', e);
      return false;
    }
  };

  const isPushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      markAsRead,
      markAllAsRead,
      subscribeToPushNotifications,
      disablePushNotifications,
      isPushSupported,
      isPushEnabled
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
