# API Route Migration Quick Reference

## 🚀 Quick Start

Replace your old route pattern with the new centralized helper:

```typescript
// OLD PATTERN ❌
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await fetchData(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// NEW PATTERN ✅
import { withApiHandler, successResponse } from '@/lib/api-helpers';

export const GET = withApiHandler(
  async (request, { user }) => {
    const data = await fetchData(user!.id);
    return successResponse(data);
  },
  { requireAuth: true }
);
```

## 📋 Common Patterns

### 1. Public Route (No Auth Required)
```typescript
export const GET = withApiHandler(
  async (request, { user }) => {
    // user might be null
    const data = await fetchPublicData();
    return successResponse(data);
  }
  // No auth options
);
```

### 2. Authenticated Route
```typescript
export const GET = withApiHandler(
  async (request, { user }) => {
    // user is guaranteed to exist
    const data = await fetchUserData(user!.id);
    return successResponse(data);
  },
  { requireAuth: true }
);
```

### 3. Admin-Only Route
```typescript
export const DELETE = withApiHandler(
  async (request, { user }) => {
    // user is admin
    await deleteResource();
    return successResponse({ deleted: true });
  },
  { requireAuth: true, requireAdmin: true }
);
```

### 4. Permission-Based Route
```typescript
export const POST = withApiHandler(
  async (request, { user }) => {
    // user has specific permission
    await performAction();
    return successResponse({ success: true });
  },
  { requireAuth: true, permission: 'manage_users' }
);
```

### 5. Require Email Verification
```typescript
export const GET = withApiHandler(
  async (request, { user }) => {
    // user is authenticated AND email verified
    const data = await fetchData(user!.id);
    return successResponse(data);
  },
  { requireAuth: true, requireEmailVerified: true }
);
```

## 🗄️ Using Query Cache

### Before (Slow - DB Query)
```typescript
const status = await db.query.subscriptionStatuses.findFirst({
  where: eq(subscriptionStatuses.name, 'active'),
  columns: { id: true }
});
const statusId = status?.id;
```

### After (Fast - Cached)
```typescript
import { getStatusId } from '@/lib/query-cache';

const statusId = await getStatusId('active');
```

### Available Cache Functions
```typescript
// Status lookups
const statusId = await getStatusId('active');
const statusName = await getStatusName(statusId);

// Role lookups
const roleId = await getRoleId('admin');
const roleName = await getRoleName(roleId);

// Renewal type lookups
const renewalId = await getRenewalTypeId('auto');

// Batch operations
const statusIds = await getStatusIds(['active', 'cancelled', 'expired']);
```

## 📦 Request Handling

### Parse Request Body
```typescript
import { parseRequestBody } from '@/lib/api-helpers';

export const POST = withApiHandler(
  async (request, { user }) => {
    const { data, error } = await parseRequestBody(request);
    if (error) return error;
    
    // use data
    return successResponse({ received: data });
  },
  { requireAuth: true }
);
```

### Validate Required Fields
```typescript
import { parseRequestBody, validateRequiredFields } from '@/lib/api-helpers';

export const POST = withApiHandler(
  async (request, { user }) => {
    const { data, error } = await parseRequestBody(request);
    if (error) return error;
    
    const validation = validateRequiredFields(data, ['name', 'email']);
    if (!validation.valid) return validation.error!;
    
    // fields are validated
    return successResponse({ saved: true });
  },
  { requireAuth: true }
);
```

### Get Pagination Parameters
```typescript
import { getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export const GET = withApiHandler(
  async (request, { user }) => {
    const { page, limit, offset } = getPaginationParams(request);
    
    const items = await db.select()
      .from(table)
      .limit(limit)
      .offset(offset);
    
    const total = await db.select({ count: count() }).from(table);
    
    return paginatedResponse(items, {
      page,
      limit,
      total: total[0].count,
      pages: Math.ceil(total[0].count / limit)
    });
  },
  { requireAuth: true }
);
```

### Get Search Parameter
```typescript
import { getSearchParam } from '@/lib/api-helpers';

export const GET = withApiHandler(
  async (request, { user }) => {
    const search = getSearchParam(request);
    
    const results = await db.select()
      .from(table)
      .where(search ? ilike(table.name, `%${search}%`) : undefined);
    
    return successResponse({ results });
  },
  { requireAuth: true }
);
```

## 📊 Response Helpers

### Success Response
```typescript
import { successResponse } from '@/lib/api-helpers';

// Simple
return successResponse({ id: 123, name: 'John' });

// With message
return successResponse({ saved: true }, 'Successfully saved');

// With custom status
return successResponse({ created: true }, 'Created', 201);
```

### Error Response
```typescript
import { errorResponse } from '@/lib/api-helpers';

// Simple
return errorResponse('Not found', 404);

// With details (development only)
return errorResponse('Database error', 500, { query: 'SELECT...' });
```

### Paginated Response
```typescript
import { paginatedResponse } from '@/lib/api-helpers';

return paginatedResponse(
  items,
  {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  },
  'Optional message'
);
```

## 🎯 Performance Logging

### Simple Logging
```typescript
import { createPerformanceLogger } from '@/lib/api-helpers';

export const GET = withApiHandler(
  async (request, { user }) => {
    const logger = createPerformanceLogger(request);
    
    const data = await fetchData();
    logger.log('Data fetched');
    
    const processed = await processData(data);
    logger.log('Data processed');
    
    logger.end(user?.id);
    return successResponse(processed);
  },
  { requireAuth: true }
);
```

Output:
```
[API] GET /api/resource - Data fetched (123ms)
[API] GET /api/resource - Data processed (456ms)
[API] GET /api/resource [User: abc-123] - 456ms
```

## 🔄 Migration Checklist

For each route you migrate:

- [ ] Import `withApiHandler` and response helpers
- [ ] Replace `export async function` with `export const METHOD = withApiHandler(...)`
- [ ] Remove manual `auth()` and session checks
- [ ] Add appropriate auth options (`requireAuth`, `requireAdmin`, etc.)
- [ ] Replace `NextResponse.json()` with `successResponse()` or `errorResponse()`
- [ ] Replace status/role queries with cached lookups
- [ ] Add performance logging if needed
- [ ] Test the route
- [ ] Update related tests

## 🐛 Troubleshooting

### "user is possibly null"
```typescript
// ✅ SOLUTION: Use ! since requireAuth guarantees user exists
export const GET = withApiHandler(
  async (request, { user }) => {
    const data = await fetchData(user!.id);  // ← Add !
    return successResponse(data);
  },
  { requireAuth: true }  // ← This guarantees user exists
);
```

### Cache returns null
```typescript
// Cache miss - falls back to database
const statusId = await getStatusId('active');
if (!statusId) {
  // Handle missing status (rare - only if DB is empty)
  return errorResponse('Status not found', 500);
}
```

### Need to clear cache
```typescript
import { clearAllCaches, clearCache } from '@/lib/query-cache';

// Clear all caches
clearAllCaches();

// Clear specific cache
clearCache('status');  // or 'role' or 'renewal'
```

## 📚 More Examples

See refactored examples in:
- `src/app/api/user/admin-status/route.refactored.ts`
- `src/app/api/user/subscription-status/route.refactored.ts`

## 📖 Full Documentation

- Complete guide: `docs/ROUTING-OPTIMIZATION-PLAN.md`
- Full audit: `docs/CODEBASE-AUDIT-SUMMARY.md`
- Inline docs: Check `src/lib/api-helpers.ts`

---

**Need help?** Check the examples or ask the team! 🚀
