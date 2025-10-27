"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use refs to track fetch state and prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Stable fetch function that doesn't change on every render
  const fetchSubscriptionStatus = useCallback(async (userId: string) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('[SubscriptionContext] Fetch already in progress, skipping...');
      return;
    }

    // If user hasn't changed and we've already fetched, skip
    if (hasFetchedRef.current && currentUserIdRef.current === userId) {
      console.log('[SubscriptionContext] Data already fetched for this user, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      
      // Use standard fetch - duplicates are now prevented by refs
      const response = await fetch('/api/user/subscription-status');
      const data = await response.json() as { success: boolean; data: SubscriptionStatus };
      
      if (data.success) {
        setSubscriptionStatus(data.data);
      } else {
        setSubscriptionStatus({ hasSubscription: false });
      }
      
      hasFetchedRef.current = true;
      currentUserIdRef.current = userId;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus({ hasSubscription: false });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []); // ← Empty deps! Function is stable

  // Fetch subscription status once when authenticated
  useEffect(() => {
    const userId = session?.user?.id;
    
    if (status === 'authenticated' && userId) {
      // Check if we need to fetch for a different user
      if (currentUserIdRef.current !== userId) {
        hasFetchedRef.current = false;
      }
      
      fetchSubscriptionStatus(userId);
    } else if (status === 'unauthenticated') {
      setSubscriptionStatus(null);
      setIsLoading(false);
      hasFetchedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [status, session?.user?.id, fetchSubscriptionStatus]); // fetchSubscriptionStatus is now stable

  const refreshSubscription = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    
    // Force a refresh by resetting the fetch flag
    hasFetchedRef.current = false;
    await fetchSubscriptionStatus(userId);
  }, [session?.user?.id, fetchSubscriptionStatus]);

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
