# Authentication System

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [NextAuth Configuration](#nextauth-configuration)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Components](#components)
- [Security Features](#security-features)
- [Usage Examples](#usage-examples)

## Overview

Authpay's authentication system is built on **NextAuth.js 5** (Auth.js), providing a secure, flexible, and production-ready authentication solution. The system supports multiple authentication methods and integrates seamlessly with the RBAC system.

### Features

- ✅ **Email/Password Authentication**: Traditional login with secure password hashing
- ✅ **OAuth Providers**: Google, GitHub, Microsoft (Azure AD), Facebook, Apple - See [OAuth Setup Guide](./08-OAUTH-SETUP.md)
- ✅ **Email Verification**: Required verification before account activation
- ✅ **Password Reset**: Secure token-based password recovery
- ✅ **Session Management**: JWT-based sessions with auto-refresh
- ✅ **Two-Factor Authentication**: Additional security layer
- ✅ **RBAC Integration**: Automatic role and permission loading

## Architecture

### Authentication Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Login Request
       ▼
┌─────────────────────────────────┐
│     NextAuth.js Handler         │
│  (src/config/auth.ts)           │
└──────┬──────────────────────────┘
       │
       │ 2. Credentials Check
       ▼
┌─────────────────────────────────┐
│    AuthService.validateUser     │
│  (src/services/auth.ts)         │
└──────┬──────────────────────────┘
       │
       │ 3. Password Verification
       ▼
┌─────────────────────────────────┐
│         Database                │
│    (users table)                │
└──────┬──────────────────────────┘
       │
       │ 4. Load Roles & Policies
       ▼
┌─────────────────────────────────┐
│      RBACService                │
│  (Permission Loading)           │
└──────┬──────────────────────────┘
       │
       │ 5. Create JWT Token
       ▼
┌─────────────────────────────────┐
│    Session with Policies        │
│  (Returned to Client)           │
└─────────────────────────────────┘
```

### Components Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| **Auth Configuration** | `src/config/auth.ts` | NextAuth.js setup and callbacks |
| **Auth Service** | `src/services/auth.ts` | Business logic for authentication |
| **API Routes** | `src/app/api/auth/` | Authentication endpoints |
| **Auth Pages** | `src/app/auth/` | Login, signup, verification pages |
| **Middleware** | `middleware.ts` | Route protection and session validation |
| **Auth Context** | `src/contexts/auth-context.tsx` | Client-side auth state |

## NextAuth Configuration

### Main Configuration File

**Location**: `src/config/auth.ts`

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Credentials Provider
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Validate user credentials
        const user = await AuthService.validateUser(
          credentials.email,
          credentials.password
        );
        
        if (!user) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }),
    
    // OAuth Providers
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  
  // Callbacks for customization
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        
        // Load user policies
        const policies = await RBACService.getUserPolicies(user.id);
        token.policies = policies;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Add token info to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.policies = token.policies as string[];
      }
      
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === "google" || account?.provider === "github") {
        // Create or update user
        await AuthService.handleOAuthSignIn(user, account, profile);
      }
      
      return true;
    },
  },
  
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Custom pages
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  
  // Security
  secret: process.env.NEXTAUTH_SECRET,
});
```

### Environment Variables

Required variables in `.env.local`:

```bash
# NextAuth
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

Generate secret:
```bash
openssl rand -base64 32
```

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Flow**:
```
1. User submits registration form
2. Validate email format and password strength
3. Check if email already exists
4. Hash password using bcrypt
5. Create user record in database
6. Assign default role (User role)
7. Generate verification token
8. Send verification email
9. Return success response
```

**Request**:
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**Response**:
```typescript
{
  success: true,
  message: "Registration successful. Please verify your email.",
  userId: string
}
```

**Implementation**:
```typescript
// src/app/api/auth/register/route.ts
export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  
  // Validate input
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  
  // Check existing user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    emailVerified: null,
  }).returning();
  
  // Assign default role
  const defaultRole = await db.query.roles.findFirst({
    where: eq(roles.isDefault, true)
  });
  
  if (defaultRole) {
    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: defaultRole.id,
    });
  }
  
  // Send verification email
  await AuthService.sendVerificationEmail(newUser.email);
  
  return NextResponse.json({
    success: true,
    message: "Registration successful",
    userId: newUser.id
  });
}
```

### 2. Email Verification

**Endpoint**: `GET /api/auth/verify?token=xxx`

**Flow**:
```
1. User clicks verification link in email
2. Extract token from URL
3. Validate token and check expiration
4. Find user by token
5. Update emailVerified timestamp
6. Activate user account
7. Redirect to login page
```

**Implementation**:
```typescript
// src/app/api/auth/verify/route.ts
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect('/auth/error?error=InvalidToken');
  }
  
  // Find user with this token
  const user = await db.query.users.findFirst({
    where: eq(users.verificationToken, token)
  });
  
  if (!user) {
    return NextResponse.redirect('/auth/error?error=InvalidToken');
  }
  
  // Check token expiration (24 hours)
  if (user.verificationTokenExpiry < new Date()) {
    return NextResponse.redirect('/auth/error?error=TokenExpired');
  }
  
  // Verify email
  await db.update(users)
    .set({
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(users.id, user.id));
  
  return NextResponse.redirect('/auth/login?verified=true');
}
```

### 3. Login

**Endpoint**: NextAuth handles at `/api/auth/signin`

**Flow**:
```
1. User submits login credentials
2. NextAuth calls authorize function
3. Validate credentials against database
4. Check if email is verified
5. Check if account is suspended
6. Load user roles and policies
7. Create JWT token with user data
8. Return session to client
```

**Client-Side Login**:
```typescript
import { signIn } from "next-auth/react";

