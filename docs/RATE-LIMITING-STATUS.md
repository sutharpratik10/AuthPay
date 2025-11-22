# Rate Limiting Implementation Status

## ✅ Protected Routes (Rate Limited)

### Public Routes (100 req/min - readOnly)
- ✅ `/api/subscription-plans` - GET

### Auth Routes (5 req/15min - auth)
- ✅ `/api/auth/check-email` - POST

### User Routes (60 req/min - api)
- ✅ `/api/user/data` - GET
- ✅ `/api/user/admin-status` - GET

## ⚠️ Routes Requiring Rate Limiting

### Critical Auth Routes (Need `rateLimiters.auth` - 5 req/15min)
- [ ] `/api/auth/validate-credentials` - POST
- [ ] `/api/auth/validate-password` - POST
- [ ] `/api/auth/verify-password` - POST
- [ ] `/api/auth/forgot-password` - POST
- [ ] `/api/auth/reset-password` - POST
- [ ] `/api/auth/send-otp` - POST
- [ ] `/api/auth/verify-2fa` - POST
- [ ] `/api/auth/resend-2fa` - POST
- [ ] `/api/auth/check-2fa-status` - POST
- [ ] `/api/auth/verify-reset-code` - POST
- [ ] `/api/auth/check-suspension` - POST
- [ ] `/api/auth/generate-temp-token` - POST

### Sensitive User Routes (Need `rateLimiters.sensitive` - 3 req/hour)
- [ ] `/api/user/delete-account` - DELETE
- [ ] `/api/user/set-password` - POST
- [ ] `/api/auth/change-password` - POST
- [ ] `/api/auth/force-logout` - POST

### Standard API Routes (Need `rateLimiters.api` - 60 req/min)
- [ ] `/api/user/subscription-status` - GET
- [ ] `/api/user/subscription-history` - GET
- [ ] `/api/user/password-status` - GET
- [ ] `/api/user/sessions` - GET/POST/DELETE
- [ ] `/api/user/preferences` - GET/POST
- [ ] `/api/subscription-plans/[id]` - GET
- [ ] `/api/subscription-plans/purchase` - POST

### RBAC Routes (Need `rateLimiters.api` - 60 req/min)
- [ ] `/api/rbac/check-permission` - POST
- [ ] `/api/rbac/roles` - GET
- [ ] `/api/rbac/roles/create` - POST
- [ ] `/api/rbac/roles/[roleId]` - PUT/DELETE
- [ ] `/api/rbac/roles/[roleId]/policies` - GET/POST/DELETE
- [ ] `/api/rbac/policies` - GET
- [ ] `/api/rbac/policies/create` - POST
- [ ] `/api/rbac/policies/[policyId]` - PUT/DELETE
- [ ] `/api/rbac/users/[userId]/roles` - GET/POST/DELETE
- [ ] `/api/rbac/users/[userId]/policies` - GET
- [ ] `/api/rbac/user/dashboard` - GET

### Payment Routes (Need `rateLimiters.api` - 60 req/min)
- [ ] `/api/payments/razorpay-create-order` - POST
- [ ] `/api/payments/razorpay-subscriptions` - GET/POST/PATCH

### Admin Routes (Need `rateLimiters.api` - 60 req/min)
- [ ] `/api/admin/sessions` - GET/POST
- [ ] `/api/admin/dashboard-stats` - GET
- [ ] `/api/admin/subscription-plans/[planId]/active-user-count` - GET

### Health Check Routes (Need `rateLimiters.readOnly` - 100 req/min)
- [ ] `/api/health/newrelic` - GET

## How to Apply Rate Limiting

### For Routes Using `withApiHandler`
```typescript
import { rateLimiters } from '@/lib/middleware/rate-limit';

export const GET = rateLimiters.api(
  withApiHandler(
    async (request: NextRequest, { user }) => {
      // Your handler code
    },
    { requireAuth: true }
  )
);
```

### For Standard Route Functions
```typescript
import { rateLimiters } from '@/lib/middleware/rate-limit';

export const POST = rateLimiters.auth(async (req: NextRequest) => {
  // Your handler code
});
```

## Rate Limiting Tiers

| Tier | Limits | Use Case |
|------|--------|----------|
| `readOnly` | 100 req/min | Public read endpoints |
| `api` | 60 req/min | Standard API operations |
| `auth` | 5 req/15min | Authentication endpoints |
| `sensitive` | 3 req/hour | Account deletion, password changes |

## Priority Implementation Order

1. **CRITICAL** - Auth routes (prevent brute force)
2. **HIGH** - Sensitive operations (prevent abuse)
3. **MEDIUM** - Standard API routes (prevent overload)
4. **LOW** - Health checks and monitoring

## Testing Rate Limits

```bash
# Test a specific endpoint
node scripts/test-rate-limit.js /api/auth/check-email 10

# Load test all routes
node scripts/load-test.js medium
```
