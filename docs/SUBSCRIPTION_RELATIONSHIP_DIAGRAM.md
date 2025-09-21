# User-Subscription Relationship in Current System

## Database Tables Relationship

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────────────┐
│    users    │    │ tenant_users │    │   tenants   │    │ subscription_plans  │
├─────────────┤    ├──────────────┤    ├─────────────┤    ├─────────────────────┤
│ id (PK)     │◄───┤ userId (FK)  │    │ id (PK)     │    │ id (PK)             │
│ email       │    │ tenantId(FK) ├───►│ planId (FK) ├───►│ name                │
│ name        │    │ isOwner      │    │ name        │    │ description         │
│ role        │    │ isPrimary    │    │ slug        │    │ price               │
│ ...         │    │ status       │    │ planEffective│    │ billingCycle        │
└─────────────┘    │ joinedAt     │    │ planExpiry  │    │ features            │
                   └──────────────┘    │ isActive    │    │ isActive            │
                                       └─────────────┘    └─────────────────────┘
```

## Current Implementation Logic

### When Assigning Subscription:

1. **User exists** → Check `users` table
2. **Find user's tenant** → Query `tenant_users` JOIN `tenants`
3. **If no tenant exists**:
   - Create new record in `tenants` table with `planId`
   - Create link in `tenant_users` table
4. **If tenant exists**:
   - Update `tenants.planId` field

### Data Storage Locations:

- **User Info**: `users.{id, email, name, role}`
- **Subscription Plan**: `subscription_plans.{id, name, price, billingCycle}`
- **Assignment Link**: `tenants.planId` → `subscription_plans.id`
- **User-Tenant Link**: `tenant_users.{userId, tenantId}`
- **Subscription Dates**: `tenants.{planEffectiveDate, planExpiryDate}`

### Query to Get User with Subscription:

```sql
SELECT 
  u.id, u.email, u.name, u.role,
  sp.name as subscriptionName,
  sp.billingCycle as subscriptionBillingCycle,
  t.planEffectiveDate as subscriptionStartDate,
  t.planExpiryDate as subscriptionExpiryDate
FROM users u
LEFT JOIN tenant_users tu ON u.id = tu.userId
LEFT JOIN tenants t ON tu.tenantId = t.id  
LEFT JOIN subscription_plans sp ON t.planId = sp.id
```

## Alternative Approach (Direct Relationship)

If you prefer a more direct relationship, you could add:

```sql
-- Add subscription fields directly to users table
ALTER TABLE users ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE users ADD COLUMN subscription_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN subscription_expiry_date TIMESTAMP;
```

But the current tenant-based approach allows for:
- Multi-tenant support (users can belong to multiple organizations)
- Organizational subscriptions 
- More flexibility for enterprise features