async function handleLogin(email: string, password: string) {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });
  
  if (result?.error) {
    console.error("Login failed:", result.error);
    return;
  }
  
  // Redirect to dashboard
  router.push('/protected/user/dashboard');
}
```

### 4. Password Reset

**Request Reset**: `POST /api/auth/forgot-password`

**Flow**:
```
1. User submits email address
2. Check if user exists
3. Generate reset token (UUID)
4. Set token expiration (1 hour)
5. Save token to database
6. Send reset email with link
7. Return success (don't reveal if user exists)
```

**Reset Password**: `POST /api/auth/reset-password`

**Flow**:
```
1. User submits new password + token
2. Validate token
3. Check token expiration
4. Hash new password
5. Update user password
6. Invalidate reset token
7. Send confirmation email
8. Return success
```

**Implementation**:
```typescript
// Request reset
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  if (user) {
    const resetToken = crypto.randomUUID();
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    
    await db.update(users)
      .set({
        resetToken,
        resetTokenExpiry: expiry,
      })
      .where(eq(users.id, user.id));
    
    await EmailService.sendPasswordResetEmail(email, resetToken);
  }
  
  // Always return success for security
  return NextResponse.json({
    success: true,
    message: "If email exists, reset link has been sent"
  });
}

// Reset password
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  
  const user = await db.query.users.findFirst({
    where: eq(users.resetToken, token)
  });
  
  if (!user || user.resetTokenExpiry < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, user.id));
  
  return NextResponse.json({
    success: true,
    message: "Password reset successful"
  });
}
```

### 5. OAuth Authentication

**Supported Providers**:
- Google
- GitHub
- (Extensible to others)

**Flow**:
```
1. User clicks "Sign in with Google/GitHub"
2. Redirect to OAuth provider
3. User authorizes application
4. Provider redirects back with code
5. Exchange code for access token
6. Fetch user profile from provider
7. Create or update user in database
8. Assign default role if new user
9. Create session with policies
10. Redirect to dashboard
```

**OAuth Handler**:
```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === "google" || account?.provider === "github") {
    // Check if user exists
    let dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email)
    });
    
    if (!dbUser) {
      // Create new user
      const [newUser] = await db.insert(users).values({
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: new Date(), // OAuth emails are pre-verified
        provider: account.provider,
        providerId: account.providerAccountId,
      }).returning();
      
      // Assign default role
      const defaultRole = await db.query.roles.findFirst({
        where: eq(roles.isDefault, true)
      });
      
      if (defaultRole) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: defaultRole.id,
        });
      }
      
      dbUser = newUser;
    }
    
    user.id = dbUser.id;
  }
  
  return true;
}
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| GET | `/api/auth/verify` | Email verification | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| POST | `/api/auth/signin` | Login (NextAuth) | No |
| GET | `/api/auth/signout` | Logout (NextAuth) | Yes |
| GET | `/api/auth/session` | Get session (NextAuth) | Yes |
| GET | `/api/auth/csrf` | Get CSRF token | No |

### Session Management

