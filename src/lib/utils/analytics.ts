import { hasCookieConsent } from '@/hooks/use-cookie-consent';

// ============================================================================
// ANALYTICS (gated by analytics consent)
// ============================================================================

/**
 * Initialize Google Analytics — only when analytics consent is granted.
 */
export const initializeAnalytics = () => {
  if (typeof window === 'undefined') return;

  if (!hasCookieConsent('analytics')) {
    console.log('[Analytics] Disabled: no consent given');
    return;
  }

  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!GA_MEASUREMENT_ID) {
    console.warn('[Analytics] GA_MEASUREMENT_ID not found in environment variables');
    return;
  }

  // Prevent double-initialization
  if (document.querySelector(`script[src*="googletagmanager"]`)) {
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    cookie_flags: 'secure;samesite=strict',
    anonymize_ip: true,
  });

  console.log('[Analytics] Google Analytics initialized');
};

/**
 * Track page views (only if analytics consent is given).
 */
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined') return;
  if (!hasCookieConsent('analytics')) return;

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events (only if analytics consent is given).
 */
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  if (!hasCookieConsent('analytics')) return;

  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

/**
 * Remove analytics cookies when consent is withdrawn.
 */
export const removeAnalyticsCookies = () => {
  if (typeof window === 'undefined') return;

  const gaCookies = ['_ga', '_gat', '_gid'];
  gaCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });

  // Remove the GA script tag to fully disable
  const gaScript = document.querySelector(`script[src*="googletagmanager"]`);
  if (gaScript) gaScript.remove();

  console.log('[Analytics] Cookies and scripts removed');
};

// ============================================================================
// MARKETING (gated by marketing consent)
// ============================================================================

/**
 * Initialize marketing pixels — only when marketing consent is granted.
 */
export const initializeMarketing = () => {
  if (typeof window === 'undefined') return;

  if (!hasCookieConsent('marketing')) {
    console.log('[Marketing] Disabled: no consent given');
    return;
  }

  // Facebook Pixel
  const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  if (FACEBOOK_PIXEL_ID) {
    // Prevent double-initialization
    if (window.fbq) return;

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FACEBOOK_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    console.log('[Marketing] Facebook Pixel initialized');
  }
};

/**
 * Remove marketing cookies when consent is withdrawn.
 */
export const removeMarketingCookies = () => {
  if (typeof window === 'undefined') return;

  const fbCookies = ['_fbp', '_fbc'];
  fbCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });

  console.log('[Marketing] Cookies removed');
};

// ============================================================================
// PREFERENCES (gated by preferences consent)
// ============================================================================

/**
 * Initialize preference cookies — sets lightweight document cookies that
 * allow the server/middleware to render personalized content before JS hydration.
 * This avoids FOUC (Flash of Unstyled Content) for theme/language.
 */
export const initializePreferences = () => {
  if (typeof window === 'undefined') return;

  if (!hasCookieConsent('preferences')) {
    console.log('[Preferences] Disabled: no consent given');
    return;
  }

  const maxAge = 365 * 24 * 60 * 60;
  const cookieOptions = `path=/;max-age=${maxAge};SameSite=Strict`;

  // Persist current theme as a cookie (next-themes stores in localStorage)
  const theme = localStorage.getItem('theme') || 'system';
  document.cookie = `pref_theme=${theme};${cookieOptions}`;

  // Persist language preference if available
  const language = document.documentElement.lang || 'en';
  document.cookie = `pref_language=${language};${cookieOptions}`;

  // Persist sidebar state if available
  const sidebarState = localStorage.getItem('sidebar:state');
  if (sidebarState) {
    document.cookie = `pref_sidebar_state=${sidebarState};${cookieOptions}`;
  }

  console.log('[Preferences] Cookies initialized');
};

/**
 * Remove preference cookies when consent is withdrawn.
 */
export const removePreferenceCookies = () => {
  if (typeof window === 'undefined') return;

  const prefCookies = ['pref_theme', 'pref_language', 'pref_sidebar_state'];
  prefCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  console.log('[Preferences] Cookies removed');
};

// ============================================================================
// CONSENT CHANGE LISTENERS
// ============================================================================

/**
 * Set up listeners that react to consent changes in real-time.
 * When consent is granted → initialize the corresponding scripts/cookies.
 * When consent is withdrawn → clean up cookies and scripts.
 */
export const setupConsentListeners = () => {
  if (typeof window === 'undefined') return;

  // Listen for consent updates
  window.addEventListener('cookieConsentUpdated', (event: Event) => {
    const customEvent = event as CustomEvent;
    const consent = customEvent.detail;

    // Analytics
    if (consent.analytics) {
      initializeAnalytics();
    } else {
      removeAnalyticsCookies();
    }

    // Marketing
    if (consent.marketing) {
      initializeMarketing();
    } else {
      removeMarketingCookies();
    }

    // Preferences
    if (consent.preferences) {
      initializePreferences();
    } else {
      removePreferenceCookies();
    }
  });

  // Listen for full consent withdrawal
  window.addEventListener('cookieConsentWithdrawn', () => {
    removeAnalyticsCookies();
    removeMarketingCookies();
    removePreferenceCookies();
  });
};

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
