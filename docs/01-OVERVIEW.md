# Authpay - Overview

## Table of Contents
- [Introduction](#introduction)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Getting Started](#getting-started)

## Introduction

**Authpay** is a production-ready Next.js application that combines robust authentication, role-based access control (RBAC), and payment processing capabilities. Built with modern web technologies, it provides a scalable foundation for SaaS applications requiring secure user management and subscription-based services.

### What is Authpay?

Authpay is designed to solve common challenges in building secure web applications:
- **Authentication**: Secure user registration, login, and session management
- **Authorization**: Fine-grained permission control through policy-based RBAC
- **Payment Processing**: Integrated subscription and payment management
- **Email Services**: Automated email notifications and verification

### Who Should Use Authpay?

- Developers building SaaS applications
- Teams needing a secure authentication system
- Projects requiring role-based access control
- Applications with subscription-based business models

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  (Next.js App Router, React Components, Tailwind CSS)   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Middleware Layer                         │
│     (Authentication, Authorization, Route Protection)    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   API Layer                              │
│  (REST APIs, NextAuth, RBAC APIs, Payment APIs)         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Service Layer                            │
│  (Auth Service, RBAC Service, Payment Service, Email)   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Data Layer                               │
│         (PostgreSQL, Drizzle ORM, Migrations)           │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **App Router**: Using Next.js 15 App Router for better performance and SEO
2. **Server Components**: Leverage server-side rendering where possible
3. **API Routes**: RESTful API design with consistent response patterns
4. **Type Safety**: Full TypeScript coverage for compile-time safety
5. **Database First**: Schema-driven development with Drizzle ORM
6. **Policy-Based RBAC**: Flexible permission system using policies instead of hardcoded roles

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router & Turbopack
- **React 19**: UI library with latest features
- **TypeScript 7.x**: Fully strictly typed development (`noImplicitAny`)
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library
- **React Hook Form**: Form validation and management
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **NextAuth.js 5**: Authentication library
- **Drizzle ORM**: Type-safe database toolkit (latest v0.44+)
- **PostgreSQL**: Multi-schema database architecture (`auth`, `rbac`, `billing`, `core`, `logs`)
- **Bcrypt**: Password hashing
- **JWT**: Token-based authentication

### DevOps & Tools
- **TypeScript**: Language and type system
- **ESLint**: Code linting
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Drizzle Kit**: Database migrations
- **TSX**: TypeScript execution for scripts

### Third-Party Services
- **Email Provider**: SMTP-based email delivery
- **Payment Gateway**: Razorpay integration
- **OAuth Providers**: Google, GitHub authentication

## Project Structure

```
Authpay/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── admin/           # Admin-specific APIs
│   │   │   ├── auth/            # Authentication APIs
│   │   │   ├── rbac/            # RBAC management APIs
│   │   │   └── payments/        # Payment processing APIs
│   │   ├── auth/                # Auth pages (login, signup)
│   │   ├── protected/           # Protected routes
│   │   │   ├── admin/          # Admin dashboard
│   │   │   └── user/           # User dashboard
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/              # React components
│   │   ├── admin/              # Admin components
│   │   ├── auth/               # Auth components
│   │   ├── layout/             # Layout components
│   │   ├── shared/             # Shared components
│   │   └── ui/                 # UI primitives (shadcn)
│   │
│   ├── config/                  # Configuration files
│   │   ├── auth.ts             # NextAuth configuration
│   │   └── auth.config.ts      # Auth options
│   │
│   ├── contexts/                # React contexts
│   │   ├── auth-context.tsx    # Auth state management
│   │   └── SubscriptionContext.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-cookie-consent.ts
│   │   ├── use-mobile.ts
│   │   └── use-subscription.ts
│   │
│   ├── lib/                     # Core libraries
│   │   ├── rbac/               # RBAC system
│   │   ├── auth/               # Auth utilities
│   │   ├── payments/           # Payment utilities
│   │   ├── email/              # Email services
│   │   └── utils/              # General utilities
│   │
│   ├── routes/                  # Routing system
│   │   ├── routeConfig.ts      # Route definitions
│   │   ├── routeUtils.ts       # Route helpers
│   │   └── routes.ts           # Route constants
│   │
│   ├── server/                  # Server-side code
│   │   ├── db/                 # Database
│   │   │   ├── schema/        # Drizzle schemas
│   │   │   └── migrations/    # SQL migrations
│   │   ├── services/          # Business logic
│   │   └── utils/             # Server utilities
│   │
│   ├── services/                # Application services
│   │   ├── auth.ts             # Auth service
│   │   ├── email-queue.ts      # Email queue
│   │   └── session.ts          # Session management
│   │
│   └── types/                   # TypeScript types
│       ├── next-auth.d.ts      # NextAuth types
│       └── subscription-plans.ts
│
├── scripts/                     # Utility scripts
│   ├── migrate-rbac.ts         # RBAC migration
│   ├── seed-rbac.ts            # Seed RBAC data
│   ├── db-seed.ts              # Database seeding
│   └── test-rbac-system.ts     # RBAC testing
│
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # E2E tests
│
├── docs/                        # Documentation
│   ├── 01-OVERVIEW.md          # This file
│   ├── 02-AUTHENTICATION.md    # Auth documentation
│   ├── 03-RBAC.md              # RBAC documentation
│   └── ...                     # Other docs
│
├── public/                      # Static assets
├── middleware.ts                # Next.js middleware
├── next.config.ts              # Next.js config
├── drizzle.config.ts           # Drizzle config
└── package.json                # Dependencies
```

## Key Features

### 1. Authentication System
- ✅ Email/password authentication
- ✅ OAuth providers (Google, GitHub)
- ✅ Email verification
- ✅ Password reset flow
- ✅ Two-factor authentication (2FA)
- ✅ Session management
- ✅ Secure password hashing

### 2. Role-Based Access Control (RBAC)
- ✅ Policy-based permission system
- ✅ Multi-role support per user
- ✅ Dynamic role assignment
- ✅ Permission caching (5-minute TTL)
- ✅ Admin override functionality
- ✅ Route-level protection
- ✅ API-level protection

### 3. Payment Processing
- ✅ Subscription management
- ✅ Razorpay integration
- ✅ Payment history
- ✅ Plan upgrades/downgrades
- ✅ Webhook handling

### 4. Email Services
- ✅ Email verification
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Queue-based email delivery
- ✅ Email templates

### 5. User Management
- ✅ User profiles
- ✅ Account settings
- ✅ Subscription management
- ✅ Admin user management

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 9.x or higher
- **Git**: Version control

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd Authpay

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# 4. Setup database
npm run db:migrate

# 5. Seed RBAC system
npx tsx scripts/seed-rbac.ts

# 6. Start development server
npm run dev
```

Visit `http://localhost:3000` to see your application.

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/Authpay

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Payment (optional)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### First Steps After Installation

1. **Create Admin User**:
   ```sql
   -- Connect to your database and run:
   INSERT INTO user_roles (user_id, role_id)
   SELECT 'your-user-id', id FROM roles WHERE name = 'Admin';
   ```

2. **Test RBAC System**:
   ```bash
   npx tsx scripts/test-rbac-system.ts
   ```

3. **Explore Admin Dashboard**:
   - Navigate to `/protected/admin/dashboard`
   - Manage users, roles, and permissions

4. **Review Documentation**:
   - Read module-specific documentation in `docs/` folder
   - Check example implementations in `src/app/api/examples/`

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test
```

### Database Commands

```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Drop database (development only)
npm run db:drop

# Open Drizzle Studio
npm run db:studio
```

## Documentation Structure

This documentation is organized into the following modules:

1. **01-OVERVIEW.md** (This file) - Project overview and architecture
2. **02-AUTHENTICATION.md** - Authentication system documentation
3. **03-RBAC.md** - Role-Based Access Control documentation
4. **04-DATABASE.md** - Database schema and migrations
5. **05-API-ROUTES.md** - API endpoints documentation
6. **06-ROUTING.md** - Routing system documentation
7. **07-COMPONENTS.md** - Component library documentation
8. **08-PAYMENT.md** - Payment processing documentation
9. **09-EMAIL.md** - Email services documentation
10. **10-TESTING.md** - Testing guide
11. **11-DEPLOYMENT.md** - Deployment guide
12. **12-SECURITY.md** - Security best practices

## Support and Resources

### Documentation
- **Module Documentation**: See `docs/` folder for detailed guides
- **API Examples**: Check `src/app/api/examples/` for reference implementations
- **Code Comments**: Inline documentation throughout codebase

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Guide](https://next-auth.js.org)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

### Getting Help
- Review existing documentation
- Check example implementations
- Inspect test files for usage patterns
- Review migration scripts for database changes

## Project Status

**Version**: 0.1.0  
**Status**: Production Ready  
**Last Updated**: October 2025

### Recent Updates
- ✅ RBAC system fully implemented
- ✅ Centralized routing system
- ✅ Policy-based middleware
- ✅ Admin dashboard complete
- ✅ Payment integration active
- ✅ Email services operational

## Contributing

### Code Standards
- Follow TypeScript best practices
- Use ESLint configuration
- Write tests for new features
- Update documentation
- Follow existing patterns

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with clear description
5. Address review feedback

## License

[Your License Here]

---

**Next Steps**: 
- Read [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) for authentication details
- Review [03-RBAC.md](./03-RBAC.md) for permission system
- Check [04-DATABASE.md](./04-DATABASE.md) for schema information
