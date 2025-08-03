-- =====================================================
-- SUBSCRIPTION PLANS SEEDING SCRIPT
-- Run this script directly in PostgreSQL to seed subscription plans
-- =====================================================

BEGIN;

-- Clear existing data (optional - uncomment if you want to reset)
-- DELETE FROM subscription_plans;

-- Insert subscription plans
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
) VALUES
-- Free Plan
(
    gen_random_uuid(),
    'Free',
    'Perfect for getting started',
    0.00,
    'monthly',
    '["Basic features", "1 tenant", "Limited storage (1GB)", "Community support", "Basic analytics"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Starter Plan
(
    gen_random_uuid(),
    'Starter',
    'For individuals and small teams',
    9.99,
    'monthly',
    '["All Free features", "Up to 3 tenants", "Extended storage (10GB)", "Email support", "Advanced analytics", "Custom branding"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Professional Plan
(
    gen_random_uuid(),
    'Professional',
    'For growing businesses',
    29.99,
    'monthly',
    '["All Starter features", "Up to 10 tenants", "Premium storage (100GB)", "Priority support", "API access", "Advanced integrations", "Team collaboration tools"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Enterprise Plan
(
    gen_random_uuid(),
    'Enterprise',
    'For large organizations',
    99.99,
    'monthly',
    '["All Professional features", "Unlimited tenants", "Unlimited storage", "24/7 phone support", "Dedicated account manager", "Custom integrations", "Advanced security features", "SLA guarantee"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Starter Annual (20% discount)
(
    gen_random_uuid(),
    'Starter Annual',
    'For individuals and small teams (Annual billing)',
    95.90,
    'yearly',
    '["All Free features", "Up to 3 tenants", "Extended storage (10GB)", "Email support", "Advanced analytics", "Custom branding", "20% discount on annual billing"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Professional Annual (20% discount)
(
    gen_random_uuid(),
    'Professional Annual',
    'For growing businesses (Annual billing)',
    287.90,
    'yearly',
    '["All Starter features", "Up to 10 tenants", "Premium storage (100GB)", "Priority support", "API access", "Advanced integrations", "Team collaboration tools", "20% discount on annual billing"]'::jsonb,
    true,
    NOW(),
    NOW()
),

-- Enterprise Annual (20% discount)
(
    gen_random_uuid(),
    'Enterprise Annual',
    'For large organizations (Annual billing)',
    959.90,
    'yearly',
    '["All Professional features", "Unlimited tenants", "Unlimited storage", "24/7 phone support", "Dedicated account manager", "Custom integrations", "Advanced security features", "SLA guarantee", "20% discount on annual billing"]'::jsonb,
    true,
    NOW(),
    NOW()
);

-- Display results
SELECT 
    name,
    price,
    billing_cycle,
    is_active,
    created_at
FROM subscription_plans
ORDER BY 
    CASE billing_cycle 
        WHEN 'monthly' THEN 1 
        WHEN 'yearly' THEN 2 
    END,
    price;

-- Show count
SELECT COUNT(*) as total_plans FROM subscription_plans;

COMMIT;
