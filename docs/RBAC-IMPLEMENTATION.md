# RBAC Implementation Documentation

## Overview

This document describes the implemented Role-Based Access Control (RBAC) system for the Next.js/Drizzle multi-tenant SaaS application. The system is simplified for individual tenant usage (where tenants are individual users, not organizations).

## Architecture

### Simplified Design Decisions

1. **Two-Role System**: Only `admin` and `user` roles to keep the system simple
2. **User-Level Roles**: Each user has a single role stored directly in the `users` table
3. **Individual Tenants**: Tenants represent individual users, not organizations
4. **Permission-Based Access**: Predefined permissions based on user roles

### Database Schema Changes

#### Users Table Enhancement
```sql
-- Added role field to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;
-- Role can be 'admin' or 'user'
```

#### Removed Complex Tables
The following system-level tables were removed to simplify the architecture:
- `systemRoles`
- `systemRolePermissions`
- `userSystemRoles`

## Components

### 1. PermissionService (`src/services/permissions.ts`)

Central service for all permission-related operations:

```typescript
class PermissionService {
  // Check if user has specific permission
  static async hasPermission(userId: string, permission: string): Promise<boolean>
  
  // Get user role ('admin' | 'user' | null)
  static async getUserRole(userId: string): Promise<'admin' | 'user' | null>
  
  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean>
  
  // Get all permissions for user based on role
  static async getUserPermissions(userId: string): Promise<string[]>
  
  // Set user role (admin-only operation)
  static async setUserRole(adminUserId: string, targetUserId: string, role: 'admin' | 'user'): Promise<boolean>
}
```

### 2. API Permission Middleware (`src/lib/api-permissions.ts`)

Higher-order functions and utilities for protecting API routes:

```typescript
// Wrap API handlers with permission checking
withPermission(handler, { permission: 'user.view', adminOnly?: true })

// Utility functions for manual permission checks
checkPermission(permission: string)
requireAdmin()

// Predefined permission configurations
API_PERMISSIONS.USER_VIEW // { permission: 'user.view', adminOnly: true }
API_PERMISSIONS.PROFILE_EDIT // { permission: 'profile.edit' }
```

### 3. Updated Route Handlers

#### Example: Protected User Profile Route
```typescript
// src/app/api/user/profile/route.ts
export const PUT = withPermission(updateProfile, API_PERMISSIONS.PROFILE_EDIT);
```

#### Example: Admin User Management Route
```typescript
// src/app/api/admin/users/route.ts
export const GET = withPermission(getUsers, API_PERMISSIONS.USER_VIEW);
export const PATCH = withPermission(updateUserRole, API_PERMISSIONS.USER_EDIT);
```

### 4. Updated TenantRouteHandler

Modified to work with simplified permission system:
```typescript
// Uses PermissionService.hasPermission() instead of complex tenant-role relationships
protected async checkTenantAuthorization(req, tenantSlug, requiredPermission)
```

## Permission Structure

### Admin Permissions (Full Access)
```typescript
[
  // User management
  'user.view', 'user.create', 'user.edit', 'user.delete', 'user.manage',
  
  // Tenant management
  'tenant.view', 'tenant.create', 'tenant.edit', 'tenant.delete', 'tenant.manage',
  
  // Subscription management
  'subscription.view', 'subscription.create', 'subscription.edit', 
  'subscription.delete', 'subscription.manage', 'subscription.purchase', 'subscription.cancel',
  
  // Content management
  'content.view', 'content.create', 'content.edit', 'content.delete', 'content.manage',
  
  // System management
  'system.manage', 'analytics.view', 'logs.view', 'settings.manage',
  
  // Profile management
  'profile.view', 'profile.edit'
]
```

### User Permissions (Limited Access)
```typescript
[
  'subscription.view', 'subscription.purchase', 'subscription.cancel',
  'profile.view', 'profile.edit',
  'tenant.view', 'tenant.edit',  // Users can edit their own tenant
  'content.view', 'content.create', 'content.edit', 'content.delete'
]
```

