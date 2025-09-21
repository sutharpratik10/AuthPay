import { hasCookieConsent } from '@/hooks/use-cookie-consent';

// Google Analytics integration that respects cookie consent
export const initializeAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Check if analytics consent is given
  if (!hasCookieConsent('analytics')) {
    console.log('Analytics disabled: No consent given');
    return;
  }

  // Initialize Google Analytics (example)
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  if (!GA_MEASUREMENT_ID) {
    console.warn('GA_MEASUREMENT_ID not found in environment variables');
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

  console.log('Google Analytics initialized');
};

// Track page views (only if analytics consent is given)
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined') return;
  
  if (!hasCookieConsent('analytics')) {
    return;
  }

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events (only if analytics consent is given)
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  
  if (!hasCookieConsent('analytics')) {
    return;
  }

  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Initialize marketing pixels (only if marketing consent is given)
export const initializeMarketing = () => {
  if (typeof window === 'undefined') return;

  if (!hasCookieConsent('marketing')) {
    console.log('Marketing pixels disabled: No consent given');
    return;
  }

  // Example: Facebook Pixel
  const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  
  if (FACEBOOK_PIXEL_ID) {
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
    
    console.log('Facebook Pixel initialized');
  }
};

// Remove analytics cookies when consent is withdrawn
export const removeAnalyticsCookies = () => {
  if (typeof window === 'undefined') return;

  // Remove Google Analytics cookies
  const gaCookies = ['_ga', '_gat', '_gid'];
  gaCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });

  console.log('Analytics cookies removed');
};

// Remove marketing cookies when consent is withdrawn
export const removeMarketingCookies = () => {
  if (typeof window === 'undefined') return;

  // Remove Facebook Pixel cookies
  const fbCookies = ['_fbp', '_fbc'];
  fbCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  });

  console.log('Marketing cookies removed');
};

// Listen for consent changes and initialize/cleanup accordingly
export const setupConsentListeners = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('cookieConsentUpdated', (event: Event) => {
    const customEvent = event as CustomEvent;
    const consent = customEvent.detail;
    
    if (consent.analytics) {
      initializeAnalytics();
    } else {
      removeAnalyticsCookies();
    }
    
    if (consent.marketing) {
      initializeMarketing();
    } else {
      removeMarketingCookies();
    }
  });
};

// Type declarations for global variables
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}
