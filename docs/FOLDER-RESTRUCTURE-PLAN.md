# Codebase Folder Structure Restructuring Plan

## Executive Summary
This document outlines the plan to restructure the AuthPay codebase to follow industry-standard practices for Next.js 15 applications with App Router, making it easier to navigate, maintain, and scale.

## Current Issues

### 1. **Scattered Organization**
- API routes are deeply nested without clear grouping
- Utilities and helpers are mixed together in `lib/`
- Tests are separated from source code
- No clear separation between features

### 2. **Unclear Boundaries**
- Server-side and client-side code mixed
- Business logic spread across services, lib, and routes
- No clear domain separation

### 3. **Difficult Navigation**
- Hard to find related code
- No feature-based organization
- Documentation scattered

## Proposed Industry-Standard Structure

```
AuthPay/
├── .github/                          # GitHub-specific files
│   ├── workflows/                    # CI/CD pipelines
│   └── ISSUE_TEMPLATE/              # Issue templates
│
├── .next/                           # Next.js build output (gitignored)
├── .vscode/                         # VSCode workspace settings
├── node_modules/                    # Dependencies (gitignored)
│
├── public/                          # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Route group: Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── verify/
│   │   │   ├── forgot-password/
│   │   │   └── 2fa-verify/
│   │   │
│   │   ├── (marketing)/             # Route group: Public pages
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── privacy/
│   │   │   ├── cookies/
│   │   │   └── jobs/
│   │   │
│   │   ├── (dashboard)/             # Route group: Protected pages
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   ├── transactions/
│   │   │   │   └── paymentgateway/
│   │   │   ├── user/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── profile/
│   │   │   │   ├── settings/
│   │   │   │   ├── account/
│   │   │   │   └── manage-subscription/
│   │   │   └── layout.tsx           # Shared dashboard layout
│   │   │
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Authentication endpoints
│   │   │   ├── admin/               # Admin endpoints
│   │   │   ├── user/                # User endpoints
│   │   │   ├── payments/            # Payment endpoints
│   │   │   └── subscription-plans/  # Subscription endpoints
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── error.tsx                # Global error boundary
│   │   └── not-found.tsx            # 404 page
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Base UI components (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── auth/                    # Auth-related components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── otp-input.tsx
│   │   │   └── auth-links.tsx
│   │   │
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── user-management/
│   │   │   ├── role-management/
│   │   │   └── razorpay/
│   │   │
│   │   ├── user/                    # User-specific components
│   │   │   ├── subscription-dashboard.tsx
│   │   │   ├── subscription-plans-selector.tsx
│   │   │   └── profile-dropdown.tsx
│   │   │
│   │   └── shared/                  # Shared components
│   │       ├── cookie-banner.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── loading-spinner.tsx
│   │       └── error-message.tsx
│   │
│   ├── features/                    # Feature-based modules (NEW)
│   │   ├── auth/                    # Authentication feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── types.ts
│   │   │
│   │   ├── subscription/            # Subscription feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── types.ts
│   │   │
│   │   ├── payments/                # Payments feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── razorpay/
│   │   │   └── types.ts
│   │   │
│   │   └── admin/                   # Admin feature
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types.ts
│   │
│   ├── lib/                         # Core utilities (ORGANIZED)
│   │   ├── api/                     # API utilities
│   │   │   ├── helpers.ts           # withApiHandler, successResponse, etc.
│   │   │   ├── permissions.ts       # API permission middleware
│   │   │   └── validation.ts        # Request validation
│   │   │
│   │   ├── auth/                    # Auth utilities
│   │   │   ├── session.ts           # Session management
│   │   │   ├── validation.ts        # Auth validation
│   │   │   ├── password.ts          # Password utilities
│   │   │   └── roles.ts             # Role utilities
│   │   │
│   │   ├── cache/                   # Caching utilities
│   │   │   └── query-cache.ts       # DB query cache
│   │   │
│   │   ├── email/                   # Email utilities
│   │   │   ├── queue.ts             # Email queue
│   │   │   └── templates/           # Email templates
│   │   │
│   │   ├── payments/                # Payment utilities
│   │   │   └── razorpay.ts          # Razorpay helpers
│   │   │
│   │   └── utils/                   # General utilities
│   │       ├── analytics.ts
│   │       ├── client-info.ts
│   │       ├── config.ts
│   │       ├── constants.ts
│   │       └── helpers.ts
│   │
│   ├── server/                      # Server-only code (NEW)
│   │   ├── db/                      # Database
│   │   │   ├── index.ts             # DB connection
│   │   │   ├── schema/              # Drizzle schemas
│   │   │   ├── migrations/          # DB migrations
│   │   │   ├── queries/             # Reusable queries
│   │   │   └── utils/               # DB utilities
│   │   │
│   │   ├── services/                # Backend services
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── payment.service.ts
│   │   │
│   │   └── actions/                 # Server Actions (if using)
│   │       ├── auth.actions.ts
│   │       └── user.actions.ts
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-subscription.ts
│   │   ├── use-theme.ts
│   │   └── use-debounce.ts
│   │
│   ├── contexts/                    # React contexts
│   │   ├── auth-context.tsx
│   │   ├── theme-context.tsx
│   │   └── subscription-context.tsx
│   │
│   ├── types/                       # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── subscription.types.ts
│   │   ├── payment.types.ts
│   │   └── index.ts                 # Re-export all types
│   │
│   ├── config/                      # Configuration files (NEW)
│   │   ├── auth.config.ts           # NextAuth config
│   │   ├── database.config.ts       # Database config
│   │   ├── payment.config.ts        # Payment gateway config
│   │   └── env.config.ts            # Environment variables
│   │
│   ├── middleware.ts                # Next.js middleware
│   └── instrumentation.ts           # Next.js instrumentation
│
├── tests/                           # Test files (REORGANIZED)
│   ├── unit/                        # Unit tests
│   │   ├── lib/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── integration/                 # Integration tests
│   │   ├── api/
│   │   └── features/
│   │
│   ├── e2e/                         # End-to-end tests
│   │   ├── auth.spec.ts
│   │   └── subscription.spec.ts
│   │
│   ├── setup.ts                     # Test setup
│   └── helpers.ts                   # Test helpers
│
├── scripts/                         # Utility scripts
│   ├── db/
│   │   ├── seed.ts
│   │   ├── migrate.ts
│   │   └── backup.ts
│   ├── deploy.ts
│   └── generate-types.ts
│
├── docs/                            # Documentation
│   ├── api/                         # API documentation
│   ├── architecture/                # Architecture docs
│   ├── deployment/                  # Deployment guides
│   ├── development/                 # Development guides
│   └── README.md                    # Main docs README
│
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment (gitignored)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
├── drizzle.config.ts
├── package.json
└── README.md
```

