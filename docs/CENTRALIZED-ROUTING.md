# Centralized Policy-Based Routing System

## Overview

All role-based routing logic has been centralized into the RBAC policy system. Instead of checking user roles throughout the application, we now use a unified routing utility that determines access based on RBAC policies.

## Key Files

### Core Routing Utilities
- **`src/lib/rbac/routing-utils.ts`** - Single source of truth for all routing logic
- **`src/app/api/rbac/user/dashboard/route.ts`** - API endpoint to get user's dashboard URL

### Updated Components
All components now use the centralized routing utilities:

1. **Layout Files**
   - `src/app/protected/admin/layout.tsx` - Uses `isAdminUser()` and `ROUTE_POLICIES`
   - `src/app/protected/user/layout.tsx` - Uses `isAdminUser()` and `ROUTE_POLICIES`
   - `src/app/auth/layout.tsx` - Uses `getAuthPageRedirect()`

2. **Auth Pages**
   - `src/app/auth/login/page.tsx` - Fetches dashboard from API
   - `src/app/auth/signup/page.tsx` - Fetches dashboard from API
   - `src/app/auth/verify/page.tsx` - Fetches dashboard from API

3. **Components**
   - `src/components/auth/auth-links.tsx` - Fetches dashboard from API
   - `src/components/layout/navigationbar.tsx` - Fetches dashboard from API
   - `src/contexts/auth-context.tsx` - Fetches dashboard from API
   - `src/app/payment/success/page.tsx` - Fetches dashboard from API

4. **Route Utilities**
   - `src/routes/authRoutes.tsx` - Uses `ROUTE_POLICIES`

## How It Works

### 1. Route Policy Configuration

All routes are defined in `ROUTE_POLICIES` with their required policies:

