-- =====================================================
-- DEFAULT ROLES SEEDING SCRIPT
-- Run this script to seed default roles for the new roles system
-- =====================================================

BEGIN;

-- Create default permissions if they don't exist
INSERT INTO permissions (
    id,
    name,
    description,
    category,
    display_name,
    is_system_managed,
    created_at,
    updated_at
) VALUES
(gen_random_uuid(), 'user.view', 'View users', 'user_management', 'View Users', true, NOW(), NOW()),
(gen_random_uuid(), 'user.create', 'Create users', 'user_management', 'Create Users', true, NOW(), NOW()),
(gen_random_uuid(), 'user.edit', 'Edit users', 'user_management', 'Edit Users', true, NOW(), NOW()),
(gen_random_uuid(), 'user.delete', 'Delete users', 'user_management', 'Delete Users', true, NOW(), NOW()),
(gen_random_uuid(), 'user.manage', 'Manage users', 'user_management', 'Manage Users', true, NOW(), NOW()),
(gen_random_uuid(), 'tenant.view', 'View tenants', 'tenant_management', 'View Tenants', true, NOW(), NOW()),
(gen_random_uuid(), 'tenant.create', 'Create tenants', 'tenant_management', 'Create Tenants', true, NOW(), NOW()),
(gen_random_uuid(), 'tenant.edit', 'Edit tenants', 'tenant_management', 'Edit Tenants', true, NOW(), NOW()),
(gen_random_uuid(), 'tenant.delete', 'Delete tenants', 'tenant_management', 'Delete Tenants', true, NOW(), NOW()),
(gen_random_uuid(), 'tenant.manage', 'Manage tenants', 'tenant_management', 'Manage Tenants', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.view', 'View subscriptions', 'subscription', 'View Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.create', 'Create subscriptions', 'subscription', 'Create Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.edit', 'Edit subscriptions', 'subscription', 'Edit Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.delete', 'Delete subscriptions', 'subscription', 'Delete Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.manage', 'Manage subscriptions', 'subscription', 'Manage Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.purchase', 'Purchase subscriptions', 'subscription', 'Purchase Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'subscription.cancel', 'Cancel subscriptions', 'subscription', 'Cancel Subscriptions', true, NOW(), NOW()),
(gen_random_uuid(), 'content.view', 'View content', 'content', 'View Content', true, NOW(), NOW()),
(gen_random_uuid(), 'content.create', 'Create content', 'content', 'Create Content', true, NOW(), NOW()),
(gen_random_uuid(), 'content.edit', 'Edit content', 'content', 'Edit Content', true, NOW(), NOW()),
(gen_random_uuid(), 'content.delete', 'Delete content', 'content', 'Delete Content', true, NOW(), NOW()),
(gen_random_uuid(), 'content.manage', 'Manage content', 'content', 'Manage Content', true, NOW(), NOW()),
(gen_random_uuid(), 'system.manage', 'Manage system', 'system', 'Manage System', true, NOW(), NOW()),
(gen_random_uuid(), 'analytics.view', 'View analytics', 'system', 'View Analytics', true, NOW(), NOW()),
(gen_random_uuid(), 'logs.view', 'View logs', 'system', 'View Logs', true, NOW(), NOW()),
(gen_random_uuid(), 'settings.manage', 'Manage settings', 'system', 'Manage Settings', true, NOW(), NOW()),
(gen_random_uuid(), 'profile.view', 'View profile', 'profile', 'View Profile', true, NOW(), NOW()),
(gen_random_uuid(), 'profile.edit', 'Edit profile', 'profile', 'Edit Profile', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Get all tenants
DO $$
DECLARE
    tenant_record RECORD;
    admin_role_id UUID;
    user_role_id UUID;
    manager_role_id UUID;
    editor_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Loop through each tenant to create default roles
    FOR tenant_record IN SELECT id, name, slug FROM tenants LOOP
        -- Create Admin role for this tenant
        INSERT INTO roles (
            id,
            tenant_id,
            name,
            description,
            is_default,
            is_system_managed,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            'Administrator',
            'Full administrative access to all features',
            false,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO admin_role_id;

        -- Create Manager role for this tenant
        INSERT INTO roles (
            id,
            tenant_id,
            name,
            description,
            is_default,
            is_system_managed,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            'Manager',
            'Management access with user and content management capabilities',
            false,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO manager_role_id;

        -- Create Editor role for this tenant
        INSERT INTO roles (
            id,
            tenant_id,
            name,
            description,
            is_default,
            is_system_managed,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            'Editor',
            'Content creation and editing capabilities',
            false,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO editor_role_id;

        -- Create User role for this tenant
        INSERT INTO roles (
            id,
            tenant_id,
            name,
            description,
            is_default,
            is_system_managed,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            'Member',
            'Standard member with basic access',
            true,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO user_role_id;

        -- Create Viewer role for this tenant
        INSERT INTO roles (
            id,
            tenant_id,
            name,
            description,
            is_default,
            is_system_managed,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            'Viewer',
            'Read-only access to content',
            false,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO viewer_role_id;

        -- Assign permissions to Administrator role (all permissions)
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
            gen_random_uuid(),
            admin_role_id,
            p.id,
            NOW()
        FROM permissions p;

        -- Assign permissions to Manager role (user and content management)
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
            gen_random_uuid(),
            manager_role_id,
            p.id,
            NOW()
        FROM permissions p
        WHERE p.name IN (
            'user.view', 'user.create', 'user.edit', 'user.manage',
            'tenant.view', 'tenant.edit',
            'subscription.view', 'subscription.purchase', 'subscription.cancel',
            'content.view', 'content.create', 'content.edit', 'content.delete', 'content.manage',
            'profile.view', 'profile.edit'
        );

        -- Assign permissions to Editor role (content management)
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
            gen_random_uuid(),
            editor_role_id,
            p.id,
            NOW()
        FROM permissions p
        WHERE p.name IN (
            'tenant.view', 'tenant.edit',
            'subscription.view', 'subscription.purchase', 'subscription.cancel',
            'content.view', 'content.create', 'content.edit', 'content.delete',
            'profile.view', 'profile.edit'
        );

        -- Assign permissions to Member role (basic user permissions)
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
            gen_random_uuid(),
            user_role_id,
            p.id,
            NOW()
        FROM permissions p
        WHERE p.name IN (
            'tenant.view',
            'subscription.view', 'subscription.purchase', 'subscription.cancel',
            'content.view', 'content.create',
            'profile.view', 'profile.edit'
        );

        -- Assign permissions to Viewer role (read-only)
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
            gen_random_uuid(),
            viewer_role_id,
            p.id,
            NOW()
        FROM permissions p
        WHERE p.name IN (
            'tenant.view',
            'subscription.view',
            'content.view',
            'profile.view'
        );

        RAISE NOTICE 'Created default roles for tenant: % (%)', tenant_record.name, tenant_record.slug;
    END LOOP;
END
$$;

-- Display results
SELECT 
    '=== DEFAULT ROLES CREATED ===' as section,
    '' as tenant_name,
    '' as role_name,
    '' as permission_count
UNION ALL
SELECT 
    '',
    t.name as tenant_name,
    r.name as role_name,
    CAST(COUNT(rp.id) as TEXT) as permission_count
FROM tenants t
JOIN roles r ON t.id = r.tenant_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.is_system_managed = true
GROUP BY t.name, r.name, r.created_at
ORDER BY section DESC, tenant_name, role_name;

-- Show summary
SELECT 
    '=== SUMMARY ===' as summary,
    CONCAT('Total Permissions: ', (SELECT COUNT(*) FROM permissions)) as details
UNION ALL
SELECT 
    '',
    CONCAT('Total Roles: ', (SELECT COUNT(*) FROM roles)) as details
UNION ALL
SELECT 
    '',
    CONCAT('Total Tenants: ', (SELECT COUNT(*) FROM tenants)) as details
UNION ALL
SELECT 
    '',
    CONCAT('Role-Permission Assignments: ', (SELECT COUNT(*) FROM role_permissions)) as details;

COMMIT;

-- Final success message
SELECT 'DEFAULT ROLES SEEDING COMPLETED SUCCESSFULLY! 🎉' as status;
