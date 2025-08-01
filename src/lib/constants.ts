/**
 * Application Configuration
 * Centralized configuration file for all static variables and constants
 */

export const APP_CONFIG = {
  // Application Information
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_DESCRIPTION: 'Modern Access Control System',
  APP_VERSION: '1.0.0',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_LOGO: '/logo.svg',
  // Company Information
  COMPANY_NAME: 'ByteLoom',
  COMPANY_URL: 'https://byteloom.com.au',
  COMPANY_LOGO: '/file.svg',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Authentication
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  
  // Social Auth Providers
  GITHUB: {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  },
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  FACEBOOK: {
    CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  },
  MICROSOFT: {
    CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  },
  
  // Admin Settings
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
    DEFAULT_TENANT: process.env.ADMIN_DEFAULT_TENANT || 'admin',
  },
  
  // Email Configuration
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT || '465'),
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
  },
  
  // UI Constants
  UI: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
  },
  
  // API Constants
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT: 100, // requests per minute
  },
  
  // Feature Flags
  FEATURES: {
    SOCIAL_LOGIN: true,
    EMAIL_VERIFICATION: true,
    TWO_FACTOR_AUTH: false,
    DARK_MODE: true,
    ANALYTICS: false,
  },
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/auth/login',
    REGISTER: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY: '/auth/verify',
    DASHBOARD: '/protected/dashboard',
    PROFILE: '/protected/profile',
    ACCOUNT: '/protected/account',
    SETTINGS: '/protected/settings',
    ADMIN: '/admin',
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
    USERS: '/users',
  },
  
  // Messages
  MESSAGES: {
    SUCCESS: {
      LOGIN: 'Successfully logged in',
      LOGOUT: 'Successfully logged out',
      CREATED: 'Successfully created',
      UPDATED: 'Successfully updated',
      DELETED: 'Successfully deleted',
      PASSWORD_CHANGED: 'Password changed successfully',
      EMAIL_VERIFIED: 'Email verified successfully',
      SETTINGS_SAVED: 'Settings saved successfully',
      CODE_SENT: 'Verification code sent to your email',
    },
    ERROR: {
      GENERIC: 'An error occurred. Please try again.',
      UNAUTHORIZED: 'You are not authorized to perform this action',
      NOT_FOUND: 'Resource not found',
      VALIDATION: 'Please check your input and try again',
      NETWORK: 'Network error. Please check your connection.',
      INVALID_CREDENTIALS: 'Invalid email or password',
      PASSWORD_MISMATCH: 'Passwords do not match',
      WEAK_PASSWORD: 'Password must be at least 8 characters long',
      INVALID_CODE: 'Invalid or expired verification code',
      EMAIL_EXISTS: 'An account with this email already exists',
    },
  },
    // Navigation Items
  NAVIGATION: {
    MAIN: [
      {
        title: "Features",
        items: [
          {
            title: "Role Management",
            description: "Create and manage user roles",
            href: "/features/roles"
          },
          {
            title: "Permissions",
            description: "Configure access permissions",
            href: "/features/permissions"
          },
          {
            title: "User Management",
            description: "Manage system users",
            href: "/features/users"
          },
          {
            title: "Analytics",
            description: "View system analytics",
            href: "/features/analytics"
          }
        ]
      },
      {
        title: "Documentation",
        href: "/docs"
      },
      {
        title: "About",
        items: [
          {
            title: "Our Story",
            description: "Learn about our journey",
            href: "/about/story"
          },
          {
            title: "Team",
            description: "Meet the people behind RoleKit",
            href: "/about/team"
          },
          {
            title: "Contact",
            description: "Get in touch with us",
            href: "/about/contact"
          }
        ]
      }
    ]
  }
} as const;

// Legacy exports for backward compatibility
export const ProjectInfo = {
  companyLogo: APP_CONFIG.COMPANY_LOGO,
  companyName: APP_CONFIG.APP_NAME
}

export const NavigationService = {
  navigationItems: APP_CONFIG.NAVIGATION.MAIN
}

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Validation function
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Type definitions
export type AppConfig = typeof APP_CONFIG;
export type RouteKey = keyof typeof APP_CONFIG.ROUTES;
export type MessageType = keyof typeof APP_CONFIG.MESSAGES;
export type MessageCategory = keyof typeof APP_CONFIG.MESSAGES.SUCCESS | keyof typeof APP_CONFIG.MESSAGES.ERROR;

// Navigation types
export interface NavigationSubItem {
  readonly title: string;
  readonly description?: string;
  readonly href: string;
}

export interface NavigationItem {
  readonly title: string;
  readonly href?: string;
  readonly items?: readonly NavigationSubItem[];
}

export type NavigationItems = readonly NavigationItem[];