\`\`\`typescript
export const ROUTE_POLICIES = {
  ADMIN_DASHBOARD: {
    path: '/protected/admin/dashboard',
    policy: 'admin:access',
    fallback: '/protected/user/dashboard'
  },
  USER_DASHBOARD: {
    path: '/protected/user/dashboard',
    policy: 'user:access',
    fallback: '/auth/login'
  },
  // ... more routes
}
\`\`\`

### 2. Dashboard URL Determination

The `getDashboardUrl()` function is the **single source of truth** for determining which dashboard a user should see:

\`\`\`typescript
export async function getDashboardUrl(userId: string): Promise<string> {
  const hasAdminAccess = await RBACService.isAdmin(userId);
  
  if (hasAdminAccess) {
    return ROUTE_POLICIES.ADMIN_DASHBOARD.path;
  }
  
  return ROUTE_POLICIES.USER_DASHBOARD.path;
}
\`\`\`

### 3. Client-Side Usage

Client components fetch the dashboard URL from the API:

\`\`\`typescript
useEffect(() => {
  async function fetchDashboard() {
    if (user?.id) {
      const response = await fetch('/api/rbac/user/dashboard');
      const data = await response.json();
      if (data.dashboardUrl) {
        setDashboardPath(data.dashboardUrl);
      }
    }
  }
  fetchDashboard();
}, [user]);
\`\`\`

### 4. Server-Side Usage

Server components use the utility functions directly:

\`\`\`typescript
import { isAdminUser, ROUTE_POLICIES } from '@/lib/rbac/routing-utils';

export default async function AdminLayout({ children }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTE_POLICIES.AUTH_LOGIN.path);
  }

  const hasAdminAccess = await isAdminUser(session.user.id);
  
  if (!hasAdminAccess) {
    redirect(ROUTE_POLICIES.USER_DASHBOARD.path);
  }

  return <>{children}</>;
}
\`\`\`

## Making Changes

### To Change Dashboard Routing

Edit the `getDashboardUrl()` function in `src/lib/rbac/routing-utils.ts`:

\`\`\`typescript
export async function getDashboardUrl(userId: string): Promise<string> {
  // Add your custom logic here
  const hasAdminAccess = await RBACService.isAdmin(userId);
  const hasSuperAdminAccess = await RBACService.hasPolicy(userId, 'superadmin:access');
  
  if (hasSuperAdminAccess) {
    return '/protected/superadmin/dashboard';
  }
  
  if (hasAdminAccess) {
    return ROUTE_POLICIES.ADMIN_DASHBOARD.path;
  }
  
  return ROUTE_POLICIES.USER_DASHBOARD.path;
}
\`\`\`

### To Add a New Protected Route

1. Add it to `ROUTE_POLICIES`:

\`\`\`typescript
export const ROUTE_POLICIES = {
  // ... existing routes
  MODERATOR_DASHBOARD: {
    path: '/protected/moderator/dashboard',
    policy: 'moderator:access',
    fallback: '/protected/user/dashboard'
  }
}
\`\`\`

2. Update the `getDashboardUrl()` function if needed

3. Create the layout using the policy check:

\`\`\`typescript
export default async function ModeratorLayout({ children }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTE_POLICIES.AUTH_LOGIN.path);
  }

  const hasModeratorAccess = await RBACService.hasPolicy(
    session.user.id, 
    'moderator:access'
  );
  
  if (!hasModeratorAccess) {
    redirect(ROUTE_POLICIES.USER_DASHBOARD.path);
  }

  return <>{children}</>;
}
\`\`\`

### To Change Fallback Routes

Edit the `fallback` property in `ROUTE_POLICIES`:

\`\`\`typescript
ADMIN_DASHBOARD: {
  path: '/protected/admin/dashboard',
  policy: 'admin:access',
  fallback: '/access-denied' // Changed from user dashboard
}
\`\`\`

## Benefits

✅ **Single Source of Truth** - All routing logic in one place  
✅ **Policy-Based** - Uses RBAC policies instead of hard-coded roles  
✅ **Easy to Change** - Modify behavior without touching multiple files  
✅ **Type-Safe** - TypeScript constants for all routes  
✅ **Consistent** - Same logic everywhere in the application  
✅ **Scalable** - Easy to add new roles and routes  

## API Endpoint

### GET `/api/rbac/user/dashboard`

Returns the appropriate dashboard URL for the authenticated user.

**Response:**
\`\`\`json
{
  "success": true,
  "dashboardUrl": "/protected/admin/dashboard"
}
\`\`\`

**Usage:**
\`\`\`typescript
const response = await fetch('/api/rbac/user/dashboard');
const data = await response.json();
console.log(data.dashboardUrl); // "/protected/admin/dashboard"
\`\`\`

## Middleware Note

The `middleware.ts` file still contains role-based logic because it runs on the Edge Runtime and cannot make database calls. This is acceptable as it provides basic routing at the edge, while the detailed policy-based routing happens at the component level.

## Migration Status

All major components have been migrated to use the centralized policy-based routing system:

- ✅ Admin Layout
- ✅ User Layout  
- ✅ Auth Layout
- ✅ Login Page
- ✅ Signup Page
- ✅ Verify Page
- ✅ Navigation Bar
- ✅ Auth Links
- ✅ Auth Routes
- ✅ Payment Success Page
- ✅ Auth Context

## Legacy Components

The following components still use role-based logic but are not actively used:

- `src/components/auth/ProtectedPageWrapper.tsx` - Legacy server component
  - Layouts now handle protection directly
  - Can be removed if not used elsewhere

## Testing

To test the routing system:

1. **As Regular User:**
   - Login → Should see `/protected/user/dashboard`
   - All dashboard links should point to user dashboard

2. **As Admin:**
   - Login → Should see `/protected/admin/dashboard`
   - All dashboard links should point to admin dashboard
   - Can access `/protected/user/dashboard` but will redirect to admin

3. **Policy Changes:**
   - Add/remove admin policy from a user
   - Clear browser session and re-login
   - Should see appropriate dashboard based on new policies

## Troubleshooting

### User sees wrong dashboard
- Clear cache: `RBACService.clearCache(userId)`
- Check user's policies: `await RBACService.getUserPolicies(userId)`
- Verify admin status: `await RBACService.isAdmin(userId)`

### Redirect loops
- Check the auth layout logic
- Ensure email verification status is correct
- Look for conflicting redirects in middleware vs components

### API errors
- Verify `/api/rbac/user/dashboard` endpoint is accessible
- Check network tab for 401/403 errors
- Ensure user session is valid

## Future Enhancements

Potential improvements to consider:

1. **Route Authorization Middleware**
   - Centralized route authorization using `getAuthorizedRoute()`
   - Could replace individual layout checks

2. **Policy-Based Navigation**
   - Show/hide navigation items based on policies
   - Already partially implemented in sidebar

3. **Role Hierarchy**
   - Define role precedence (superadmin > admin > moderator > user)
   - Automatically grant lower-level access

4. **Caching Strategy**
   - Cache dashboard URLs on client
   - Invalidate on role/policy changes

5. **Audit Trail**
   - Log dashboard access attempts
   - Track policy-based redirects
