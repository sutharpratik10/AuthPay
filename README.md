# AuthPay – Next.js Authentication, Payments & RBAC Platform

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-green?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-purple?style=flat-square&logo=nextdotjs)](https://next-auth.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=flat-square&logo=razorpay)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/sutharpratik10/AuthPay/graphs/commit-activity)
[![Tests](https://img.shields.io/badge/tests-156%20passed-brightgreen?style=flat-square)](./TEST-SUMMARY.md)
[![Security](https://img.shields.io/badge/security-87%20tests-brightgreen?style=flat-square)](./SECURITY-TEST-REPORT.md)
[![Coverage](https://img.shields.io/badge/coverage-6.18%25-orange?style=flat-square)](./TEST-SUMMARY.md)

> **A production-ready, full-stack authentication and payment platform built with Next.js 15, featuring advanced RBAC, secure payment processing, and comprehensive user management.**

AuthPay is a modern, scalable authentication and payment platform designed for SaaS applications and enterprise solutions. Built on Next.js 15 with TypeScript, it provides a robust foundation for applications requiring secure authentication, role-based access control, and integrated payment processing.

![AuthPay Dashboard](https://via.placeholder.com/1200x600/1e293b/38bdf8?text=AuthPay+Dashboard)

## 🌟 Why AuthPay?

- 🔐 **Enterprise-Grade Security**: Industry-standard authentication with 2FA, email verification, and secure password handling
- 🏷️ **Advanced RBAC System**: Policy-based access control with fine-grained permissions and multi-role support
- 💳 **Payment Integration**: Seamless Razorpay integration for subscriptions, one-time payments, and invoices
- 🎨 **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS and shadcn/ui components
- 🚀 **Production Ready**: Optimized performance, comprehensive error handling, and deployment guides
- 📚 **Well Documented**: Extensive documentation covering every aspect of the platform
- 🔧 **Developer Friendly**: Type-safe development with TypeScript, modular architecture, and clear patterns

---

## 📑 Table of Contents

- [What is AuthPay?](#-what-is-authpay)
- [Features](#-features)
- [Core Modules](#-core-modules)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Database Schema](#-database-schema)
- [OAuth Providers](#-oauth-providers)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 What is AuthPay?

AuthPay is a comprehensive authentication and payment platform that combines:

1. **Authentication System**: Secure user authentication with multiple strategies (email/password, OAuth, 2FA)
2. **Authorization Layer**: Policy-based RBAC system for fine-grained access control
3. **Payment Gateway**: Integrated payment processing with Razorpay for subscriptions and one-time payments
4. **User Management**: Complete user lifecycle management including registration, verification, and profile management
5. **Admin Dashboard**: Powerful admin interface for managing users, roles, permissions, and subscriptions

### Perfect For:

- 🎯 **SaaS Applications** - Multi-user platforms with subscription billing
- 🏢 **Enterprise Solutions** - Applications requiring role-based access control
- 💼 **B2B Platforms** - Business applications with complex permission requirements
- 🛒 **E-commerce** - Online stores with payment processing
- 📱 **Mobile Backends** - API-first architecture suitable for mobile apps

---

## ✨ Features

### 🔐 Authentication & Security

- ✅ **Email/Password Authentication**
  - Secure password hashing with bcrypt
  - Password strength validation
  - Account lockout after failed attempts
  
- ✅ **OAuth 2.0 Integration**
  - Google Sign-In
  - GitHub OAuth
  - Facebook Login
  - Microsoft Azure AD
  - Apple Sign-In
  
- ✅ **Two-Factor Authentication (2FA)**
  - Email-based OTP authentication
  - Secure code delivery
  - Time-limited verification codes
  
- ✅ **Email Verification**
  - Automated verification emails
  - Secure token-based verification
  - Resend verification email
  - Expiring verification links
  
- ✅ **Password Recovery**
  - Secure password reset flow
  - Time-limited reset tokens
  - Email-based verification
  - Password history prevention

### 🏷️ Role-Based Access Control (RBAC)

- ✅ **Policy-Based Permissions**
  - Fine-grained `resource:action` policies
  - Wildcard permissions support
  - Dynamic policy assignment
  - Hierarchical permission structure
  
- ✅ **Multi-Role Support**
  - Users can have multiple roles
  - Role aggregation and inheritance
  - System-managed roles (protected)
  - Custom role creation
  
- ✅ **Access Control**
  - Middleware-based route protection
  - API endpoint authorization
  - UI component-level access control
  - Admin override capabilities
  
- ✅ **Performance Optimized**
  - 5-minute permission cache
  - Efficient database queries
  - Automatic cache invalidation
  - Scalable architecture

### 💳 Payment Gateway Integration

- ✅ **Razorpay Integration**
  - Order creation and management
  - Payment verification (HMAC)
  - Subscription management
  - Invoice generation
  - Webhook handling
  
- ✅ **Subscription Management**
  - Recurring billing setup
  - Plan management (Free, Pro, Enterprise)
  - Subscription pause/resume/cancel
  - Prorated upgrades/downgrades
  - Automatic renewal handling
  
- ✅ **Payment Processing**
  - One-time payments
  - Recurring subscriptions
  - Multi-currency support
  - Payment verification
  - Transaction logging
  
- ✅ **Provider Abstraction**
  - Pluggable payment providers
  - Easy provider switching
  - Extensible architecture
  - Future-ready (Stripe, PayPal support planned)

### 👥 User Management

- ✅ **User Profiles**
  - Profile customization
  - Avatar upload
  - Personal information management
  - Preference settings
  
- ✅ **Session Management**
  - JWT-based sessions
  - Session expiration handling
  - Multi-device support
  - Active session tracking
  - Session revocation
  
- ✅ **Account Settings**
  - Email change workflow
  - Password update
  - 2FA management
  - Account deletion
  - Privacy settings
  
- ✅ **User Analytics**
  - Login history
  - Activity tracking
  - Usage metrics
  - Subscription analytics

### 🎨 User Interface

- ✅ **Modern Design**
  - Responsive layouts
  - Mobile-first approach
  - Dark/light theme support
  - Accessibility compliant (WCAG 2.1)
  
- ✅ **Component Library**
  - shadcn/ui components
  - Reusable UI patterns
  - Form validation
  - Loading states
  - Error handling
  
- ✅ **Admin Dashboard**
  - User management interface
  - Role and permission editor
  - Subscription analytics
  - Payment history
  - System logs

### 🔧 Developer Experience

- ✅ **Type Safety**
  - Full TypeScript support
  - Type-safe database queries
  - API type definitions
  - Strict type checking
  
- ✅ **Code Quality**
  - ESLint configuration
  - Prettier formatting
  - Pre-commit hooks
  - Code review guidelines
  
- ✅ **Testing Support**
  - Unit test setup
  - Integration test examples
  - E2E test framework
  - Test utilities
  
- ✅ **Documentation**
  - Comprehensive guides
  - API documentation
  - Code examples
  - Best practices

---

## 🧩 Core Modules

### 1. Authentication Module

**Location**: `src/app/auth/*`, `src/lib/auth/*`

Complete authentication system with:
- User registration and login
- OAuth provider integration
- Email verification workflow
- Password reset functionality
- 2FA setup and verification
- Session management

**Key Files**:
- `src/config/auth.ts` - NextAuth.js configuration
- `src/lib/auth/providers/*` - OAuth providers
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/signup/page.tsx` - Registration page

### 2. RBAC Module

**Location**: `src/lib/rbac/*`, `src/app/api/rbac/*`

Policy-based access control system:
- Role management APIs
- Permission assignment
- Policy evaluation engine
- Middleware protection
- Cache management

**Key Files**:
- `src/lib/rbac/rbac-service.ts` - Core RBAC logic
- `src/lib/rbac/policy-middleware.ts` - API protection
- `src/lib/rbac/index.ts` - Policy constants
- `src/app/api/rbac/*` - Management APIs

### 3. Payment Gateway Module

**Location**: `src/lib/payments/*`, `src/app/api/payments/*`

Payment processing system:
- Order creation and tracking
- Payment verification
- Subscription management
- Invoice handling
- Transaction logging

**Key Files**:
- `src/lib/payments/gateway.ts` - Provider abstraction
- `src/lib/payments/providers/razorpay.ts` - Razorpay integration
- `src/app/api/payments/*` - Payment APIs

### 4. Database Module

**Location**: `src/server/db/*`

Type-safe database layer:
- Schema definitions
- Migrations
- Seeding scripts
- Query utilities
- Relationships

**Key Files**:
- `src/server/db/schema/schema.ts` - Database schema
- `src/server/db/index.ts` - Database client
- `scripts/db-seed.ts` - Seeding script

### 5. User Management Module

**Location**: `src/app/protected/*`, `src/components/user/*`

User interface and management:
- User dashboard
- Profile management
- Settings pages
- Admin panels
- Analytics views

**Key Files**:
- `src/app/protected/user/*` - User pages
- `src/app/protected/admin/*` - Admin pages
- `src/components/user/*` - User components

### 6. Email Service Module

**Location**: `src/lib/email/*`

Email notification system:
- Verification emails
- Password reset emails
- Welcome emails
- Subscription notifications
- Transaction receipts

**Key Files**:
- `src/lib/email/templates/*` - Email templates
- `src/lib/email/sender.ts` - Email sending logic

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.0+ | React framework with App Router |
| **React** | 18.0+ | UI library |
| **TypeScript** | 5.0+ | Type-safe development |
| **Tailwind CSS** | 3.4+ | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Headless UI primitives |
| **React Hook Form** | 7.0+ | Form management |
| **Zod** | 3.0+ | Schema validation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.0+ | RESTful API endpoints |
| **NextAuth.js** | 5.0+ | Authentication solution |
| **Drizzle ORM** | Latest | Type-safe ORM |
| **PostgreSQL** | 14.0+ | Primary database |
| **Bcrypt** | 5.0+ | Password hashing |
| **Jose** | 5.0+ | JWT handling |

### Payment & Services

| Technology | Version | Purpose |
|------------|---------|---------|
| **Razorpay** | Latest | Payment gateway |
| **Nodemailer** | 6.0+ | Email service |
| **QRCode** | 1.5+ | 2FA QR generation |
| **Crypto** | Native | HMAC verification |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.0+ | Code linting |
| **Prettier** | 3.0+ | Code formatting |
| **Husky** | 8.0+ | Git hooks |
| **TypeScript ESLint** | 6.0+ | TypeScript linting |

---

## 📋 Prerequisites

Before installing AuthPay, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Recommended | Download |
|----------|----------------|-------------|----------|
| **Node.js** | 18.17.0 | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.0.0 | 10.x | Included with Node.js |
| **PostgreSQL** | 14.0 | 15.x | [postgresql.org](https://www.postgresql.org/) |
| **Git** | 2.30.0 | Latest | [git-scm.com](https://git-scm.com/) |

### Verify Installation

Run these commands to check your installation:

```bash
# Check Node.js version
node --version
# Should output: v18.17.0 or higher

# Check npm version
npm --version
# Should output: v9.0.0 or higher

# Check PostgreSQL version
psql --version
# Should output: psql (PostgreSQL) 14.0 or higher

# Check Git version
git --version
# Should output: git version 2.30.0 or higher
```

### System Requirements

**Minimum**:
- RAM: 4 GB
- Storage: 500 MB free space
- CPU: Dual-core processor
- OS: Windows 10/11, macOS 11+, Ubuntu 20.04+

**Recommended**:
- RAM: 8 GB or more
- Storage: 1 GB free space
- CPU: Quad-core processor
- OS: Latest stable versions

### Optional Tools

- **Docker** - For containerized PostgreSQL
- **pgAdmin** or **DBeaver** - Database management GUI
- **Postman** or **Insomnia** - API testing
- **VS Code** - Recommended code editor

---

## ⚡ Quick Start

Get AuthPay running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/sutharpratik10/AuthPay.git
cd AuthPay

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# 4. Set up database
npx drizzle-kit push

# 5. Seed initial data
npx tsx scripts/db-seed.ts

# 6. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and login with:
- **Admin**: `admin@example.com` / `admin`
- **User**: `user@example.com` / `user`

---

## 💿 Installation

### Step 1: Clone Repository

```bash
# Using HTTPS
git clone https://github.com/sutharpratik10/AuthPay.git

# Or using SSH
git clone git@github.com:sutharpratik10/AuthPay.git

# Navigate to project directory
cd AuthPay
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
npm install

# This installs:
# - Next.js and React
# - TypeScript and type definitions
# - Drizzle ORM and PostgreSQL driver
# - NextAuth.js and authentication libraries
# - Tailwind CSS and UI components
# - Payment gateway SDKs
# - Email service libraries
# - Development tools
```

### Step 3: Database Setup

Choose one of these options:

#### Option A: Local PostgreSQL

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE authpay_db;

# Create user (optional)
CREATE USER authpay_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE authpay_db TO authpay_user;

# Exit
\q
```

#### Option B: Docker PostgreSQL

```bash
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: authpay_postgres
    environment:
      POSTGRES_USER: authpay_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: authpay_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
EOF

# Start container
docker-compose up -d
```

#### Option C: Cloud Database

Use services like:
- **Supabase** - [supabase.com](https://supabase.com)
- **Neon** - [neon.tech](https://neon.tech)
- **Railway** - [railway.app](https://railway.app)

### Step 4: Environment Configuration

```bash
# Copy example environment file
cp env.example .env.local

# Edit .env.local with your settings
nano .env.local  # or use your preferred editor
```

**Minimum required variables**:

```bash
# Database
DATABASE_URL="postgresql://authpay_user:secure_password@localhost:5432/authpay_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Razorpay (Test Mode)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
```

**Generate secure secret**:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 5: Database Migration

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push
```

**Expected output**:
```
✅ Connecting to database...
✅ Connected successfully!
✅ Pushing schema changes...
📦 Tables created: users, roles, permissions, user_roles, ...
✅ Schema push completed successfully!
```

### Step 6: Seed Database

```bash
# Seed with initial data
npx tsx scripts/db-seed.ts
```

**This creates**:
- Default roles (admin, user)
- Admin user: `admin@example.com` / `admin`
- Regular user: `user@example.com` / `user`
- Subscription plans (Free, Pro, Enterprise)
- Subscription statuses and types

### Step 7: Start Development Server

```bash
# Start Next.js development server
npm run dev

# Or with turbopack (faster)
npm run dev -- --turbo
```

**Application URLs**:
- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Admin Dashboard**: http://localhost:3000/protected/admin
- **User Dashboard**: http://localhost:3000/protected/user/dashboard

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file in the root directory:

```bash
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/authpay_db"

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# ============================================
# OAuth Providers (Optional)
# ============================================
# Google
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Facebook
FACEBOOK_ID="your-facebook-app-id"
FACEBOOK_SECRET="your-facebook-app-secret"

# Microsoft Azure AD
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"

# Apple
APPLE_ID="your-apple-service-id"
APPLE_SECRET="your-apple-private-key"

# ============================================
# Email Service Configuration (Optional)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="noreply@yourapp.com"

# ============================================
# Payment Gateway (Razorpay)
# ============================================
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# ============================================
# Application Settings
# ============================================
NODE_ENV="development"
PORT="3000"
```

For detailed configuration guide, see [docs/installation.md](./docs/installation.md).

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

### Getting Started

- **[Installation Guide](./docs/installation.md)** - Complete setup walkthrough
- **[Overview](./docs/01-OVERVIEW.md)** - System architecture and design
- **[Project Structure](./docs/01-OVERVIEW.md#project-structure)** - Directory organization

### Core Systems

- **[Authentication](./docs/02-AUTHENTICATION.md)** - Auth flows, OAuth, 2FA
- **[RBAC System](./docs/03-RBAC.md)** - Roles, permissions, policies
- **[Database](./docs/04-DATABASE.md)** - Schema, migrations, queries
- **[API Routes](./docs/05-API-ROUTES.md)** - API reference and examples
- **[Routing](./docs/06-ROUTING.md)** - Navigation and route protection
- **[Payment Gateway](./docs/07-PAYMENT-GATEWAY.md)** - Payment integration guide

### Quick Links

```
docs/
├── installation.md              # Fresh installation guide
├── 00-DOCUMENTATION-SUMMARY.md  # Documentation overview
├── 01-OVERVIEW.md               # System architecture
├── 02-AUTHENTICATION.md         # Authentication system
├── 03-RBAC.md                   # Role-based access control
├── 04-DATABASE.md               # Database schema
├── 05-API-ROUTES.md             # API documentation
├── 06-ROUTING.md                # Routing system
└── 07-PAYMENT-GATEWAY.md        # Payment integration
```

---

## 📁 Project Structure

```
AuthPay/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication APIs
│   │   │   ├── rbac/            # RBAC management APIs
│   │   │   ├── payments/        # Payment APIs
│   │   │   └── user/            # User management APIs
│   │   ├── auth/                # Auth pages (login, signup, etc.)
│   │   ├── protected/           # Protected routes
│   │   │   ├── admin/          # Admin dashboard
│   │   │   └── user/           # User dashboard
│   │   └── page.tsx             # Homepage
│   │
│   ├── components/              # React components
│   │   ├── auth/               # Auth-related components
│   │   ├── admin/              # Admin components
│   │   ├── user/               # User components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── lib/                     # Shared utilities
│   │   ├── auth/               # Auth utilities
│   │   ├── rbac/               # RBAC utilities
│   │   ├── payments/           # Payment utilities
│   │   └── email/              # Email utilities
│   │
│   ├── server/                  # Server-side code
│   │   ├── db/                 # Database layer
│   │   │   └── schema/         # Drizzle schema
│   │   └── services/           # Business logic
│   │
│   ├── config/                  # Configuration files
│   │   └── auth.ts             # NextAuth config
│   │
│   └── types/                   # TypeScript types
│
├── scripts/                     # Utility scripts
│   ├── db-seed.ts              # Database seeding
│   └── test-connection.ts      # DB connection test
│
├── docs/                        # Documentation
│   ├── installation.md         # Installation guide
│   ├── 01-OVERVIEW.md          # System overview
│   ├── 02-AUTHENTICATION.md    # Auth documentation
│   ├── 03-RBAC.md              # RBAC documentation
│   ├── 04-DATABASE.md          # Database documentation
│   ├── 05-API-ROUTES.md        # API documentation
│   ├── 06-ROUTING.md           # Routing documentation
│   └── 07-PAYMENT-GATEWAY.md   # Payment documentation
│
├── public/                      # Static files
├── .env.example                 # Environment template
├── drizzle.config.ts           # Drizzle ORM config
├── next.config.ts              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## 🔌 API Routes

### Authentication APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/signup` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/logout` | POST | Logout user | Yes |
| `/api/auth/verify-email` | POST | Verify email address | No |
| `/api/auth/forgot-password` | POST | Request password reset | No |
| `/api/auth/reset-password` | POST | Reset password | No |
| `/api/auth/2fa/setup` | POST | Setup 2FA | Yes |
| `/api/auth/2fa/verify` | POST | Verify 2FA code | Yes |

### RBAC APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/rbac/roles` | GET | List all roles | Admin |
| `/api/rbac/roles/create` | POST | Create new role | Admin |
| `/api/rbac/roles/[id]` | PUT/DELETE | Update/delete role | Admin |
| `/api/rbac/policies` | GET | List all policies | Admin |
| `/api/rbac/users/[id]/roles` | GET/POST/DELETE | Manage user roles | Admin |
| `/api/rbac/check-permission` | POST | Check permission | Yes |

### Payment APIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/payments/razorpay-create-order` | POST | Create payment order | Yes |
| `/api/payments/razorpay-payments` | GET | List payments | Yes |
| `/api/payments/razorpay-subscriptions` | GET | List subscriptions | Yes |
| `/api/payments/razorpay-subscriptions/create` | POST | Create subscription | Yes |
| `/api/payments/razorpay-plans` | GET | List plans | Yes |

For complete API documentation, see [docs/05-API-ROUTES.md](./docs/05-API-ROUTES.md).

---

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts and profiles
- **roles** - System and custom roles
- **permissions** - Policy definitions
- **user_roles** - User-role assignments (many-to-many)
- **role_permissions** - Role-permission assignments (many-to-many)
- **sessions** - Active user sessions
- **otp_codes** - Email verification and 2FA codes
- **two_factor_auth** - 2FA configuration

### Payment Tables

- **payment_orders** - Payment order tracking
- **payment_transactions** - Transaction history
- **subscription_plans** - Available plans
- **user_subscriptions** - User subscription data
- **subscription_statuses** - Status definitions
- **subscription_renewal_types** - Renewal configurations

For detailed schema documentation, see [docs/04-DATABASE.md](./docs/04-DATABASE.md).

---

## 🔐 OAuth Providers

### Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### GitHub OAuth

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### Other Providers

See [docs/02-AUTHENTICATION.md#oauth-providers](./docs/02-AUTHENTICATION.md#oauth-providers) for:
- Facebook
- Microsoft Azure AD
- Apple Sign-In

---

## 🚀 Deployment

### Production Build

```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Variables

Update `.env.production`:

```bash
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="your-production-database-url"
RAZORPAY_KEY_ID="rzp_live_xxxxxx"
RAZORPAY_KEY_SECRET="your-live-secret"
```

### Deployment Platforms

- **Vercel** (Recommended) - Zero-config deployment
- **Netlify** - Edge functions support
- **Railway** - Full-stack deployment
- **AWS** - EC2, ECS, or Lambda
- **DigitalOcean** - App Platform or Droplets

### Production Checklist

- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Update all default passwords
- [ ] Use production database credentials
- [ ] Enable HTTPS
- [ ] Use live Razorpay keys
- [ ] Configure CORS
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Configure backups
- [ ] Review security headers

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feature/your-feature`
6. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass

### Reporting Issues

Use GitHub Issues to report bugs or suggest features. Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Documentation

- [Installation Guide](./docs/installation.md)
- [Complete Documentation](./docs/)
- [API Reference](./docs/05-API-ROUTES.md)

### Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/sutharpratik10/AuthPay/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/sutharpratik10/AuthPay/discussions)

### Contact

- **Email**: sutharpratik10@gmail.com
- **GitHub**: [@sutharpratik10](https://github.com/sutharpratik10)

---

## 👤 Author

**Pratik Suthar**

- GitHub: [@sutharpratik10](https://github.com/sutharpratik10)
- Email: sutharpratik10@gmail.com

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - The React Framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [Razorpay](https://razorpay.com/) - Payment gateway
- [PostgreSQL](https://www.postgresql.org/) - Database

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/sutharpratik10/AuthPay?style=social)
![GitHub forks](https://img.shields.io/github/forks/sutharpratik10/AuthPay?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/sutharpratik10/AuthPay?style=social)

---

<div align="center">

**[⬆ Back to Top](#authpay--nextjs-authentication-payments--rbac-platform)**

Made with ❤️ by [Pratik Suthar](https://github.com/sutharpratik10)

⭐ Star this repo if you find it helpful!

</div>
