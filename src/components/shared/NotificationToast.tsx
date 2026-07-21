'use client';

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

export function NotificationToast() {
  const { notifications } = useNotifications();
  const { toast } = useToast();
  const lastProcessedId = useRef<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      
      // Initialize on first render
      if (lastProcessedId.current === null) {
        lastProcessedId.current = latest.id;
        return;
      }

      if (latest.id !== lastProcessedId.current && !latest.isRead) {
        lastProcessedId.current = latest.id;
        toast({
          title: latest.title,
          description: latest.content,
          variant: latest.type === 'error' ? 'destructive' : 'default',
        });
      }
    }
  }, [notifications, toast]);

  return null;
}
