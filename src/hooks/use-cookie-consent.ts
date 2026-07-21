import { useState, useEffect, useCallback } from 'react';

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: string;
}

const CURRENT_CONSENT_VERSION = '1.0';

/**
 * Sync consent state to the server-side HttpOnly cookie via API.
 * This allows middleware, SSR, and API routes to read consent.
 */
async function syncConsentToServer(consent: CookieConsent): Promise<void> {
  try {
    await fetch('/api/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consent),
    });
  } catch (error) {
    // Non-critical: server cookie sync failure shouldn't break the UI
    console.warn('[Cookie Consent] Failed to sync consent to server:', error);
  }
}

/**
 * Fetch consent from the server-side cookie (for hydration when localStorage is empty).
 */
async function fetchServerConsent(): Promise<CookieConsent | null> {
  try {
    const response = await fetch('/api/cookie-consent', { method: 'GET' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.consent || null;
  } catch {
    return null;
  }
}

/**
 * Withdraw consent by clearing the server-side cookie.
 */
async function withdrawServerConsent(): Promise<void> {
  try {
    await fetch('/api/cookie-consent', { method: 'DELETE' });
  } catch (error) {
    console.warn('[Cookie Consent] Failed to withdraw server consent:', error);
  }
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage, falling back to server cookie
  const loadConsent = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      // First try localStorage (fastest)
      const savedConsent = localStorage.getItem('cookieConsent');
      if (savedConsent) {
        const parsed: CookieConsent = JSON.parse(savedConsent);

        // Check if consent version is outdated — re-show banner if so
        if (parsed.version !== CURRENT_CONSENT_VERSION) {
          console.log('[Cookie Consent] Version outdated, requesting re-consent');
          localStorage.removeItem('cookieConsent');
          await withdrawServerConsent();
          setConsent(null);
          return;
        }

        setConsent(parsed);
        return;
      }

      // Fallback: try server cookie (e.g., user cleared browser cache but cookie remains)
      const serverConsent = await fetchServerConsent();
      if (serverConsent) {
        // Re-hydrate localStorage from server
        localStorage.setItem('cookieConsent', JSON.stringify(serverConsent));
        setConsent(serverConsent);
        return;
      }

      // No consent found anywhere — banner will show
    } catch (error) {
      console.error('[Cookie Consent] Error loading consent:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save consent to both localStorage and server cookie
  const saveConsent = useCallback((newConsent: Partial<CookieConsent>) => {
    if (typeof window === 'undefined') return false;

    try {
      const consentData: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        preferences: false,
        ...newConsent,
        timestamp: new Date().toISOString(),
        version: CURRENT_CONSENT_VERSION,
      };

      // Save to localStorage (synchronous, immediate)
      localStorage.setItem('cookieConsent', JSON.stringify(consentData));
      setConsent(consentData);

      // Sync to server cookie (async, non-blocking)
      syncConsentToServer(consentData);

      // Apply consent cookies to document for client-side reading
      applyConsentCookies(consentData);

      // Dispatch event for other components (analytics, marketing, etc.)
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
        detail: consentData,
      }));

      return true;
    } catch (error) {
      console.error('[Cookie Consent] Error saving consent:', error);
      return false;
    }
  }, []);

  // Check if user has given consent for a specific cookie type
  const hasConsent = useCallback(
    (type: keyof Omit<CookieConsent, 'timestamp' | 'version'>) => {
      return consent?.[type] || false;
    },
    [consent]
  );

  // Check if consent banner should be shown
  const shouldShowBanner = useCallback(() => {
    return !consent;
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
      preferences: true,
    });
  }, [saveConsent]);

  // Reject all non-essential cookies
  const rejectAll = useCallback(() => {
    return saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }, [saveConsent]);

  // Update specific consent
  const updateConsent = useCallback(
    (updates: Partial<CookieConsent>) => {
      if (!consent) return false;
      return saveConsent({ ...consent, ...updates });
    },
    [consent, saveConsent]
  );

  // Withdraw all consent (clears both localStorage and server cookie)
  const withdrawConsent = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('cookieConsent');
    setConsent(null);
    withdrawServerConsent();

    // Remove all consent-specific document cookies
    removeAllConsentCookies();

    window.dispatchEvent(new CustomEvent('cookieConsentWithdrawn'));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    loadConsent();

    // Listen for consent updates from other components
    const handleConsentUpdate = (event: CustomEvent) => {
      setConsent(event.detail);
    };

    window.addEventListener(
      'cookieConsentUpdated',
      handleConsentUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        'cookieConsentUpdated',
        handleConsentUpdate as EventListener
      );
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
    withdrawConsent,
    loadConsent,
  };
};

// ============================================================================
// UTILITY FUNCTIONS (for use outside React components)
// ============================================================================

/**
 * Get cookie consent without hook (for use in non-component contexts).
 */
export const getCookieConsent = (): CookieConsent | null => {
  try {
    const savedConsent = localStorage.getItem('cookieConsent');
    return savedConsent ? JSON.parse(savedConsent) : null;
  } catch (error) {
    console.error('[Cookie Consent] Error getting consent:', error);
    return null;
  }
};

/**
 * Check specific consent type without hook.
 */
export const hasCookieConsent = (
  type: keyof Omit<CookieConsent, 'timestamp' | 'version'>
): boolean => {
  const consent = getCookieConsent();
  return consent?.[type] || false;
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Set lightweight document cookies that client-side code can read
 * (e.g., `analytics_consent=true`) for quick checks without parsing localStorage.
 */
function applyConsentCookies(consent: CookieConsent): void {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  const cookieOptions = `path=/;max-age=${maxAge};SameSite=Strict`;

  document.cookie = `essential_consent=true;${cookieOptions}`;

  if (consent.analytics) {
    document.cookie = `analytics_consent=true;${cookieOptions}`;
  } else {
    document.cookie = `analytics_consent=;path=/;max-age=0`;
  }

  if (consent.marketing) {
    document.cookie = `marketing_consent=true;${cookieOptions}`;
  } else {
    document.cookie = `marketing_consent=;path=/;max-age=0`;
  }

  if (consent.preferences) {
    document.cookie = `preferences_consent=true;${cookieOptions}`;
  } else {
    document.cookie = `preferences_consent=;path=/;max-age=0`;
  }
}

/**
 * Remove all consent-related document cookies when consent is withdrawn.
 */
function removeAllConsentCookies(): void {
  const cookiesToRemove = [
    'essential_consent',
    'analytics_consent',
    'marketing_consent',
    'preferences_consent',
    'pref_theme',
    'pref_language',
    'pref_sidebar_state',
  ];

  for (const name of cookiesToRemove) {
    document.cookie = `${name}=;path=/;max-age=0`;
  }
}
