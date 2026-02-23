# OAuth 2.0 Setup Guide

This guide will help you set up OAuth 2.0 authentication for Google, Microsoft (Azure AD), and GitHub in your BookEase application.

## Table of Contents
1. [Google OAuth Setup](#google-oauth-setup)
2. [Microsoft (Azure AD) OAuth Setup](#microsoft-azure-ad-oauth-setup)
3. [GitHub OAuth Setup](#github-oauth-setup)
4. [Testing OAuth](#testing-oauth)
5. [Troubleshooting](#troubleshooting)

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select **"New Project"**
3. Enter a project name (e.g., "BookEase") and click **Create**
4. Wait for the project to be created and select it

### Step 2: Enable Google+ API

1. In the left sidebar, navigate to **APIs & Services** > **Library**
2. Search for **"Google+ API"** or **"Google People API"**
3. Click on it and press **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace organization)
3. Click **Create**
4. Fill in the required information:
   - **App name**: BookEase
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Add or Remove Scopes**
7. Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click **Update** and then **Save and Continue**
9. On the Test users page (if in Testing mode), add your email addresses
10. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure the following:
   - **Name**: BookEase Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 5: Add to Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Microsoft (Azure AD) OAuth Setup

### Step 1: Register an Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for and select **Azure Active Directory** (or **Microsoft Entra ID**)
3. In the left sidebar, click **App registrations**
4. Click **New registration**

### Step 2: Configure Application Registration

1. Fill in the registration form:
   - **Name**: BookEase
   - **Supported account types**: 
     - Select **"Accounts in any organizational directory and personal Microsoft accounts"** (most common)
     - This allows both personal Microsoft accounts (Outlook, Hotmail) and work/school accounts
   - **Redirect URI**:
     - Select **Web**
     - Enter: `http://localhost:3000/api/auth/callback/azure-ad` (for development)
2. Click **Register**

### Step 3: Add Additional Redirect URIs (for Production)

1. After registration, go to **Authentication** in the left sidebar
2. Under **Platform configurations** > **Web**, click **Add URI**
3. Add your production callback URL:
   - `https://yourdomain.com/api/auth/callback/azure-ad`
4. Scroll down to **Implicit grant and hybrid flows** (optional, usually not needed)
5. Click **Save**

### Step 4: Create a Client Secret

1. In the left sidebar, click **Certificates & secrets**
2. Under **Client secrets**, click **New client secret**
3. Add a description (e.g., "BookEase Production")
4. Select an expiration period (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again)

### Step 5: Get Application IDs

1. Go to **Overview** in the left sidebar
2. Copy the following values:
   - **Application (client) ID** - This is your `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** - This is your `AZURE_AD_TENANT_ID`

### Step 6: Configure API Permissions (Optional but Recommended)

1. Go to **API permissions** in the left sidebar
2. You should see **Microsoft Graph** with delegated permissions already added
3. Ensure these permissions are present:
   - `User.Read`
   - `email`
   - `openid`
   - `profile`
4. If not, click **Add a permission** > **Microsoft Graph** > **Delegated permissions** and add them

### Step 7: Add to Environment Variables

Add to your `.env` file:

```env
AZURE_AD_CLIENT_ID="your-application-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret-value"
AZURE_AD_TENANT_ID="common"
```

**Note**: Use `AZURE_AD_TENANT_ID="common"` to support both personal Microsoft accounts and work/school accounts. Use your specific tenant ID if you only want work/school accounts from your organization.

---

## GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** in the left sidebar
3. Click **New OAuth App**

### Step 2: Configure OAuth App

1. Fill in the application form:
   - **Application name**: BookEase
   - **Homepage URL**: 
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Application description**: (optional) BookEase Authentication
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://yourdomain.com/api/auth/callback/github`
2. Click **Register application**

### Step 3: Generate Client Secret

1. After registration, you'll see your **Client ID**
2. Click **Generate a new client secret**
3. Copy both the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

Add to your `.env` file:

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## Testing OAuth

### 1. Restart Your Development Server

After adding environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 2. Test OAuth Login

1. Navigate to `http://localhost:3000/auth/login`
2. Click on one of the OAuth provider buttons:
   - **Continue with Google**
   - **Continue with GitHub**
   - **Continue with Microsoft**
3. You should be redirected to the provider's login page
4. After successful authentication, you'll be redirected back to your application

### 3. Verify User Creation

1. Check your database to ensure the user was created
2. Verify that the `users` table has the new user
3. Verify that the `accounts` table has the OAuth provider information
4. Check that `isEmailVerified` is set to `true` (OAuth users don't need email verification)

---

## Troubleshooting

### Google OAuth Issues

**Problem**: "Error 400: redirect_uri_mismatch"
- **Solution**: Ensure your redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google` (no trailing slash)

**Problem**: "Access blocked: This app's request is invalid"
- **Solution**: Make sure you've enabled the Google+ API or Google People API in the API Library

**Problem**: "This app isn't verified"
- **Solution**: In development, this is normal. Click "Advanced" > "Go to BookEase (unsafe)" to continue. For production, submit your app for verification.

### Microsoft OAuth Issues

**Problem**: "AADSTS50011: The redirect URI specified in the request does not match"
- **Solution**: Verify the redirect URI is exactly: `http://localhost:3000/api/auth/callback/azure-ad`

**Problem**: "AADSTS7000215: Invalid client secret is provided"
- **Solution**: The client secret may have expired or was copied incorrectly. Generate a new secret and update your `.env` file

**Problem**: "AADSTS700016: Application not found"
- **Solution**: Double-check your `AZURE_AD_CLIENT_ID` is correct

**Problem**: Personal Microsoft accounts not working
- **Solution**: Ensure you're using `AZURE_AD_TENANT_ID="common"` in your environment variables

### GitHub OAuth Issues

**Problem**: "The redirect_uri MUST match the registered callback URL"
- **Solution**: Check that your callback URL is exactly: `http://localhost:3000/api/auth/callback/github`

**Problem**: "Bad verification code"
- **Solution**: This usually means the OAuth flow was interrupted. Try again with a fresh login attempt.

### General Issues

**Problem**: OAuth button does nothing when clicked
- **Solution**: Check browser console for errors. Ensure your environment variables are loaded correctly.

**Problem**: "Configuration error" or "Provider not found"
- **Solution**: Verify that:
  1. Environment variables are set correctly (no quotes needed for values)
  2. You've restarted your development server after adding environment variables
  3. The provider name matches exactly in your code

**Problem**: User created but not logged in
- **Solution**: Check the `accounts` table to ensure the OAuth provider record was created with the correct `userId`

---

## Environment Variables Summary

Here's a complete list of all OAuth-related environment variables you need:

```env
# NextAuth Configuration
AUTH_SECRET="your-super-secret-key-min-32-characters-long"
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Microsoft Azure AD OAuth
AZURE_AD_CLIENT_ID="your-application-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret-value"
AZURE_AD_TENANT_ID="common"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update all callback URLs to use your production domain
- [ ] Generate strong, unique secrets for `AUTH_SECRET` and `NEXTAUTH_SECRET`
- [ ] Update `NEXTAUTH_URL` to your production URL
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Ensure all OAuth apps have production callback URLs registered
- [ ] Test OAuth flows in production environment
- [ ] Submit Google app for verification (if needed)
- [ ] Monitor OAuth error logs in your application

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate secrets regularly**, especially before production launch
3. **Use different OAuth apps** for development and production
4. **Limit OAuth scopes** to only what you need
5. **Monitor OAuth usage** through provider dashboards
6. **Implement rate limiting** on OAuth callbacks
7. **Log OAuth errors** for debugging and security monitoring

---

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

## Need Help?

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error messages
2. Review server logs for OAuth callback errors
3. Verify all environment variables are set correctly
4. Ensure your OAuth provider configuration matches the callback URLs
5. Test with a different browser or incognito mode

For more assistance, refer to the main [Authentication Documentation](./02-AUTHENTICATION.md).
