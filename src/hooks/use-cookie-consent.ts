import { useState, useEffect, useCallback } from 'react';

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: string;
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage
  const loadConsent = useCallback(() => {
    if (typeof window === 'undefined') {
      console.log('Window not available, skipping consent load');
      setIsLoading(false);
      return;
    }
    
    try {
      const savedConsent = localStorage.getItem('cookieConsent');
      console.log('Loading consent from localStorage:', savedConsent);
      if (savedConsent) {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((newConsent: Partial<CookieConsent>) => {
    if (typeof window === 'undefined') {
      console.log('Window not available, skipping consent save');
      return false;
    }
    
    try {
      const consentData: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        preferences: false,
        ...newConsent,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('cookieConsent', JSON.stringify(consentData));
      setConsent(consentData);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
        detail: consentData 
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      return false;
    }
  }, []);

  // Check if user has given consent for a specific cookie type
  const hasConsent = useCallback((type: keyof Omit<CookieConsent, 'timestamp' | 'version'>) => {
    return consent?.[type] || false;
  }, [consent]);

  // Check if consent banner should be shown
  const shouldShowBanner = useCallback(() => {
    const show = !consent;
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('shouldShowBanner:', { consent, show });
    }
    return show;
  }, [consent]);

  // Get analytics consent specifically (commonly used)
  const hasAnalyticsConsent = useCallback(() => {
    return hasConsent('analytics');
  }, [hasConsent]);

  // Get marketing consent specifically (commonly used)
  const hasMarketingConsent = useCallback(() => {
    return hasConsent('marketing');
  }, [hasConsent]);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    return saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  }, [saveConsent]);

  // Reject all non-essential cookies
  const rejectAll = useCallback(() => {
    return saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  }, [saveConsent]);

  // Update specific consent
  const updateConsent = useCallback((updates: Partial<CookieConsent>) => {
    if (!consent) return false;
    
    return saveConsent({
      ...consent,
      ...updates
    });
  }, [consent, saveConsent]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    loadConsent();
    
    // Listen for consent updates from other components
    const handleConsentUpdate = (event: CustomEvent) => {
      setConsent(event.detail);
    };
    
    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, [loadConsent]);

  return {
    consent,
    isLoading,
    hasConsent,
    shouldShowBanner,
    hasAnalyticsConsent,
    hasMarketingConsent,
    saveConsent,
    acceptAll,
    rejectAll,
    updateConsent,
    loadConsent
  };
};

// Utility function to check cookie consent without hook (for use in non-component contexts)
export const getCookieConsent = (): CookieConsent | null => {
  try {
    const savedConsent = localStorage.getItem('cookieConsent');
    return savedConsent ? JSON.parse(savedConsent) : null;
  } catch (error) {
    console.error('Error getting cookie consent:', error);
    return null;
  }
};

// Utility function to check specific consent type
export const hasCookieConsent = (type: keyof Omit<CookieConsent, 'timestamp' | 'version'>): boolean => {
  const consent = getCookieConsent();
  return consent?.[type] || false;
};
