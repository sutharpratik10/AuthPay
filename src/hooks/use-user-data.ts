import { useUserValidation } from '@/contexts/UserValidationContext';

/**
 * Hook to fetch all user data in a single API call
 * This is now a re-export of useUserValidation from the context
 * 
 * @deprecated Use useUserValidation from @/contexts/UserValidationContext instead
 * This hook is kept for backward compatibility
 */
export function useUserData() {
    return useUserValidation();
}
