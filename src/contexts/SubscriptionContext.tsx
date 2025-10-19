"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  planName?: string;
  status?: string;
  price?: string;
  billingCycle?: string;
  expiryDate?: string;
  isActive?: boolean;
  razorpaySubscriptionId?: string;
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscriptionStatus: null,
  isLoading: true,
  refreshSubscription: async () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setSubscriptionStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/subscription-status');
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionStatus(data.data);
      } else {
        setSubscriptionStatus({ hasSubscription: false });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus({ hasSubscription: false });
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [session?.user?.id]);

  // Fetch subscription status once when authenticated
  useEffect(() => {
    if (status === 'authenticated' && !hasFetched) {
      fetchSubscriptionStatus();
    } else if (status === 'unauthenticated') {
      setSubscriptionStatus(null);
      setIsLoading(false);
      setHasFetched(false);
    }
  }, [status, hasFetched, fetchSubscriptionStatus]);

  const refreshSubscription = useCallback(async () => {
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        isLoading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
