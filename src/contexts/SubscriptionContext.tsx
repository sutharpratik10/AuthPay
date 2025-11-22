"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { swrConfigFrequent } from '@/lib/swr-config';

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
  refreshSubscription: async () => { },
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // Memoize the SWR key to prevent unnecessary re-fetches
  const swrKey = useMemo(() => {
    return status === 'authenticated' && userId ? '/api/user/subscription-status' : null;
  }, [status, userId]);

  // Use SWR for automatic caching and revalidation
  // Explicitly pass the fetcher to ensure consistency
  const { data, isLoading, mutate } = useSWR(
    swrKey,
    {
      ...swrConfigFrequent,
      // Ensure fetcher is explicitly defined
      fetcher: swrConfigFrequent.fetcher,
    }
  );

  const subscriptionStatus: SubscriptionStatus | null = data?.success
    ? data.data
    : { hasSubscription: false };

  const refreshSubscription = async () => {
    await mutate();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus: status === 'authenticated' ? subscriptionStatus : null,
        isLoading: status === 'loading' || isLoading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
