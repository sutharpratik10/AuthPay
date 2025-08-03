-- =====================================================
-- MASTER SEEDING SCRIPT (FINAL CLEAN VERSION)
-- Run this script to seed all data in the correct order
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================

-- Insert subscription plans safely
INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Free',
    'Perfect for getting started',
    '0.00',
    'monthly',
    '["Basic features", "1 tenant", "Limited storage (1GB)", "Community support", "Basic analytics"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Free' AND billing_cycle = 'monthly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Starter',
    'For individuals and small teams',
    '9.99',
    'monthly',
    '["All Free features", "Up to 3 tenants", "Extended storage (10GB)", "Email support", "Advanced analytics", "Custom branding"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter' AND billing_cycle = 'monthly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Professional',
    'For growing businesses',
    '29.99',
    'monthly',
    '["All Starter features", "Up to 10 tenants", "Premium storage (100GB)", "Priority support", "API access", "Advanced integrations", "Team collaboration tools"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional' AND billing_cycle = 'monthly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Enterprise',
    'For large organizations',
    '99.99',
    'monthly',
    '["All Professional features", "Unlimited tenants", "Unlimited storage", "24/7 phone support", "Dedicated account manager", "Custom integrations", "Advanced security features", "SLA guarantee"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise' AND billing_cycle = 'monthly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Starter Annual',
    'For individuals and small teams (Annual billing)',
    '95.90',
    'yearly',
    '["All Free features", "Up to 3 tenants", "Extended storage (10GB)", "Email support", "Advanced analytics", "Custom branding", "20% discount on annual billing"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter Annual' AND billing_cycle = 'yearly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Professional Annual',
    'For growing businesses (Annual billing)',
    '287.90',
    'yearly',
    '["All Starter features", "Up to 10 tenants", "Premium storage (100GB)", "Priority support", "API access", "Advanced integrations", "Team collaboration tools", "20% discount on annual billing"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional Annual' AND billing_cycle = 'yearly');

INSERT INTO subscription_plans (
    id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Enterprise Annual',
    'For large organizations (Annual billing)',
    '959.90',
    'yearly',
    '["All Professional features", "Unlimited tenants", "Unlimited storage", "24/7 phone support", "Dedicated account manager", "Custom integrations", "Advanced security features", "SLA guarantee", "20% discount on annual billing"]',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise Annual' AND billing_cycle = 'yearly');

-- =====================================================
-- 2. RBAC USERS
-- =====================================================

-- Create admin user safely
INSERT INTO users (
    id,
    email,
    name,
    role,
    password,
    is_email_verified,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'admin@saasly.app',
    'System Administrator',
    'admin',
    '$2a$12$LQv3c1yqBw2lRdaHvJWOCOOzKzk3Fv8xVm8qyYzz8yFjKXkYq2b0W', -- password: admin123
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@saasly.app');

-- Update existing admin user
UPDATE users SET 
    role = 'admin',
    name = 'System Administrator',
    updated_at = NOW()
WHERE email = 'admin@saasly.app' AND EXISTS (SELECT 1 FROM users WHERE email = 'admin@saasly.app');

-- Create test user safely
INSERT INTO users (
    id,
    email,
    name,
    role,
    password,
    is_email_verified,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'user@saasly.app',
    'Test User',
    'user',
    '$2a$12$LQv3c1yqBw2lRdaHvJWOCOOzKzk3Fv8xVm8qyYzz8yFjKXkYq2b0W', -- password: admin123
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@saasly.app');

-- Update existing test user
UPDATE users SET 
    role = 'user',
    name = 'Test User',
    updated_at = NOW()
WHERE email = 'user@saasly.app' AND EXISTS (SELECT 1 FROM users WHERE email = 'user@saasly.app');

-- =====================================================
-- 3. TENANTS
-- =====================================================

-- Create admin tenant safely
INSERT INTO tenants (
    id,
    name,
    slug,
    plan_id,
    plan_effective_date,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Admin Organization',
    'admin-org',
    (SELECT id FROM subscription_plans WHERE name = 'Starter' AND billing_cycle = 'monthly' LIMIT 1),
    NOW(),
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'admin-org');

-- Update existing admin tenant
UPDATE tenants SET 
    name = 'Admin Organization',
    plan_id = (SELECT id FROM subscription_plans WHERE name = 'Starter' AND billing_cycle = 'monthly' LIMIT 1),
    updated_at = NOW()
WHERE slug = 'admin-org' AND EXISTS (SELECT 1 FROM tenants WHERE slug = 'admin-org');

-- Create test tenant safely
INSERT INTO tenants (
    id,
    name,
    slug,
    plan_id,
    plan_effective_date,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Test Organization',
    'test-org',
    (SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1),
    NOW(),
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'test-org');

-- Update existing test tenant
UPDATE tenants SET 
    name = 'Test Organization',
    plan_id = (SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1),
    updated_at = NOW()
WHERE slug = 'test-org' AND EXISTS (SELECT 1 FROM tenants WHERE slug = 'test-org');

-- =====================================================
-- 4. DISPLAY RESULTS
-- =====================================================

-- Show subscription plans
SELECT 
    '=== SUBSCRIPTION PLANS ===' as section,
    '' as name,
    '' as price,
    '' as billing_cycle,
    null as is_active
UNION ALL
SELECT 
    '',
    name,
    price,
    billing_cycle,
    is_active
FROM subscription_plans
ORDER BY section DESC, billing_cycle, price;

-- Show users
SELECT 
    '=== USERS ===' as section,
    '' as email,
    '' as name,
    '' as role,
    null as is_email_verified,
    null as is_active
UNION ALL
SELECT 
    '',
    email,
    name,
    role,
    is_email_verified,
    is_active
FROM users
WHERE email IN ('admin@saasly.app', 'user@saasly.app')
ORDER BY section DESC, role DESC;

-- Show tenants
SELECT 
    '=== TENANTS ===' as section,
    '' as name,
    '' as slug,
    '' as subscription_plan,
    null as is_active
UNION ALL
SELECT 
    '',
    t.name,
    t.slug,
    COALESCE(sp.name, 'No Plan') as subscription_plan,
    t.is_active
FROM tenants t
LEFT JOIN subscription_plans sp ON t.plan_id = sp.id
WHERE t.slug IN ('admin-org', 'test-org')
ORDER BY section DESC, name;

-- Show summary
SELECT 
    '=== SUMMARY ===' as summary,
    CONCAT('Subscription Plans: ', (SELECT COUNT(*) FROM subscription_plans)) as details
UNION ALL
SELECT 
    '',
    CONCAT('Admin Users: ', (SELECT COUNT(*) FROM users WHERE role = 'admin'))
UNION ALL
SELECT 
    '',
    CONCAT('Regular Users: ', (SELECT COUNT(*) FROM users WHERE role = 'user'))
UNION ALL
SELECT 
    '',
    CONCAT('Total Tenants: ', (SELECT COUNT(*) FROM tenants));

-- Commit transaction
COMMIT;

-- Final success message
SELECT 'SEEDING COMPLETED SUCCESSFULLY! 🎉' as status;
