import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth';
import { auth, signIn, signOut } from '@/auth';
import { db } from "@/db";
import { tenants, tenantSettings } from "@/db/schema/tenants";
import { eq, and, sql } from "drizzle-orm";
import { BaseRouteHandler, IRouteHandler } from './BaseRouteHandler';
import { TenantRouteHandler } from './TenantRouteHandler';

// Using BaseRouteHandler and IRouteHandler from the imported file

/**
 * Abstract authentication route handler
 * Provides common methods for authentication routes
 */
abstract class AuthRouteHandler extends BaseRouteHandler {
  /**
   * Protected method to validate registration/login input
   */
  protected validateAuthInput(email: string, password: string): { isValid: boolean; error?: string } {
    if (!email || !password) {
      return { isValid: false, error: 'Email and password are required' };
    }

    if (!this.validateEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }
}

/**
 * Registration route handler
 */
class RegistrationRouteHandler extends AuthRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { email, password, name } = body;      // Validate input
      const validation = this.validateAuthInput(email, password);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.error || 'Invalid input', 400);
      }

      // Validate password complexity
      if (password.length < 8) {
        return this.createErrorResponse('Password must be at least 8 characters', 400);
      }

      // Register user
      const result = await AuthService.registerUser(email, password, name);

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Registration failed', 400);
      }

      return this.createSuccessResponse({
        message: 'User registered successfully. Please verify your email.',
        user: result.user
      });
    } catch (error) {
      return this.handleError(error, 'Registration error');
    }
  }
}

/**
 * Email verification route handler
 */
class VerifyEmailRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const searchParams = req.nextUrl.searchParams;
      const code = searchParams.get('code');      if (!code) {
        return this.createErrorResponse('Verification code is required', 400);
      }

      const result = await AuthService.verifyEmail(code);

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Email verification failed', 400);
      }

      return this.createSuccessResponse({
        message: 'Email verified successfully',
        user: result.user
      });
    } catch (error) {
      return this.handleError(error, 'Verification error');
    }
  }
}

/**
 * Resend verification email route handler
 */
class ResendVerificationEmailRouteHandler extends BaseRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { email } = body;

      if (!email) {
        return this.createErrorResponse('Email is required', 400);
      }

      if (!this.validateEmail(email)) {
        return this.createErrorResponse('Invalid email format', 400);
      }      const result = await AuthService.resendVerificationEmail(email);

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Failed to resend verification email', 400);
      }

      return this.createSuccessResponse({
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Resend verification email error');
    }
  }
}

/**
 * Login handler - processes credential-based login requests
 */
class LoginRouteHandler extends AuthRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { email, password } = body;

      // Validate input
      const validation = this.validateAuthInput(email, password);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.error!, 400);
      }

      // We'll delegate the actual authentication to NextAuth
      try {
        // Call NextAuth signIn
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          return this.createErrorResponse('Invalid email or password', 401);
        }

        // Return success
        return this.createSuccessResponse({
          success: true,
          message: 'Login successful'
        });
      } catch (authError) {
        console.error('Authentication error:', authError);
        return this.createErrorResponse('Authentication failed', 401);
      }
    } catch (error) {
      return this.handleError(error, 'Login error');
    }
  }
}

/**
 * Authentication state handler - checks current auth status
 */
class AuthStateHandler extends BaseRouteHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Get current session
      const session = await auth();
      
      if (!session || !session.user) {
        return this.createSuccessResponse({
          authenticated: false,
          user: null
        });
      }
      
      return this.createSuccessResponse({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isEmailVerified: session.user.isEmailVerified || false
        }
      });
    } catch (error) {
      return this.handleError(error, 'Auth state error');
    }
  }
}

/**
 * Logout handler - handles user logout requests
 */
class LogoutRouteHandler extends BaseRouteHandler {  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Call NextAuth signOut
      await signOut({ redirect: false });
      
      return this.createSuccessResponse({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Logout error');
    }
  }
}