**Get Current Session**:
```typescript
import { auth } from "@/config/auth";

// Server component
const session = await auth();

// Client component
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();
```

**Session Object**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    policies: string[]; // User's policies
  },
  expires: string; // ISO date
}
```

## Components

### Auth Pages

**Login Page**: `src/app/auth/login/page.tsx`

```typescript
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      toast.error('Invalid credentials');
      return;
    }
    
    router.push('/protected/user/dashboard');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit">Sign In</Button>
      
      {/* OAuth Buttons */}
      <Button onClick={() => signIn('google')}>
        Sign in with Google
      </Button>
      <Button onClick={() => signIn('github')}>
        Sign in with GitHub
      </Button>
    </form>
  );
}
```

**Signup Page**: `src/app/auth/signup/page.tsx`

**Verification Page**: `src/app/auth/verify/page.tsx`

**Password Reset Page**: `src/app/auth/reset-password/page.tsx`

### Auth Context

**Location**: `src/contexts/auth-context.tsx`

```typescript
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  
  const value = {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signIn: async (email: string, password: string) => {
      return signIn('credentials', { email, password });
    },
    signOut: async () => {
      return signOut();
    },
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => useContext(AuthContext);
```

**Usage**:
```typescript
import { useAuth } from '@/contexts/auth-context';

function Component() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.name}</div>;
}
```

## Security Features

### 1. Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 10
- Rainbow table resistant

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation**:
```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character");
```

### 2. Session Security

**JWT Configuration**:
- Algorithm: HS256
- Secret: 32+ character random string
- Expiration: 30 days
- Refresh: Automatic on activity

**Token Storage**:
- HTTP-only cookies
- Secure flag in production
- SameSite: Lax
- Domain-specific

### 3. CSRF Protection

NextAuth automatically handles CSRF protection:
- CSRF token generated per session
- Validated on state-changing requests
- Token rotation on sign-in

### 4. Rate Limiting

**Login Attempts**:
```typescript
// Implement rate limiting
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

if (user.loginAttempts >= MAX_ATTEMPTS) {
  const lockoutExpired = Date.now() - user.lastFailedLogin > LOCKOUT_TIME;
  
  if (!lockoutExpired) {
    return { error: "Account locked. Try again later." };
  }
  
  // Reset attempts
  await resetLoginAttempts(user.id);
}
```

### 5. Email Verification

**Required Before**:
- Accessing protected routes
- Making API calls
- Changing sensitive settings

**Verification Token**:
- UUID v4
- 24-hour expiration
- Single-use only
- Invalidated after verification

### 6. Account Security

**Features**:
- Email verification required
- Password reset with token
- Account suspension capability
- Login attempt tracking
- Session invalidation on password change

## Usage Examples

### Server-Side Authentication Check

```typescript
import { auth } from "@/config/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Client-Side Authentication Check

```typescript
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ClientProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### API Route Protection

```typescript
import { auth } from "@/config/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Process request
  return NextResponse.json({ success: true });
}
```

### Logout

```typescript
import { signOut } from "next-auth/react";

function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </button>
  );
}
```

## Troubleshooting

### Common Issues

**1. "Configuration Error"**
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches deployment URL

**2. "Email Not Verified"**
- Check email service configuration
- Verify SMTP credentials
- Check spam folder

**3. "OAuth Redirect Mismatch"**
- Update OAuth callback URL in provider console
- Format: `https://yourdomain.com/api/auth/callback/google`

**4. "Session Not Persisting"**
- Check cookie settings
- Verify domain configuration
- Check HTTPS in production

### Debug Mode

Enable NextAuth debug mode:

```typescript
export const { handlers, auth } = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  // ... rest of config
});
```

Check logs for detailed error messages.

## Best Practices

1. **Always verify emails** before allowing access
2. **Use HTTPS** in production
3. **Rotate secrets** regularly
4. **Implement rate limiting** on auth endpoints
5. **Log security events** (failed logins, etc.)
6. **Use strong password requirements**
7. **Implement 2FA** for sensitive accounts
8. **Monitor suspicious activity**
9. **Keep dependencies updated**
10. **Test OAuth flows** thoroughly

## Next Steps

- Read [03-RBAC.md](./03-RBAC.md) for permission system integration
- Review [12-SECURITY.md](./12-SECURITY.md) for security best practices
- Check [10-TESTING.md](./10-TESTING.md) for testing authentication flows
