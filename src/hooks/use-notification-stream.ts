import { useEffect, useState, useRef, useCallback } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent'; // for admin
}

export function useNotificationStream(endpoint: string = '/api/user/notifications/stream') {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const eventSource = new EventSource(endpoint, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          setIsConnected(true);
          reconnectAttempts.current = 0;
        } else if (payload.type === 'notification' || payload.type === 'admin_notification') {
          setNotifications((prev) => [payload.data, ...prev]);
          if (payload.unreadCount !== undefined) {
            setUnreadCount(payload.unreadCount);
          } else if (payload.type === 'admin_notification') {
            // For admin notifications, if no unreadCount is given, we just bump it.
            setUnreadCount(prev => prev + 1);
          }
        } else if (payload.type === 'notifications_read') {
          setNotifications((prev) => 
            prev.map(n => n.id === payload.data.notificationId ? { ...n, isRead: true } : n)
          );
          if (payload.unreadCount !== undefined) {
            setUnreadCount(payload.unreadCount);
          }
        } else if (payload.type === 'notifications_read_all') {
          setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;
      
      // Exponential backoff
      const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, timeout);
    };
  }, [endpoint]);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const restEndpoint = endpoint.replace('/stream', '');
        const res = await fetch(restEndpoint);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial notifications:', err);
      } finally {
        if (isMounted) {
          connect();
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [endpoint, connect]);

  const markAsReadLocal = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const markAllAsReadLocal = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const setInitialData = (initialNotifications: AppNotification[], initialUnreadCount: number) => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }

  return { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsReadLocal, 
    markAllAsReadLocal,
    setInitialData
  };
}