/**
 * NextAuth integration handler - specific handler for NextAuth routes
 * This connects our routing system to Next-Auth handlers
 * NOTE: This handler is currently not in use but is kept for future integration
 * @unused
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class NextAuthHandler extends BaseRouteHandler {
  private readonly getHandler: (req: NextRequest | Request) => Promise<Response>;
  private readonly postHandler: (req: NextRequest | Request) => Promise<Response>;

  constructor(
    getHandler: (req: NextRequest | Request) => Promise<Response>,
    postHandler: (req: NextRequest | Request) => Promise<Response>
  ) {
    super();
    this.getHandler = getHandler;
    this.postHandler = postHandler;
  }

  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Based on the method, call the appropriate Next-Auth handler
      if (req.method === 'GET') {
        const response = await this.getHandler(req);
        return NextResponse.json(await response.json(), {
          status: response.status,
          headers: response.headers
        });
      } else if (req.method === 'POST') {
        const response = await this.postHandler(req);
        return NextResponse.json(await response.json(), {
          status: response.status,
          headers: response.headers
        });
      }

      return this.createErrorResponse('Method not supported', 405);
    } catch (error) {
      return this.handleError(error, 'NextAuth handler error');
    }
  }
}

// Using TenantRouteHandler from the imported file


/**
 * Create tenant route handler
 */
class CreateTenantRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return this.createErrorResponse('Method not allowed', 405);
      }

      // Extract data from request body
      const body = await req.json();
        // Validate input data
      const validation = this.validateTenantInput(body);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.error || 'Invalid input data', 400);
      }
      
      // Check if slug already exists
      const slugExists = await this.tenantExists(body.slug);
      if (slugExists) {
        return this.createErrorResponse('Tenant with this slug already exists', 400);
      }
      
      // Get the current user for creating the relationship
      const session = await auth();
      if (!session?.user?.id) {
        return this.createErrorResponse('Authentication required', 401);
      }      // Create the tenant
      const newTenant = await db.transaction(async (tx) => {
        // Create the tenant
        const [tenant] = await tx.insert(tenants).values({
          name: body.name,
          slug: body.slug,
          logoUrl: body.logoUrl || null,
          primaryColor: body.primaryColor || null,
          planId: body.planId || null,
        }).returning();
        
        // In a full implementation, we would:
        // 1. Associate the current user as the owner of the tenant
        // 2. Create default roles for the tenant
        // 3. Assign the admin role to the creator
        
        // For now, we'll just return the tenant to keep things simple
        
        return tenant;
      });
      
      return this.createSuccessResponse({
        message: 'Tenant created successfully',
        tenant: newTenant
      }, 201);
    } catch (error) {
      return this.handleError(error, 'Create tenant error');
    }
  }
}

/**
 * Get tenant route handler
 */
class GetTenantRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Only allow GET requests
      if (req.method !== 'GET') {
        return this.createErrorResponse('Method not allowed', 405);
      }
      
      // Extract tenant slug from the URL
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get tenant data
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
        with: {
          settings: true,
          plan: true,
        }
      });
      
      if (!tenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }
      
      return this.createSuccessResponse({
        tenant
      });
    } catch (error) {
      return this.handleError(error, 'Get tenant error');
    }
  }
}

/**
 * Update tenant route handler
 */
class UpdateTenantRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Only allow PUT/PATCH requests
      if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return this.createErrorResponse('Method not allowed', 405);
      }
      
      // Extract tenant slug from the URL
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });
      
      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }
      
      // Extract data from request body
      const body = await req.json();
      
      // Validate input data if changing name or slug
      if (body.name || body.slug) {        const validation = this.validateTenantInput({
          name: body.name || existingTenant.name,
          slug: body.slug || existingTenant.slug,
          primaryColor: body.primaryColor
        });
        
        if (!validation.isValid) {
          return this.createErrorResponse(validation.error || 'Invalid input data', 400);
        }
        
        // Check if new slug already exists (if changing slug)
        if (body.slug && body.slug !== existingTenant.slug) {
          const slugExists = await this.tenantExists(body.slug);
          if (slugExists) {
            return this.createErrorResponse('Tenant with this slug already exists', 400);
          }
        }
      }
      
      // Update the tenant
      const [updatedTenant] = await db.update(tenants)
        .set({
          name: body.name || existingTenant.name,
          slug: body.slug || existingTenant.slug,
          logoUrl: body.logoUrl !== undefined ? body.logoUrl : existingTenant.logoUrl,
          primaryColor: body.primaryColor !== undefined ? body.primaryColor : existingTenant.primaryColor,
          planId: body.planId || existingTenant.planId,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, existingTenant.id))
        .returning();
      
      return this.createSuccessResponse({
        message: 'Tenant updated successfully',
        tenant: updatedTenant
      });
    } catch (error) {
      return this.handleError(error, 'Update tenant error');
    }
  }
}

/**
 * Delete tenant route handler
 */
class DeleteTenantRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      // Only allow DELETE requests
      if (req.method !== 'DELETE') {
        return this.createErrorResponse('Method not allowed', 405);
      }
      
      // Extract tenant slug from the URL
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });
      
      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }
      
      // Delete the tenant
      await db.delete(tenants).where(eq(tenants.id, existingTenant.id));
      
      return this.createSuccessResponse({
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      return this.handleError(error, 'Delete tenant error');
    }
  }
}

/**
 * Tenant settings route handler
 */
class TenantSettingsRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });
      
      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }

      switch (req.method) {
        case 'GET':
          // Get tenant settings
          const settings = await db.query.tenantSettings.findMany({
            where: eq(tenantSettings.tenantId, existingTenant.id)
          });
          
          return this.createSuccessResponse({ settings });
          
        case 'POST':
        case 'PUT':
          // Update tenant settings
          const body = await req.json();
          
          if (!body.key || !body.value) {
            return this.createErrorResponse('Key and value are required', 400);
          }
            // Upsert the setting using Drizzle's proper PostgreSQL syntax
          const [setting] = await db
            .insert(tenantSettings)
            .values({
              tenantId: existingTenant.id,
              key: body.key,
              value: body.value,
              updatedAt: new Date() 
            })
            .onConflictDoUpdate({
              target: [tenantSettings.tenantId, tenantSettings.key],
              set: { value: body.value, updatedAt: new Date() }
            })
            .returning();
          
          return this.createSuccessResponse({
            message: 'Setting updated successfully',
            setting
          });
          
        case 'DELETE':
          // Delete a tenant setting
          const { key } = await req.json();
          
          if (!key) {
            return this.createErrorResponse('Setting key is required', 400);
          }
            await db
            .delete(tenantSettings)
            .where(
              and(
                eq(tenantSettings.tenantId, existingTenant.id),
                eq(tenantSettings.key, key)
              )
            );
          
          return this.createSuccessResponse({
            message: `Setting '${key}' deleted successfully`
          });
          
        default:
          return this.createErrorResponse('Method not allowed', 405);
      }
    } catch (error) {
      return this.handleError(error, 'Tenant settings error');
    }
  }
}

/**
 * Tenant users route handler - manages users for a specific tenant
 */
class TenantUsersRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }

      switch (req.method) {
        case 'GET': {
          // Use SQL template strings for complex queries that don't map well to the query builder
          const tenantUsersResult = await db.execute(sql`
            SELECT u.id, u.email, u.name, u.avatar_url as image, tu.status as role, u.created_at 
            FROM users u
            JOIN tenant_users tu ON u.id = tu.user_id
            WHERE tu.tenant_id = ${existingTenant.id}
            ORDER BY u.name
          `);
          
            return this.createSuccessResponse({ 
              users: tenantUsersResult 
            });
          }          case 'POST': {
            // Add a user to the tenant
            const body = await req.json();
          
          if (!body.email) {
            return this.createErrorResponse('User email is required', 400);
          }
          
          if (!body.role) {
            return this.createErrorResponse('User role is required', 400);
          }
          
          // Import the necessary schema
          const { users, tenantUsers } = await import('@/db/schema/users');
          
          // Find the user using Drizzle's query builder
          const usersFound = await db
            .select({ id: users.id, email: users.email, name: users.name })
            .from(users)
            .where(eq(users.email, body.email));
            if (!usersFound || usersFound.length === 0) {
            return this.createErrorResponse('User not found', 404);
          }
          
          const user = usersFound[0];

          // Check if user is already a member
          const existingMembers = await db
            .select({ value: sql`1` })
            .from(tenantUsers)
            .where(
              and(
                eq(tenantUsers.tenantId, existingTenant.id),
                eq(tenantUsers.userId, user.id)
              )
            );
            if (existingMembers.length > 0) {
            // Update status (formerly role) if user is already a member
            await db
              .update(tenantUsers)
              .set({ status: body.role })
              .where(
                and(
                  eq(tenantUsers.tenantId, existingTenant.id),
                  eq(tenantUsers.userId, user.id)
                )
              );
            
            return this.createSuccessResponse({
              message: 'User role updated successfully',
              user
            });
          }
            
          // Add the user to the tenant using Drizzle's ORM
          await db
            .insert(tenantUsers)
            .values({
              tenantId: existingTenant.id,
              userId: user.id,
              status: body.role,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            return this.createSuccessResponse({
            message: 'User added to tenant successfully',
            user
          });
          }
          
          case 'DELETE': {
          // Remove a user from the tenant
          const deleteData = await req.json();
            if (!deleteData.userId) {
            return this.createErrorResponse('User ID is required', 400);
          }
          
          // Import the necessary schema
          const { tenantUsers } = await import('@/db/schema/users');
          
          // Check if trying to remove the last admin
          if (deleteData.role === 'admin') {
            const adminCountResult = await db
              .select({
                count: sql<number>`count(*)`
              })
              .from(tenantUsers)
              .where(
                and(
                  eq(tenantUsers.tenantId, existingTenant.id),
                  eq(tenantUsers.status, 'admin')
                )
              );
            
            // Extract count from the result
            const adminCount = adminCountResult[0].count;
            
            if (adminCount <= 1) {
              return this.createErrorResponse(
                'Cannot remove the last admin from the tenant', 
                400
              );
            }
          }
            // Remove the user from the tenant
          await db
            .delete(tenantUsers)
            .where(
              and(
                eq(tenantUsers.tenantId, existingTenant.id),
                eq(tenantUsers.userId, deleteData.userId)
              )
            );
            return this.createSuccessResponse({
            message: 'User removed from tenant successfully'
          });
          }
          
        default:
          return this.createErrorResponse('Method not allowed', 405);
      }
    } catch (error) {
      return this.handleError(error, 'Tenant users error');
    }
  }
}

/**
 * Tenant roles route handler - manages roles for a specific tenant
 * This is a simplified version without all the database operations
 */
class TenantRolesRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });
      
      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }

      switch (req.method) {
        case 'GET':
          // Return mock data for now
          return this.createSuccessResponse({ 
            roles: [
              {
                id: 'mock-role-1',
                name: 'Admin',
                description: 'Administrator role',
                isDefault: true,
                isSystemManaged: true
              },
              {
                id: 'mock-role-2',
                name: 'Member',
                description: 'Standard member role',
                isDefault: true,
                isSystemManaged: true
              },
              {
                id: 'mock-role-3',
                name: 'Guest',
                description: 'Guest role with limited access',
                isDefault: true,
                isSystemManaged: true
              }
            ]
          });
          
        case 'POST':
          // Create a new role (simplified)
          const createBody = await req.json();
          
          if (!createBody.name) {
            return this.createErrorResponse('Role name is required', 400);
          }
          
          return this.createSuccessResponse({
            message: 'Role created successfully',
            role: {
              id: 'new-mock-role-id',
              name: createBody.name,
              description: createBody.description || null,
              isDefault: createBody.isDefault || false,
              isSystemManaged: false
            }
          }, 201);
          
        case 'PUT':
        case 'PATCH':
          // Update role (simplified)
          const updateBody = await req.json();
          
          if (!updateBody.id) {
            return this.createErrorResponse('Role ID is required', 400);
          }
          
          return this.createSuccessResponse({
            message: 'Role updated successfully',
            role: {
              id: updateBody.id,
              name: updateBody.name || 'Updated Role',
              description: updateBody.description || 'Updated description',
              isDefault: updateBody.isDefault || false,
              isSystemManaged: false
            }
          });
          
        case 'DELETE':
          // Delete role (simplified)
          const deleteData = await req.json();
          
          if (!deleteData.id) {
            return this.createErrorResponse('Role ID is required', 400);
          }
          
          return this.createSuccessResponse({
            message: 'Role deleted successfully'
          });
          
        default:
          return this.createErrorResponse('Method not allowed', 405);
      }
    } catch (error) {
      return this.handleError(error, 'Tenant roles error');
    }
  }
}