## Key Improvements

### 1. **Route Groups**
- `(auth)` - Authentication pages without affecting URL structure
- `(marketing)` - Public marketing pages
- `(dashboard)` - Protected dashboard pages with shared layout

### 2. **Feature-Based Organization**
- Each major feature (auth, subscription, payments) in its own folder
- Colocated components, hooks, services, and types per feature
- Easier to find related code
- Better for team collaboration

### 3. **Clear Server/Client Separation**
- `src/server/` - Explicit server-only code
- `src/components/` - Client components (with 'use client' directive)
- `src/lib/` - Isomorphic utilities
- Prevents accidental client-side imports of server code

### 4. **Organized Utilities**
- `lib/api/` - API-specific utilities
- `lib/auth/` - Auth-specific utilities
- `lib/cache/` - Caching utilities
- `lib/email/` - Email utilities
- `lib/utils/` - General utilities

### 5. **Component Organization**
- `components/ui/` - Base UI components
- `components/layout/` - Layout components
- `components/auth/` - Auth components
- `components/admin/` - Admin components
- `components/user/` - User components
- `components/shared/` - Shared across features

### 6. **Centralized Configuration**
- All config files in `src/config/`
- Easy to find and manage
- Type-safe environment variables

### 7. **Better Testing Structure**
- Tests organized by type (unit, integration, e2e)
- Mirrors source structure for easy location
- Shared test utilities

## Migration Strategy

### Phase 1: Preparation (No Breaking Changes)
1. Create new folder structure
2. Set up path aliases in `tsconfig.json`
3. Document the new structure

### Phase 2: Move Utilities & Config
1. Move lib files to organized structure
2. Create `src/config/` and move config files
3. Update imports

### Phase 3: Reorganize Components
1. Move components to new structure
2. Update imports in components
3. Test UI rendering

### Phase 4: Feature Modules
1. Create feature folders
2. Move feature-specific code
3. Update imports

### Phase 5: Server Organization
1. Create `src/server/` folder
2. Move DB and services
3. Update API routes

### Phase 6: Route Groups
1. Create route groups in `app/`
2. Move pages to appropriate groups
3. Update navigation

### Phase 7: Testing & Documentation
1. Move tests to new structure
2. Update test imports
3. Update all documentation

## Implementation Notes

### Path Aliases (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/features/*": ["./src/features/*"],
      "@/server/*": ["./src/server/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/config/*": ["./src/config/*"]
    }
  }
}
```

### Benefits of New Structure

1. **Scalability**: Easy to add new features without cluttering existing code
2. **Maintainability**: Related code is colocated, easier to modify
3. **Onboarding**: New developers can quickly understand the structure
4. **Performance**: Clear separation allows better tree-shaking
5. **Testing**: Test files are organized and easy to locate
6. **Collaboration**: Teams can work on features independently

### Migration Checklist

- [ ] Create new folder structure
- [ ] Update tsconfig.json path aliases
- [ ] Move configuration files
- [ ] Reorganize lib utilities
- [ ] Restructure components
- [ ] Create feature modules
- [ ] Organize server code
- [ ] Set up route groups
- [ ] Move test files
- [ ] Update all imports
- [ ] Update documentation
- [ ] Test all functionality
- [ ] Update CI/CD pipelines
- [ ] Deploy to staging
- [ ] Deploy to production

## Timeline Estimate

- **Phase 1**: 1 day
- **Phase 2**: 2 days
- **Phase 3**: 3 days
- **Phase 4**: 3 days
- **Phase 5**: 2 days
- **Phase 6**: 2 days
- **Phase 7**: 2 days

**Total**: ~15 days (3 weeks with testing/buffer)

## Risk Mitigation

1. **Create backups** before major moves
2. **Incremental migration** - one phase at a time
3. **Extensive testing** after each phase
4. **Parallel branches** - keep old structure until verified
5. **Team communication** - inform all developers of changes

## Conclusion

This restructuring will transform AuthPay into a more maintainable, scalable, and industry-standard codebase. The new structure follows Next.js 15 best practices, improves developer experience, and makes the codebase easier to understand and navigate.
