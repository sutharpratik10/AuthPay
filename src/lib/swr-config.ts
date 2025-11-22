import { SWRConfiguration } from 'swr';

/**
 * Global SWR configuration for optimal performance
 */
export const swrConfig: SWRConfiguration = {
    // Revalidation settings
    revalidateOnFocus: false, // Don't revalidate when window regains focus
    revalidateOnReconnect: false, // Don't revalidate on network reconnect
    dedupingInterval: 60000, // Dedupe requests within 60 seconds

    // Error retry settings
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // Cache settings
    shouldRetryOnError: true,

    // Default fetcher
    fetcher: async (url: string) => {
        const res = await fetch(url);

        if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            throw error;
        }

        return res.json();
    },
};

/**
 * SWR config for frequently changing data (e.g., subscription status)
 */
export const swrConfigFrequent: SWRConfiguration = {
    ...swrConfig,
    dedupingInterval: 30000, // 30 seconds for frequently changing data
};

/**
 * SWR config for rarely changing data (e.g., admin status, user validation)
 */
export const swrConfigRare: SWRConfiguration = {
    ...swrConfig,
    dedupingInterval: 300000, // 5 minutes for rarely changing data
};
