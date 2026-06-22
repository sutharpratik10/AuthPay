import { NextRequest, NextResponse } from 'next/server';
import { withPolicy, API_POLICIES } from '@/lib/api/permissions';
import { db } from '@/server/db';
import { users, userRoles, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/admin/users/create - Create a new user (Admin only)
 */
async function createUser(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, roleName, isActive, isEmailVerified } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Find the role by name (default to 'User')
    const roleToAssign = await db.query.roles.findFirst({
      where: eq(roles.name, roleName || 'User'),
      columns: { id: true, name: true }
    });

    if (!roleToAssign) {
      return NextResponse.json(
        { error: 'Role not found. Please create the role first.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db.insert(users).values({
      id: uuidv4(),
      email: email.toLowerCase(),
      name: name || null,
      password: hashedPassword,
      isActive: isActive !== undefined ? isActive : true,
      isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : false,
      emailVerified: isEmailVerified ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
      isEmailVerified: users.isEmailVerified,
      createdAt: users.createdAt,
    });

    // Assign role via user_roles table
    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: roleToAssign.id,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { 
        user: { 
          ...newUser, 
          role: roleToAssign.name 
        } 
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Export with admin-only policy
export const POST = withPolicy(createUser, API_POLICIES.USER_MANAGE);
