// src/app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get('error');

  let message = 'An unknown error occurred. Please try again.';
  switch (error) {
    case 'DatabaseUnavailable':
      message = 'Authentication failed due to a database connection problem. Please try again later or contact support.';
      break;
    case 'AccessDenied':
      message = 'Access denied. You do not have permission to sign in with this account.';
      break;
    case 'OAuthAccountNotLinked':
      message = 'This email is already registered. Please sign in using the provider you originally used.';
      break;
    case 'EmailSignin':
      message = 'Check your email for a sign-in link.';
      break;
    case 'Verification':
      message = 'The sign-in link is no longer valid. It may have already been used or expired.';
      break;
    case 'CredentialsSignin':
      message = 'Invalid email or password. Please try again.';
      break;
    case 'Configuration':
      message = 'There is a problem with the server configuration. Please contact support.';
      break;
    case 'Default':
      message = 'Unable to sign in. Please try again.';
      break;
    // Add more error codes as needed
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Authentication Error</h1>
      <p>{message}</p>
    </div>
  );
}