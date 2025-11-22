import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { swrConfigRare } from '@/lib/swr-config';

interface UserValidationResponse {
    exists: boolean;
    shouldSignOut: boolean;
}

/**
 * Hook to validate if user exists in database
 * Uses SWR for caching with 5-minute deduplication
 */
export function useUserValidation() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const { data, error, isLoading } = useSWR<UserValidationResponse>(
        userId ? ['/api/auth/validate-user', userId] : null,
        async ([url, id]) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id }),
                credentials: 'include',
            });

            if (!res.ok) {
                return { exists: false, shouldSignOut: true };
            }

            const data = await res.json();
            return {
                exists: data.exists === true,
                shouldSignOut: data.shouldSignOut === true,
            };
        },
        swrConfigRare
    );

    return {
        exists: data?.exists ?? true, // Default to true while loading
        shouldSignOut: data?.shouldSignOut ?? false,
        isLoading,
        error,
    };
}
