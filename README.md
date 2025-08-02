# AccessLayer – Next.js Authentication & Multi‑Tenant API Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-blue?style=flat-square&logo=nextauth)](https://next-auth.js.org/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/sutharpratik10/AccessLayer/graphs/commit-activity)

AccessLayer is a modular authentication and API layer built on **Next.js** and **NextAuth.js**. It offers comprehensive authentication solutions, including email/password login, multiple OAuth providers (Google, GitHub, Facebook, Microsoft Azure AD, Apple), and robust security features like 2FA, email verification, and password reset. The session management uses JWT for enhanced security and scalability.

Built with a scalable **multi-tenant architecture**, this solution is ideal for SaaS applications needing isolated tenant data and granular access control. Each tenant can have its own configuration and data, ensuring a secure and customizable environment.

---

## Table of Contents
- [🔑 Features](#-features)
- [🏗️ Project Structure](#️-project-structure)
- [⚙️ Installation Guide](#️-installation-guide)
- [🚀 Deployment Guide (Production)](#-deployment-guide-production)
- [📁 OAuth Provider Setup](#-oauth-provider-setup)
    - [Google](#google)
    - [GitHub](#github)
    - [Facebook](#facebook)
    - [Microsoft Azure AD](#microsoft-azure-ad)
    - [Apple](#apple)
- [🔐 Optional: Enable 2FA](#-optional-enable-2fa)
- [✨ Authentication Flow](#-authentication-flow)
    - [OAuth Flow](#oauth-flow)
    - [Email/Password Flow](#emailpassword-flow)
- [📚 Database Schema](#database-schema)
- [📜 API Routes](#-api-routes)
- [🤝 Contribution Guidelines](#-contribution-guidelines)
- [📄 License](#-license)
- [❓ FAQ](#-faq)
- [👤 Author](#-author)

---

## 🔑 Features

- ✅ **Email/Password Login**: Secure authentication using email and password with bcrypt hashing for secure password storage.  This prevents storage of plain-text passwords and protects against common attacks.
- 🔐 **Two-Factor Authentication (2FA)**: Enhanced security using Time-based One-Time Password (TOTP) to protect user accounts. This adds an extra layer of protection beyond just a password.
- 💌 **Email Verification & Password Reset**: Automated email verification during signup and password reset functionality to maintain account security and accessibility. Ensures that users have valid email addresses and can recover their accounts easily.
- 🌐 **OAuth Support**: Seamless integration with popular OAuth providers for simplified user onboarding.
    - Google: Allows users to sign up/in using their Google accounts.
    - GitHub: Enables authentication via GitHub accounts.
    - Facebook: Supports login/signup with Facebook credentials.
    - Microsoft Azure AD: Integrates with Azure Active Directory for enterprise authentication, suitable for organizations.
    - Apple: Enables "Sign in with Apple" for iOS and macOS users, providing a consistent experience for Apple users.
- 👥 **Multi-Tenant Architecture**: Supports multiple tenants with isolated data for SaaS applications. Route-level tenant resolution ensures data privacy and security. Each tenant's data is stored separately, preventing data leakage and unauthorized access.
- 🏷️ **Role-Based Access Control (RBAC)**: Fine-grained control over user permissions and access levels within each tenant. Admins can assign roles to users, limiting their access to specific resources.
- 🌙 **User Preferences**: Customizable user settings, including theme preferences and session information display. Allows users to personalize their experience.
- 🔁 **Session Management**: Uses JWT (JSON Web Tokens) for session management, including expiration and refresh support for persistent sessions. JWTs are stateless and can be easily scaled across multiple servers.
- 🔧 **Modular Route Management**: Organized route definitions as outlined in `ROUTES-ARCHITECTURE.md` for maintainability and scalability.

---

## 🏗️ Project Structure

bash
git clone https://github.com/sutharpratik10/AccessLayer.git
cd AccessLayer
> Create a `.env.local` file based on the provided `.env.example`.

.env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Provider credentials
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
GOOGLE_ID=your_google_id
GOOGLE_SECRET=your_google_secret
FACEBOOK_ID=your_facebook_id
FACEBOOK_SECRET=your_facebook_secret
AZURE_AD_CLIENT_ID=your_azure_ad_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret
APPLE_ID=your_apple_id
APPLE_SECRET=your_apple_secret
bash
npm run dev
> Use a VPS or cloud VM (e.g., AWS EC2, DigitalOcean Droplet). Ensure Node.js (v18+), npm/yarn, and PostgreSQL are installed. Secure the server with a firewall and SSH keys.

2.  **Clone and Build the Project**

.env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-prod-host/database_name
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_strong_secret_key
> **Tip:** Use a process manager like PM2 to keep the app running:

nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
> Enable SSL using Let's Encrypt with Certbot. Don't forget to configure the nginx to listen on port 443 and include the certificates.

---

## 📁 OAuth Provider Setup

> To enable OAuth login, you need to register your application with each provider and obtain the necessary credentials. Here's how:

### Google

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to "APIs & Services" > "Credentials".
4.  Click "Create Credentials" and select "OAuth client ID".
5.  Configure the OAuth consent screen with your application details.
6.  Set the "Application type" to "Web application".
7.  Add `http://localhost:3000/api/auth/callback/google` and your production URL (e.g., `https://yourdomain.com/api/auth/callback/google`) to the "Authorized redirect URIs".
8.  Create the credentials and copy the "Client ID" and "Client Secret" to your `.env.local` and `.env.production` files.

> **Troubleshooting**:
>
> *   Ensure the redirect URIs are correctly configured in the Google Cloud Console.
> *   Double-check the Client ID and Client Secret in your environment variables.
> *   Make sure the Google API is enabled for your project.

### GitHub

1.  Go to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click "OAuth Apps" > "New OAuth App".
3.  Fill in the "Application name", "Homepage URL", and "Authorization callback URL" (e.g., `http://localhost:3000/api/auth/callback/github` and `https://yourdomain.com/api/auth/callback/github`).
4.  Register the application and copy the "Client ID" and "Client Secret" to your `.env.local` and `.env.production` files.

> **Troubleshooting**:
>
> *   Verify that the callback URL matches the one configured in your GitHub OAuth App settings.
> *   Ensure that your application has the necessary permissions (e.g., `user:email`).
> *   Check that your Homepage URL is a valid, publicly accessible URL.

### Facebook

1.  Go to [Facebook Developers](https://developers.facebook.com/).
2.  Create a new app and select "Consumer" as the app type.
3.  Navigate to "Settings" > "Basic" and fill in the required information.
4.  Add "Facebook Login" as a product to your app.
5.  Configure the "Valid OAuth Redirect URIs" with `http://localhost:3000/api/auth/callback/facebook` and `https://yourdomain.com/api/auth/callback/facebook`.
6.  Save the changes and copy the "App ID" and "App Secret" to your `.env.local` and `.env.production` files.

> **Troubleshooting**:
>
> *   Ensure your Facebook app is in "Live" mode.
> *   Verify that the redirect URIs are correctly configured.
> *   Confirm that you've completed the necessary data use checks.

### Microsoft Azure AD

1.  Go to the [Microsoft Azure Portal](https://portal.azure.com/).
2.  Navigate to "Azure Active Directory" > "App registrations".
3.  Click "New registration".
4.  Enter a name for your application and select the appropriate "Supported account types".
5.  Set the "Redirect URI" to "Web" and enter `http://localhost:3000/api/auth/callback/azure-ad` and `https://yourdomain.com/api/auth/callback/azure-ad`.
6.  Register the application and copy the "Application (client) ID" and "Directory (tenant) ID" to your `.env.local` and `.env.production` files.
7.  Generate a new client secret under "Certificates & secrets" and copy the secret value.

> **Troubleshooting**:
>
> *   Ensure that the "Redirect URI" is correctly configured in the Azure portal.
> *   Verify that the necessary API permissions are granted to your application (e.g., `User.Read`).
> *   Check if your tenant requires admin consent for the application.

### Apple

1.  Go to [Apple Developer](https://developer.apple.com/).
2.  Create a new App ID and enable the "Sign In with Apple" capability.
3.  Create a new Services ID and configure the return URLs (e.g., `http://localhost:3000/api/auth/callback/apple` and `https://yourdomain.com/api/auth/callback/apple`).
4.  Download the "Sign In with Apple" key and configure the necessary environment variables.  This involves creating a private key and registering it with Apple.

> **Troubleshooting**:
>
> *   Ensure that the "Sign In with Apple" capability is enabled for your App ID.
> *   Verify that the return URLs are correctly configured.
> *   Check that your private key is correctly configured and referenced.

---

## 🔐 Optional: Enable 2FA

> To enable Two-Factor Authentication:

1.  Navigate to the Profile or Security settings page.
2.  Follow the instructions to set up 2FA using an authenticator app (e.g., Google Authenticator, Authy).
3.  Enter the 6-digit OTP provided by the authenticator app to verify and enable 2FA.

---

## ✨ Authentication Flow

### OAuth Flow

>  A sequence diagram could be useful here to illustrate the OAuth flow. You can use markdown diagrams or link to an external image.  Example:

mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AccessLayer
    participant OAuth Provider

    User->>Browser: Clicks "Login with OAuth"
    Browser->>AccessLayer: Redirects to /api/auth/oauth-provider
    AccessLayer->>OAuth Provider: Redirects to OAuth Provider login page
    OAuth Provider->>User: User authenticates
    OAuth Provider->>AccessLayer: Redirects back to AccessLayer with code
    AccessLayer->>OAuth Provider: Exchanges code for access token
    OAuth Provider->>AccessLayer: Returns user profile
    AccessLayer->>AccessLayer: Creates/Updates user in database
    AccessLayer->>Browser: Sets session and redirects to application
    Browser->>User: User logged in
## 📚 Database Schema

> Provide a high-level overview of the database schema.  This could include tables for users, tenants, roles, sessions, etc.  If possible, provide a visual representation or a simplified schema diagram.  Consider using a tool like [dbdiagram.io](https://dbdiagram.io/) to create a visual schema.

> **Example Schema (Conceptual)**:

mermaid
erDiagram
    USER {
        uuid uuid PK
        email varchar(255)
        password_hash varchar(255)
        name varchar(255)
        email_verified boolean
        image varchar(255)
        created_at timestamp
        updated_at timestamp
    }

    TENANT {
        uuid uuid PK
        name varchar(255)
        slug varchar(255)
        created_at timestamp
        updated_at timestamp
    }

    ROLE {
        uuid uuid PK
        name varchar(255)
        description text
        created_at timestamp
        updated_at timestamp
    }

    USER_TENANT {
        user_id uuid FK
        tenant_id uuid FK
        role_id uuid FK
        joined_at timestamp
    }

    USER ||--o{ USER_TENANT : has
    TENANT ||--o{ USER_TENANT : has
    ROLE ||--o{ USER_TENANT : assigned

    USER {
      string id PK
      string name
      string email
      string password
      string image
      string emailVerified
    }

    Account {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string refresh_token
        string access_token
        string expires_at
        string token_type
        string scope
        string id_token
        string session_state
    }

    Session {
        string id PK
        string userId FK
        string sessionToken unique
        string accessToken unique
        dateTime expires
    }

    VerificationToken {
        string identifier
        string token unique
        dateTime expires
    }

    User ||--o{ Account : has
    User ||--o{ Session : has
| Route                     | Method | Description                                                | Parameters                                   | Example Response                                                                                                |
| ------------------------- | ------ | ---------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/api/auth/login`         | POST   | Authenticates a user with email and password.            | `email`, `password`                           | `{ success: true, message: 'Login successful', user: { ... } }` or `{ success: false, message: 'Invalid credentials' }` |
| `/api/auth/register`      | POST   | Registers a new user.                                    | `email`, `password`                           | `{ success: true, message: 'Registration successful', user: { ... } }` or `{ success: false, message: 'Email already exists' }` |
| `/api/auth/logout`         | POST   | Logs out the current user.                               | None                                         | `{ success: true, message: 'Logout successful' }`                                                                |
| `/api/auth/session`        | GET    | Returns the current user session.                          | None                                         | `{ user: { ... }, expires: '...' }` or `{}` if no session exists                                                 |
| `/api/auth/2fa/enable`    | POST   | Enables Two-Factor Authentication for the current user.   | None (requires valid session)                  | `{ success: true, message: '2FA enabled' }` or `{ success: false, message: 'Error enabling 2FA' }`               |
| `/api/auth/2fa/disable`   | POST   | Disables Two-Factor Authentication for the current user.  | None (requires valid session)                  | `{ success: true, message: '2FA disabled' }` or `{ success: false, message: 'Error disabling 2FA' }`              |
| `/api/auth/2fa/verify`    | POST   | Verifies the OTP for Two-Factor Authentication.           | `otp` (One-Time Password)                     | `{ success: true, message: 'OTP verified' } or `{ success: false, message: 'Invalid OTP' }`                     |
| `/api/auth/reset-password`| POST   | Sends a password reset email to the user.               | `email`                                       | `{ success: true, message: 'Password reset email sent' }` or `{ success: false, message: 'User not found' }`      |
| `/api/auth/new-password`  | POST   | Sets a new password after password reset verification. | `token`, `password`                          | `{ success: true, message: 'Password reset successful' }` or `{ success: false, message: 'Invalid token' }`        |

---

## 🤝 Contribution Guidelines

> We welcome contributions to AccessLayer! Here's how you can help:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.

> **Bug Reports**:
>
> If you find a bug, please submit a detailed bug report, including steps to reproduce the issue and any relevant error messages or screenshots.

> **Feature Requests**:
>
> If you have a feature request, please submit a detailed proposal outlining the feature and its benefits.

> **Coding Standards**:
>
> Please follow the existing coding standards and conventions. Use ESLint and Prettier to format your code.

> **Pull Requests**:
>
> Submit a pull request with a clear description of your changes.  Reference any related issues.

---

## 📄 License

> This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ❓ FAQ

> **Q: How do I add a new OAuth provider?**
>
> A:  You need to implement a new provider in `auth.config.ts`, following the existing examples. Also, add necessary environment variables and configure the OAuth app in the provider's developer console.

> **Q: How do I customize the UI?**
>
> A: The UI components are located in the `components/` directory.  You can modify these components to fit your specific design requirements.

> **Q: How do I handle tenant-specific configurations?**
>
> A: Tenant configurations can be stored in the database and accessed using the tenant ID. You can create a middleware to load the tenant configuration based on the request's hostname or a custom header.

---