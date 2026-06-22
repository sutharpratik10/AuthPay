'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, XCircle, Mail, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

interface ErrorConfig {
  title: string;
  message: string;
  icon: React.ReactNode;
  severity: 'error' | 'warning' | 'info';
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get('error');

  const getErrorConfig = (errorCode: string | null): ErrorConfig => {
    switch (errorCode) {
      case 'AccountSuspended':
        return {
          title: 'Account Suspended',
          message: 'Your account has been suspended. Please contact our support team for assistance and further information about your account status.',
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          severity: 'error',
          actions: [
            { label: 'Contact Support', href: 'mailto:support@yourapp.com', variant: 'default' },
            { label: 'Back to Login', href: '/auth/login', variant: 'outline' }
          ]
        };
      
      case 'DatabaseUnavailable':
        return {
          title: 'Service Temporarily Unavailable',
          message: 'Authentication failed due to a temporary database connection problem. Please try again in a few moments or contact support if the issue persists.',
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          severity: 'warning',
          actions: [
            { label: 'Try Again', onClick: () => window.location.reload(), variant: 'default' },
            { label: 'Back to Login', href: '/auth/login', variant: 'outline' }
          ]
        };
      
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in with this account. Please check your credentials or contact support if you believe this is an error.',
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          severity: 'error',
          actions: [
            { label: 'Back to Login', href: '/auth/login', variant: 'default' },
            { label: 'Contact Support', href: 'mailto:support@yourapp.com', variant: 'outline' }
          ]
        };
      
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Already Exists',
          message: 'This email address is already registered with a different sign-in method. Please use the same provider you originally used to create your account.',
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          severity: 'warning',
          actions: [
            { label: 'Try Different Provider', href: '/auth/login', variant: 'default' },
            { label: 'Forgot Password?', href: '/auth/forgot-password', variant: 'outline' }
          ]
        };
      
      case 'EmailSignin':
        return {
          title: 'Check Your Email',
          message: 'A sign-in link has been sent to your email address. Please check your inbox and click the link to complete the sign-in process.',
          icon: <Mail className="h-12 w-12 text-blue-500" />,
          severity: 'info',
          actions: [
            { label: 'Back to Login', href: '/auth/login', variant: 'default' }
          ]
        };
      
      case 'Verification':
        return {
          title: 'Invalid or Expired Link',
          message: 'The sign-in link is no longer valid. It may have already been used or expired. Please request a new sign-in link.',
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          severity: 'warning',
          actions: [
            { label: 'Request New Link', href: '/auth/login', variant: 'default' },
            { label: 'Go Home', href: '/', variant: 'outline' }
          ]
        };
      
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          severity: 'error',
          actions: [
            { label: 'Try Again', href: '/auth/login', variant: 'default' },
            { label: 'Forgot Password?', href: '/auth/forgot-password', variant: 'outline' }
          ]
        };
      
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          message: 'There is a problem with the server configuration. Our technical team has been notified. Please try again later or contact support.',
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          severity: 'warning',
          actions: [
            { label: 'Contact Support', href: 'mailto:support@yourapp.com', variant: 'default' },
            { label: 'Back to Login', href: '/auth/login', variant: 'outline' }
          ]
        };
      
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication. Please try again or contact support if the problem persists.',
          icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
          severity: 'error',
          actions: [
            { label: 'Try Again', href: '/auth/login', variant: 'default' },
            { label: 'Go Home', href: '/', variant: 'outline' }
          ]
        };
    }
  };

  const config = getErrorConfig(error);

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  return (
    <div className="flex items-center justify-center ">
      <div className="max-w-md w-full">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Error Card */}
        <div className={`border rounded-lg p-8 shadow-sm ${getSeverityColors(config.severity)}`}>
          {/* Icon and Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              {config.icon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {config.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {config.message}
            </p>
          </div>

          {/* Actions */}
          {config.actions && config.actions.length > 0 && (
            <div className="space-y-3">
              {config.actions.map((action, index) => {
                if (action.href) {
                  return (
                    <Link key={index} href={action.href} className="block">
                      <Button 
                        variant={action.variant || 'default'} 
                        className="w-full"
                      >
                        {action.label}
                      </Button>
                    </Link>
                  );
                } else if (action.onClick) {
                  return (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Alternative Actions */}
        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-4 text-sm">
            <Link 
              href="/auth/login" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Login
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              href="/auth/signup" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Sign Up
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <Home className="h-4 w-4 inline mr-1" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}