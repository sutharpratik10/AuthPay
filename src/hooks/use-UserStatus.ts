import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { swrConfigRare } from '@/lib/swr-config';

interface UserStatusResponse {
    success: boolean;
    data: {
        isAdmin: boolean;
    };
}

/**
 * Hook to check if the current user has admin privileges
 * Uses SWR for caching with 5-minute deduplication
 */
export function useUserStatus() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const { data, error, isLoading } = useSWR<UserStatusResponse>(
        userId ? '/api/user/admin-status' : null,
        swrConfigRare
    );

    return {
        isAdmin: data?.success ? data.data.isAdmin : false,
        isLoading,
        error,
    };
}