/**
 * Tenant billing route handler - manages billing for a specific tenant
 * This is a simplified version without all the database operations
 */
class TenantBillingRouteHandler extends TenantRouteHandler {
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const tenantSlug = paths[paths.indexOf('tenant') + 1];
      
      if (!tenantSlug) {
        return this.createErrorResponse('Tenant slug is required', 400);
      }
      
      // Check authorization
      const authCheck = await this.checkTenantAuthorization(req, tenantSlug);
      if (!authCheck.authorized) {
        return this.createErrorResponse(authCheck.error || 'Unauthorized', 403);
      }
      
      // Get existing tenant
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug)
      });
      
      if (!existingTenant) {
        return this.createErrorResponse('Tenant not found', 404);
      }

      switch (req.method) {
        case 'GET':
          // For now, return a placeholder response
          return this.createSuccessResponse({
            message: 'Billing information retrieved successfully',
            currentPlan: {
              id: 'mock-plan-id',
              name: 'Basic Plan',
              price: '29.99'
            },
            planEffectiveDate: existingTenant.planEffectiveDate,
            planExpiryDate: existingTenant.planExpiryDate
          });
          
        case 'POST':
        case 'PUT':
          // Simplified implementation
          const updateBody = await req.json();
          
          if (!updateBody.planId) {
            return this.createErrorResponse('Plan ID is required', 400);
          }
          
          return this.createSuccessResponse({
            message: 'Subscription plan updated successfully',
            tenant: {
              id: existingTenant.id,
              name: existingTenant.name,
              planId: updateBody.planId
            }
          });
          
        default:
          return this.createErrorResponse('Method not allowed', 405);
      }
    } catch (error) {
      return this.handleError(error, 'Tenant billing error');
    }
  }
}

/**
 * Route factory that creates and returns the appropriate route handler
 * Uses a registry pattern for dynamic route registration
 */
