/**
 * Configuration Helper Functions
 * This file provides convenient helper functions to access configuration values
 */

import { APP_CONFIG, isDevelopment, isProduction, isTest, validateConfig } from './constants';

// Validation function for required environment variables
export { validateConfig };

// Environment helpers
export { isDevelopment, isProduction, isTest };

// App information helpers
/**
 * Get the application name from the configuration.
 * @returns {string} Application name.
 */
export const getAppName = () => APP_CONFIG.APP_NAME;

/**
 * Get the application description from the configuration.
 * @returns {string} Application description.
 */
export const getAppDescription = () => APP_CONFIG.APP_DESCRIPTION;

/**
 * Get the application version from the configuration.
 * @returns {string} Application version.
 */
export const getAppVersion = () => APP_CONFIG.APP_VERSION;

/**
 * Get the application URL from the configuration.
 * @returns {string} Application URL.
 */
export const getAppUrl = () => APP_CONFIG.APP_URL;

// Company information helpers
/**
 * Get the company name from the configuration.
 * @returns {string} Company name.
 */
export const getCompanyName = () => APP_CONFIG.COMPANY_NAME;

/**
 * Get the company URL from the configuration.
 * @returns {string} Company URL.
 */
export const getCompanyUrl = () => APP_CONFIG.COMPANY_URL;

/**
 * Get the company logo path from the configuration.
 * @returns {string} Company logo path.
 */
export const getCompanyLogo = () => APP_CONFIG.COMPANY_LOGO;

// Route helpers
/**
 * Get a specific route by its key.
 * @param {keyof typeof APP_CONFIG.ROUTES} routeKey - The key of the route to retrieve.
 * @returns {string} The route path.
 */
export const getRoute = (routeKey: keyof typeof APP_CONFIG.ROUTES) => APP_CONFIG.ROUTES[routeKey];

/**
 * Get all routes from the configuration.
 * @returns {object} All routes.
 */
export const getAllRoutes = () => APP_CONFIG.ROUTES;

// Message helpers
export const getSuccessMessage = (messageKey: keyof typeof APP_CONFIG.MESSAGES.SUCCESS) => 
  APP_CONFIG.MESSAGES.SUCCESS[messageKey];

export const getErrorMessage = (messageKey: keyof typeof APP_CONFIG.MESSAGES.ERROR) => 
  APP_CONFIG.MESSAGES.ERROR[messageKey];

// Feature flag helpers
export const isFeatureEnabled = (featureKey: keyof typeof APP_CONFIG.FEATURES) => 
  APP_CONFIG.FEATURES[featureKey];

// Email configuration helpers
export const getEmailConfig = () => APP_CONFIG.EMAIL;

// Social auth helpers
export const getSocialAuthConfig = (provider: 'GITHUB' | 'GOOGLE' | 'FACEBOOK' | 'MICROSOFT') => 
  APP_CONFIG[provider];

// Admin configuration helpers
export const getAdminConfig = () => APP_CONFIG.ADMIN;

// UI configuration helpers
export const getUIConfig = () => APP_CONFIG.UI;

// API configuration helpers
export const getAPIConfig = () => APP_CONFIG.API;

// Navigation helpers
export const getNavigationItems = () => APP_CONFIG.NAVIGATION.MAIN;

// Complete configuration export
export { APP_CONFIG };

// Type exports
export type { AppConfig, RouteKey, MessageType, MessageCategory } from './constants';
