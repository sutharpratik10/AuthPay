import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { RBACService } from '@/lib/rbac/rbac-service';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { users, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { validatePassword } from '@/lib/utils/sanitize';

/**
 * POST /api/admin/users/create-admin
 * Create a new admin user and assign them the Admin role
 */
async function createAdminUser(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = session.user.id;

    // Check if acting user has Super Admin or enough priority to create admins
    // This is checked implicitly by assignRole later, but good to check early
    const adminIsSuperAdmin = await RBACService.isSuperAdmin(adminUserId);
    const adminPriority = await RBACService.getUserHighestPriority(adminUserId);

    const body = await req.json();
    const { name, email, password } = body;

    // 1. Validation
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error || 'Invalid password' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Find the Admin role to assign
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'Admin')
    });

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin role not found in system' }, { status: 500 });
    }

    // Check priority: cannot create admin if adminRole priority is higher than yours
    if (!adminIsSuperAdmin && (adminRole.priority ?? 0) > adminPriority) {
      return NextResponse.json({ error: 'Insufficient priority to create Admin users' }, { status: 403 });
    }

    // 2. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // 3. Create the user
    const hashedPassword = await hash(password, 12);
    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerified: new Date().toISOString(), // Auto-verify admins created by admins
    }).returning();

    // 4. Assign Admin role
    const roleResult = await RBACService.assignRole(adminUserId, newUser.id, adminRole.id);

    if (!roleResult.success) {
      // Rollback user creation conceptually (not using transactions here for simplicity, but in a real app might want to)
      await db.delete(users).where(eq(users.id, newUser.id));
      return NextResponse.json({ error: roleResult.error || 'Failed to assign admin role' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}

// Require both user management and role management, or just admin access
// The API_POLICIES map only takes one policy, so we use USER_MANAGE and check priority inside
export const POST = withPolicy(createAdminUser, API_POLICIES.USER_MANAGE);
