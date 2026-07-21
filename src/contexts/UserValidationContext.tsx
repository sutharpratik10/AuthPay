"use client";

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import useSWR from 'swr';
import { swrConfigRare } from '@/lib/swr-config';

interface UserData {
    isAdmin: boolean;
    exists: boolean;
    shouldSignOut: boolean;
}

interface UserDataResponse {
    success: boolean;
    data: UserData;
}

interface UserValidationContextType {
    isAdmin: boolean;
    exists: boolean;
    shouldSignOut: boolean;
    isLoading: boolean;
    isValidating: boolean;
    error: Error | null;
}

const UserValidationContext = createContext<UserValidationContextType>({
    isAdmin: false,
    exists: true,
    shouldSignOut: false,
    isLoading: true,
    isValidating: false,
    error: null,
});

/**
 * Hook to access user validation data throughout the application
 * This provides centralized user validation without needing to call APIs in each component
 */
export function useUserValidation() {
    return useContext(UserValidationContext);
}

/**
 * Global User Validation Provider
 * 
 * This provider:
 * - Validates user existence and role in ONE place
 * - Uses the unified /api/user/data endpoint
 * - Automatically signs out invalid users
 * - Provides user data to all child components
 * - Eliminates need for individual validation in routes/components
 * 
 * Usage: Wrap your app with this provider in the layout
 */
export function UserValidationProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    // Memoize the SWR key to prevent unnecessary re-fetches
    const swrKey = useMemo(() => {
        return status === 'authenticated' && userId ? '/api/user/data' : null;
    }, [status, userId]);

    // Use SWR to fetch and cache user validation data
    // Force immediate fetch on mount to avoid race conditions with sidebar rendering
    const { data, error, isLoading, isValidating } = useSWR<UserDataResponse>(
        swrKey,
        {
            ...swrConfigRare,
            // Ensure fetcher is explicitly defined
            fetcher: swrConfigRare.fetcher,
            // IMPORTANT: Fetch immediately on mount and revalidate to ensure fresh data after login
            revalidateOnMount: true,
            revalidateIfStale: true,
            // Disable deduping on initial mount to ensure fresh data after login
            dedupingInterval: 0,
        }
    );

    // Extract user data with safe defaults
    const userData: UserData = data?.success 
        ? data.data 
        : {
            isAdmin: false,
            exists: true, // Default to true while loading to avoid premature sign-out
            shouldSignOut: false,
        };

    // Debug logging
    // console.log('[UserValidationContext] Data:', {
    //     swrKey,
    //     dataSuccess: data?.success,
    //     userData,
    //     isLoading,
    //     isValidating,
    //     hasError: !!error
    // });

    // Automatically sign out users who don't exist or should be signed out
    useEffect(() => {
        if (
            status === 'authenticated' && 
            data?.success && 
            userData.shouldSignOut && 
            !userData.exists
        ) {
            console.log('[UserValidation] User validation failed - signing out');
            signOut({ 
                callbackUrl: '/auth/signin',
                redirect: true 
            });
        }
    }, [status, data?.success, userData.shouldSignOut, userData.exists]);

    const contextValue: UserValidationContextType = {
        isAdmin: userData.isAdmin,
        exists: userData.exists,
        shouldSignOut: userData.shouldSignOut,
        // Consider loading state from both session and SWR
        // This ensures we wait for both authentication AND user data fetch
        isLoading: status === 'loading' || (status === 'authenticated' && isLoading),
        isValidating,
        error,
    };

    return (
        <UserValidationContext.Provider value={contextValue}>
            {children}
        </UserValidationContext.Provider>
    );
}
