# Authentication System with OAuth Support

This is a [Next.js](https://nextjs.org) authentication system with support for email/password login and OAuth providers (Google, GitHub, Facebook, Microsoft Azure AD, and Apple).

## Features

- **Email/Password Authentication**: Traditional signup and login with email verification
- **OAuth Authentication**: Third-party login with Google, GitHub, Facebook, Microsoft, and Apple
- **Two-Factor Authentication (2FA)**: Optional TOTP-based 2FA
- **Email Verification**: Required for email/password accounts (automatically verified for OAuth)
- **Password Reset**: Secure password reset flow with OTP codes
- **Session Management**: Secure session handling with NextAuth.js
- **User Preferences**: Theme, notifications, and other user settings

## OAuth Setup

### Environment Variables

Copy `env.example` to `.env.local` and configure your OAuth providers:

```bash
# NextAuth.js settings
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Microsoft Azure AD OAuth
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"

# Apple OAuth
APPLE_CLIENT_ID="your-apple-service-id"
APPLE_CLIENT_SECRET="your-apple-private-key"
```

### OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`

#### Microsoft Azure AD OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Set Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`

#### Apple OAuth
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Services ID
3. Configure Sign in with Apple
4. Set Return URLs: `http://localhost:3000/api/auth/callback/apple`

## Getting Started

First, set up your environment variables and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Flow

### OAuth Authentication
- Users can sign up/login with any configured OAuth provider
- OAuth users automatically have verified emails (`isEmailVerified: true`)
- No email verification required for OAuth users
- Redirects to dashboard after successful authentication

### Email/Password Authentication
- Traditional signup requires email verification
- Users receive OTP codes for verification
- 2FA can be enabled optionally
- Password reset available via OTP codes

## API Routes

- `/api/auth/*` - NextAuth.js authentication endpoints
- `/api/auth/register` - Email/password registration
- `/api/auth/verify` - Email verification
- `/api/auth/forgot-password` - Password reset initiation
- `/api/auth/reset-password` - Password reset completion

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