## Seeding Scripts

### 1. Subscription Plans (`scripts/seed-subscription-plans.ts`)
Seeds default subscription plans:
- Free, Starter, Professional, Enterprise
- Monthly and Annual billing options
- Feature lists in JSON format

### 2. RBAC System (`scripts/seed-rbac-simplified.ts`)
Seeds:
- System permissions (for reference/future extensibility)
- Initial admin user (`admin@saasly.com` / `Admin123!`)
- Admin tenant organization

### 3. Master Script (`scripts/seed-all.ts`)
Runs both seeding operations in sequence.

### NPM Scripts
```json
{
  "db:seed": "ts-node -P tsconfig.scripts.json scripts/seed-all.ts",
  "db:seed:plans": "ts-node -P tsconfig.scripts.json scripts/seed-subscription-plans.ts",
  "db:seed:rbac": "ts-node -P tsconfig.scripts.json scripts/seed-rbac-simplified.ts"
}
```

## Testing

### Unit Tests
- `__tests__/services/permissions.test.ts` - PermissionService tests
- `__tests__/lib/api-permissions.test.ts` - API middleware tests

### Test Configuration
- Jest with TypeScript support
- Path mapping for `@/*` imports
- Mocked dependencies (database, auth)

### NPM Scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Usage Examples

### 1. Protecting an API Route
```typescript
import { withPermission, API_PERMISSIONS } from '@/lib/api-permissions';

async function myHandler(req: NextRequest) {
  // Handler logic - user is already authenticated and authorized
}

export const POST = withPermission(myHandler, API_PERMISSIONS.CONTENT_CREATE);
```

### 2. Manual Permission Checking
```typescript
import { checkPermission, requireAdmin } from '@/lib/api-permissions';

// Check specific permission
const { hasPermission, userId } = await checkPermission('user.edit');

// Require admin access
const { isAdmin, userId } = await requireAdmin();
```

### 3. Using Permission Service Directly
```typescript
import { PermissionService } from '@/services/permissions';

// Check permission
const canEdit = await PermissionService.hasPermission(userId, 'profile.edit');

// Promote user to admin
const success = await PermissionService.setUserRole(adminId, userId, 'admin');
```

## Security Considerations

1. **Fail-Safe Design**: Permission checks fail closed (deny access) on errors
2. **Authentication Required**: All protected routes require valid session
3. **Admin-Only Operations**: Sensitive operations restricted to admin users
4. **Input Validation**: All role changes validate role values
5. **Error Handling**: Graceful error handling without exposing sensitive information

## Deployment Checklist

1. **Database Setup**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

2. **Environment Variables**:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - NextAuth.js secret key

3. **Initial Admin Setup**:
   - Login with `admin@saasly.com` / `Admin123!`
   - Change default password immediately
   - Configure application settings

4. **Testing**:
   ```bash
   npm test
   npm run test:coverage
   ```

## Future Enhancements

1. **Role Hierarchy**: Add role inheritance (Super Admin → Admin → User)
2. **Custom Permissions**: Allow custom permission creation for tenants
3. **Permission Groups**: Group related permissions for easier management
4. **Audit Logging**: Track all permission changes and access attempts
5. **Permission Caching**: Cache permissions for better performance
6. **Fine-Grained Permissions**: Resource-level permissions (own vs. others)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure `DATABASE_URL` is configured
2. **Permission Denied**: Check user role and required permissions
3. **Seeding Failures**: Verify database schema is up to date
4. **Test Failures**: Ensure all dependencies are mocked properly

### Debug Commands
```bash
# Check database connection
npm run db:studio

# Verify schema
npm run db:generate

# Run specific tests
npm test -- --testNamePattern="PermissionService"
```

## Conclusion

This RBAC implementation provides a solid foundation for a multi-tenant SaaS application with individual user tenants. The simplified two-role system balances security with ease of use, while maintaining extensibility for future requirements.

The system is production-ready with comprehensive testing, proper error handling, and security best practices.