class RouteFactory {
  private static instance: RouteFactory;
  private routes: Map<string, IRouteHandler>;
  private routePatterns: Map<RegExp, IRouteHandler>;
    private constructor() {
    this.routes = new Map();
    this.routePatterns = new Map();
    
    // Register default routes
    this.registerRoute('register', new RegistrationRouteHandler());
    this.registerRoute('verify', new VerifyEmailRouteHandler());
    this.registerRoute('resendVerification', new ResendVerificationEmailRouteHandler());    
    this.registerRoute('login', new LoginRouteHandler());
    this.registerRoute('authState', new AuthStateHandler());
    this.registerRoute('logout', new LogoutRouteHandler());
    
    // Register tenant routes with regex patterns for dynamic path handling
    this.registerPatternRoute(/\/api\/tenant\/create/, new CreateTenantRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+$/, new GetTenantRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/update/, new UpdateTenantRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/delete/, new DeleteTenantRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/settings/, new TenantSettingsRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/users/, new TenantUsersRouteHandler());
    
    // Register new tenant routes
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/roles/, new TenantRolesRouteHandler());
    this.registerPatternRoute(/\/api\/tenant\/[^/]+\/billing/, new TenantBillingRouteHandler());
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): RouteFactory {
    if (!RouteFactory.instance) {
      RouteFactory.instance = new RouteFactory();
    }
    return RouteFactory.instance;
  }
  
  /**
   * Register a new route handler
   */
  registerRoute(routeName: string, handler: IRouteHandler): void {
    this.routes.set(routeName, handler);
  }
  
  /**
   * Register a route with a regex pattern
   */
  registerPatternRoute(pattern: RegExp, handler: IRouteHandler): void {
    this.routePatterns.set(pattern, handler);
  }

  /**
   * Get a route handler by name
   */
  getRouteHandler(routeName: string): IRouteHandler {
    const handler = this.routes.get(routeName);
    if (!handler) {
      throw new Error(`Route '${routeName}' not found`);
    }
    return handler;
  }
  
  /**
   * Find a handler that matches the given path
   */
  getHandlerForPath(path: string): IRouteHandler | null {
    // First check exact routes
    for (const [routeName, handler] of this.routes.entries()) {
      if (path.includes(`/api/auth/${routeName}`)) {
        return handler;
      }
    }
    
    // Then check pattern routes
    for (const [pattern, handler] of this.routePatterns.entries()) {
      if (pattern.test(path)) {
        return handler;
      }
    }
    
    return null;
  }
}

/**
 * Routes class with static methods that serve as API endpoints
 * Acts as the main entry point for all API routes
 */
export class Routes {
  /**
   * Register a new user
   */
  static async registerUser(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('register').handle(req);
  }

  /**
   * Verify user email
   */
  static async verifyEmail(req: NextRequest): Promise<NextResponse> {
    const handler = RouteFactory.getInstance().getRouteHandler('verify');
    return handler.handle(req);
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(req: NextRequest): Promise<NextResponse> {
    return RouteFactory.getInstance().getRouteHandler('resendVerification').handle(req);
  }
  
  /**
   * Process a request based on its path
   */
  private static async processRequest(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Get handler from factory based on path
    const handler = RouteFactory.getInstance().getHandlerForPath(path);
    
    if (handler) {
      return handler.handle(req);
    }    // If no handler is found, return 404
    const errorHandler = new class extends BaseRouteHandler {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async handle(req: NextRequest): Promise<NextResponse> {
        return this.createErrorResponse('Route not found', 404);
      }
    }();
    
    return errorHandler.handle(req);
  }

  /**
   * HTTP method handlers for API routes
   */
  static async GET(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    if (path.includes('/api/auth/verify')) {
      return this.verifyEmail(req);
    }
    
    // Process other GET requests through the dynamic router
    return this.processRequest(req);
  }

  static async POST(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const path = url.pathname;
    
    if (path.includes('/api/auth/register')) {
      return this.registerUser(req);
    }
    
    if (path.includes('/api/auth/verify')) {
      return this.resendVerificationEmail(req);
    }
    
    // Process other POST requests through the dynamic router
    return this.processRequest(req);
  }
  
  /**
   * Support for PUT requests
   */
  static async PUT(req: NextRequest): Promise<NextResponse> {
    return this.processRequest(req);
  }
  
  /**
   * Support for DELETE requests
   */
  static async DELETE(req: NextRequest): Promise<NextResponse> {
    return this.processRequest(req);
  }
  
  /**
   * Support for PATCH requests
   */
  static async PATCH(req: NextRequest): Promise<NextResponse> {
    return this.processRequest(req);
  }
    /**
   * Handle tenant API routes
   */
  static async handleTenantRoute(req: NextRequest): Promise<NextResponse> {
    // Simply delegate to the processRequest method which will find the appropriate handler
    return Routes.processRequest(req);
  }
  
  /**
   * Initialize and configure routes
   * This method should be called during application startup
   */
  static initialize(): void {
    // Routes are already registered in the RouteFactory constructor
    
    // Any additional setup can be done here
    
    console.log('Routes initialized successfully');
  }
}

export default Routes;
