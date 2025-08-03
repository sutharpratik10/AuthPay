# SQL Seeding Scripts for Saasly RBAC System

This directory contains SQL scripts that you can run directly against your PostgreSQL database to seed the necessary data for the RBAC system.

## Files

### `00-master-seed.sql`
**Complete seeding script that includes everything in the correct order.**
- Subscription plans (7 plans: Free, Starter, Professional, Enterprise + Annual variants)
- RBAC users (admin and test user)
- Tenants for both users
- Displays results and summary

### `01-seed-subscription-plans.sql`
**Subscription plans only.**
- 7 comprehensive subscription plans
- Monthly and yearly billing options
- Rich feature sets in JSON format

### `02-seed-rbac-users.sql`
**RBAC users and tenants only.**
- Admin user with admin role
- Test user with user role
- Corresponding tenants for each user

## How to Run

### Option 1: Run the Master Script (Recommended)
```bash
psql -h localhost -U postgres -d rsvp -f scripts/sql/00-master-seed.sql
```

### Option 2: Run Individual Scripts
```bash
# First, seed subscription plans
psql -h localhost -U postgres -d rsvp -f scripts/sql/01-seed-subscription-plans.sql

# Then, seed RBAC data
psql -h localhost -U postgres -d rsvp -f scripts/sql/02-seed-rbac-users.sql
```

### Option 3: Copy and Paste
You can also copy the contents of any SQL file and paste it directly into your PostgreSQL client (pgAdmin, DBeaver, etc.).

## Default Credentials

After running the scripts, you'll have these test accounts:

### Admin User
- **Email**: admin@saasly.app
- **Password**: admin123
- **Role**: admin
- **Tenant**: Admin Organization (admin-org)
- **Plan**: Starter

### Test User
- **Email**: user@saasly.app
- **Password**: admin123
- **Role**: user
- **Tenant**: Test Organization (test-org)
- **Plan**: Free

## What Gets Created

### Subscription Plans (7 total)
1. **Free** ($0/month) - 1 tenant, 1GB storage
2. **Starter** ($9.99/month) - 3 tenants, 10GB storage
3. **Professional** ($29.99/month) - 10 tenants, 100GB storage
4. **Enterprise** ($99.99/month) - Unlimited tenants and storage
5. **Starter Annual** ($95.90/year) - 20% discount
6. **Professional Annual** ($287.90/year) - 20% discount
7. **Enterprise Annual** ($959.90/year) - 20% discount

### Users & Tenants
- 1 Admin user with full system access
- 1 Test user with limited access
- 2 Tenants (one for each user)
- All users are email verified and active

## Features

- **Safe to run multiple times** - Uses `ON CONFLICT` clauses
- **Transaction wrapped** - All changes are atomic
- **Detailed output** - Shows what was created
- **Production ready** - Proper data types and constraints
- **Password hashed** - Uses bcrypt for security

## Verification

After running the scripts, you can verify the data with:

```sql
-- Check subscription plans
SELECT name, price, billing_cycle FROM subscription_plans ORDER BY price;

-- Check users
SELECT email, name, role, is_active FROM users;

-- Check tenants
SELECT t.name, t.slug, u.email as owner, sp.name as plan 
FROM tenants t 
JOIN users u ON t.owner_id = u.id 
LEFT JOIN subscription_plans sp ON t.subscription_plan_id = sp.id;
```

## RBAC Permissions

The system uses the simplified role-based approach:

### Admin Role
- Full access to all system features
- Can manage users and change roles
- Can access all admin endpoints
- 25+ permissions including user management, system settings

### User Role  
- Limited access to user features
- Can manage own profile and tenant
- Can purchase/manage subscriptions
- Can access content based on subscription plan
- ~8 permissions focused on self-service operations

## Next Steps

1. Run the master seeding script
2. Test login with the provided credentials
3. Verify RBAC permissions are working
4. Customize subscription plans as needed
5. Add more test users if required

The seeding is complete and production-ready! 🚀
