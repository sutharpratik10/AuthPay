import { SWRConfiguration } from 'swr';

/**
 * Default fetcher function for SWR
 * Used by all SWR hooks unless overridden
 */
const defaultFetcher = async (url: string) => {
    const res = await fetch(url, {
        credentials: 'include', // Important for session cookies
    });

    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        throw error;
    }

    return res.json();
};

/**
 * Global SWR configuration for optimal performance
 */
export const swrConfig: SWRConfiguration = {
    // Revalidation settings
    revalidateOnFocus: false, // Don't revalidate when window regains focus
    revalidateOnReconnect: false, // Don't revalidate on network reconnect
    revalidateOnMount: true, // Only revalidate on mount if data is stale
    dedupingInterval: 60000, // Dedupe requests within 60 seconds (1 minute)

    // Error retry settings
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // Cache settings
    shouldRetryOnError: true,
    
    // Prevent redundant requests
    revalidateIfStale: false, // Don't revalidate if data exists and is not stale
    
    // Keep previous data while revalidating
    keepPreviousData: true,

    // Default fetcher
    fetcher: defaultFetcher,
};

/**
 * SWR config for frequently changing data (e.g., subscription status)
 */
export const swrConfigFrequent: SWRConfiguration = {
    ...swrConfig,
    dedupingInterval: 30000, // 30 seconds for frequently changing data
    revalidateIfStale: true, // Allow revalidation for frequently changing data
};

/**
 * SWR config for rarely changing data (e.g., admin status, user validation)
 */
export const swrConfigRare: SWRConfiguration = {
    ...swrConfig,
    dedupingInterval: 300000, // 5 minutes for rarely changing data
    revalidateIfStale: false, // Don't revalidate unless explicitly requested
};
