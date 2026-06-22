/**
 * Centralized API Helper Utilities
 * 
 * This module provides reusable helper functions for API routes to:
 * - Eliminate code duplication
 * - Standardize authentication checks
 * - Provide consistent response formats
 * - Improve performance with centralized logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { RBACService } from '@/lib/rbac/rbac-service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  roleId?: string | null;
  isEmailVerified: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiOptions {
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requireAdmin?: boolean;
  permission?: string;
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Get the current authenticated user with full error handling
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
      roleId: (session.user as { roleId?: string | null }).roleId || null,
      isEmailVerified: session.user.isEmailVerified || false,
    };
  } catch (error) {
    console.error('[API Helper] Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication and return user or error response
 * This eliminates the need for repetitive auth checks in every route
 */
export async function requireAuth(
  options: Omit<ApiOptions, 'requireAuth'> = {}
): Promise<
  { user: AuthenticatedUser; error: null } | 
  { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();

  // Check if user is authenticated
  if (!user) {
    return {
      user: null,
      error: errorResponse('Authentication required', 401)
    };
  }

  // Check email verification if required
  if (options.requireEmailVerified && !user.isEmailVerified) {
    return {
      user: null,
      error: errorResponse('Email verification required', 403)
    };
  }

  // Check admin status if required
  if (options.requireAdmin) {
    const isAdmin = await RBACService.isAdmin(user.id);
    if (!isAdmin) {
      return {
        user: null,
        error: errorResponse('Admin access required', 403)
      };
    }
  }

  // Check specific permission if required
  if (options.permission) {
    const hasPermission = await RBACService.hasPolicy(
      user.id,
      options.permission
    );
    if (!hasPermission) {
      return {
        user: null,
        error: errorResponse(
          `Missing required permission: ${options.permission}`,
          403
        )
      };
    }
  }

  return { user, error: null };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status = 500,
  details?: unknown
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(details ? { details } : {})
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationParams,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    ...(message && { message })
  });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse {
  console.error(`[API Error] ${context}:`, error);

  if (error instanceof Error) {
    return errorResponse(
      error.message || 'An error occurred',
      500,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  return errorResponse('An unexpected error occurred', 500);
}

// ============================================================================
// REQUEST PARSING HELPERS
// ============================================================================

/**
 * Safely parse JSON body from request
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    return { data: body as T, error: null };
  } catch {
    return {
      data: null,
      error: errorResponse('Invalid JSON in request body', 400)
    };
  }
}

/**
 * Extract and validate pagination parameters from URL
 */
export function getPaginationParams(
  request: NextRequest,
  defaults = { page: 1, limit: 10 }
): { page: number; limit: number; offset: number } {
  const { searchParams } = new URL(request.url);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page)));
  const limit = Math.min(
    100, // Max 100 items per page
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit)))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Extract search parameter from URL
 */
export function getSearchParam(request: NextRequest): string {
  const { searchParams } = new URL(request.url);
  return searchParams.get('search')?.trim() || '';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[]
): { valid: boolean; error: NextResponse | null } {
  const missingFields = requiredFields.filter(
    field => body[field] === undefined || body[field] === null || body[field] === ''
  );

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: errorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      )
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ============================================================================
// ROUTE HANDLER WRAPPER
// ============================================================================

/**
 * Wrap API route handlers with automatic auth and error handling
 * Use this for routes WITHOUT dynamic parameters (no [id] in path)
 * 
 * @example
 * export const GET = withApiHandler(
 *   async (request, { user }) => {
 *     const data = await fetchData(user.id);
 *     return successResponse(data);
 *   },
 *   { requireAuth: true }
 * );
 */
export function withApiHandler(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedUser | null }
  ) => Promise<NextResponse>,
  options: ApiOptions = {}
) {
  return async function(
    request: NextRequest
  ): Promise<NextResponse> {
    try {
      let user: AuthenticatedUser | null = null;

      // Handle authentication if required
      if (options.requireAuth || options.requireAdmin || options.permission) {
        const authResult = await requireAuth({
          requireEmailVerified: options.requireEmailVerified,
          requireAdmin: options.requireAdmin,
          permission: options.permission,
        });

        if (authResult.error) {
          return authResult.error;
        }

        user = authResult.user;
      } else {
        // Get user if available but don't require it
        user = await getCurrentUser();
      }

      // Execute the actual handler
      return await handler(request, { user });
    } catch (error) {
      return handleApiError(error, `${request.method} ${request.nextUrl.pathname}`);
    }
  };
}

/**
 * Wrap API route handlers with dynamic parameters (for routes with [id], [slug], etc.)
 * Use this for routes WITH dynamic parameters in Next.js 15
 * 
 * @example
 * export const GET = withDynamicApiHandler(
 *   async (request, { user, params }) => {
 *     const data = await fetchData(params.id, user.id);
 *     return successResponse(data);
 *   },
 *   { requireAuth: true }
 * );
 */
export function withDynamicApiHandler<T = Record<string, string>>(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedUser | null; params: T }
  ) => Promise<NextResponse>,
  options: ApiOptions = {}
) {
  return async function(
    request: NextRequest,
    segmentData: { params: Promise<T> }
  ): Promise<NextResponse> {
    try {
      let user: AuthenticatedUser | null = null;

      // Handle authentication if required
      if (options.requireAuth || options.requireAdmin || options.permission) {
        const authResult = await requireAuth({
          requireEmailVerified: options.requireEmailVerified,
          requireAdmin: options.requireAdmin,
          permission: options.permission,
        });

        if (authResult.error) {
          return authResult.error;
        }

        user = authResult.user;
      } else {
        // Get user if available but don't require it
        user = await getCurrentUser();
      }

      // Await params in Next.js 15+
      const params = await segmentData.params;

      // Execute the actual handler
      return await handler(request, { user, params });
    } catch (error) {
      return handleApiError(error, `${request.method} ${request.nextUrl.pathname}`);
    }
  };
}

// ============================================================================
// PERFORMANCE HELPERS
// ============================================================================

/**
 * Simple in-memory cache for API responses
 * Use for frequently accessed, rarely changed data
 */
class ApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds = 60) {
    this.ttl = ttlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Export cache instances for different data types
export const subscriptionCache = new ApiCache(300); // 5 minutes
export const userCache = new ApiCache(60); // 1 minute
export const permissionCache = new ApiCache(120); // 2 minutes

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log API route performance
 */
export function logApiPerformance(
  method: string,
  path: string,
  startTime: number,
  userId?: string
): void {
  const duration = Date.now() - startTime;
  const userInfo = userId ? ` [User: ${userId}]` : '';
  console.log(`[API] ${method} ${path}${userInfo} - ${duration}ms`);
}

/**
 * Create a performance logger for a request
 */
export function createPerformanceLogger(request: NextRequest) {
  const startTime = Date.now();
  const method = request.method;
  const path = request.nextUrl.pathname;

  return {
    log: (message: string) => {
      const duration = Date.now() - startTime;
      console.log(`[API] ${method} ${path} - ${message} (${duration}ms)`);
    },
    end: (userId?: string) => {
      logApiPerformance(method, path, startTime, userId);
    }
  };
}
