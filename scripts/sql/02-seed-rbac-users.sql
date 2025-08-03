-- =====================================================
-- RBAC SYSTEM SEEDING SCRIPT
-- Run this script directly in PostgreSQL to seed RBAC data
-- =====================================================

-- Create admin user and assign admin role
DO $$
DECLARE
    admin_user_id UUID;
    admin_tenant_id UUID;
    starter_plan_id UUID;
BEGIN
    -- Get the Starter plan ID for the admin tenant
    SELECT id INTO starter_plan_id 
    FROM subscription_plans 
    WHERE name = 'Starter' AND billing_cycle = 'monthly' 
    LIMIT 1;
    
    -- If no Starter plan exists, get any plan
    IF starter_plan_id IS NULL THEN
        SELECT id INTO starter_plan_id 
        FROM subscription_plans 
        LIMIT 1;
    END IF;    -- Create admin user if it doesn't exist
    INSERT INTO users (
        id,
        email,
        name,
        role,
        password,
        is_email_verified,
        is_active,
        "emailVerified",
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'admin@saasly.app',
        'System Administrator',
        'admin',
        '$2a$12$LQv3c1yqBw2lRdaHvJWOCOOzKzk3Fv8xVm8qyYzz8yFjKXkYq2b0W', -- password: admin123
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        name = 'System Administrator',
        updated_at = NOW()
    RETURNING id INTO admin_user_id;
    
    -- Get the admin user ID if it already existed
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM users 
        WHERE email = 'admin@saasly.app';
    END IF;      -- Create admin tenant if it doesn't exist
    INSERT INTO tenants (
        id,
        name,
        slug,
        plan_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Admin Organization',
        'admin-org',
        starter_plan_id,
        true,
        NOW(),
        NOW()    )    ON CONFLICT (slug) DO UPDATE SET
        name = 'Admin Organization',
        plan_id = starter_plan_id,
        updated_at = NOW()
    RETURNING id INTO admin_tenant_id;
    
    -- Output results
    RAISE NOTICE 'Admin user created/updated with ID: %', admin_user_id;
    RAISE NOTICE 'Admin tenant created/updated with ID: %', admin_tenant_id;
    
END $$;

-- Create some test users with different roles
DO $$
DECLARE
    user_user_id UUID;
    user_tenant_id UUID;
    free_plan_id UUID;
BEGIN
    -- Get the Free plan ID for the test user tenant
    SELECT id INTO free_plan_id 
    FROM subscription_plans 
    WHERE name = 'Free' 
    LIMIT 1;    -- Create regular test user
    INSERT INTO users (
        id,
        email,
        name,
        role,
        password,
        is_email_verified,
        is_active,
        "emailVerified",
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'user@saasly.app',
        'Test User',
        'user',
        '$2a$12$LQv3c1yqBw2lRdaHvJWOCOOzKzk3Fv8xVm8qyYzz8yFjKXkYq2b0W', -- password: admin123
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'user',
        name = 'Test User',
        updated_at = NOW()
    RETURNING id INTO user_user_id;
    
    -- Get the user ID if it already existed
    IF user_user_id IS NULL THEN
        SELECT id INTO user_user_id 
        FROM users 
        WHERE email = 'user@saasly.app';
    END IF;      -- Create user tenant
    INSERT INTO tenants (
        id,
        name,
        slug,
        plan_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Test Organization',
        'test-org',
        free_plan_id,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = 'Test Organization',
        plan_id = free_plan_id,
        updated_at = NOW()
    RETURNING id INTO user_tenant_id;
    
    -- Output results
    RAISE NOTICE 'Test user created/updated with ID: %', user_user_id;
    RAISE NOTICE 'Test tenant created/updated with ID: %', user_tenant_id;
    
END $$;

-- Display created users and their roles
SELECT 
    id,
    email,
    name,
    role,
    is_email_verified,
    is_active,
    created_at
FROM users
WHERE email IN ('admin@saasly.app', 'user@saasly.app')
ORDER BY role DESC, email;

-- Display created tenants
SELECT 
    t.id,
    t.name,
    t.slug,
    sp.name as subscription_plan,
    t.created_at
FROM tenants t
LEFT JOIN subscription_plans sp ON t.plan_id = sp.id
WHERE t.slug IN ('admin-org', 'test-org')
ORDER BY t.name;

-- Show summary
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as regular_users,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM subscription_plans) as subscription_plans;

COMMIT;
