/**
 * Policy-Based API Route Protection Middleware
 * 
 * Use this to protect API routes with policy-based access control
 * 
 * Example usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const authCheck = await requirePolicy("content:create");
 *   if (!authCheck.authorized) {
 *     return authCheck.response;
 *   }
 * 
 *   // Your protected API logic here
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { RBACService } from "./rbac-service";

export interface AuthCheckResult {
  authorized: boolean;
  response?: NextResponse;
  userId?: string;
  policies?: string[];
}

/**
 * Require a specific policy for API access
 * @param policy - Policy name (e.g., "content:create")
 * @returns AuthCheckResult
 */
export async function requirePolicy(
  req: NextRequest,
  policy: string
): Promise<AuthCheckResult> {
  try {
    // Get user from token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.sub) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      };
    }

    const userId = token.sub;

    // Check if user has the required policy
    const hasAccess = await RBACService.hasPolicy(userId, policy);

    if (!hasAccess) {
      return {
        authorized: false,
        response: NextResponse.json(
          { 
            error: "Forbidden", 
            message: `Access denied. Required policy: ${policy}` 
          },
          { status: 403 }
        )
      };
    }

    return {
      authorized: true,
      userId
    };
  } catch (error) {
    console.error("Error in requirePolicy:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify access" },
        { status: 500 }
      )
    };
  }
}

/**
 * Require any of the specified policies
 * @param policies - Array of policy names
 * @returns AuthCheckResult
 */
export async function requireAnyPolicy(
  req: NextRequest,
  policies: string[]
): Promise<AuthCheckResult> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.sub) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      };
    }

    const userId = token.sub;

    const hasAccess = await RBACService.hasAnyPolicy(userId, policies);

    if (!hasAccess) {
      return {
        authorized: false,
        response: NextResponse.json(
          { 
            error: "Forbidden", 
            message: `Access denied. Required one of: ${policies.join(", ")}` 
          },
          { status: 403 }
        )
      };
    }

    return {
      authorized: true,
      userId
    };
  } catch (error) {
    console.error("Error in requireAnyPolicy:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify access" },
        { status: 500 }
      )
    };
  }
}

/**
 * Require all of the specified policies
 * @param policies - Array of policy names
 * @returns AuthCheckResult
 */
export async function requireAllPolicies(
  req: NextRequest,
  policies: string[]
): Promise<AuthCheckResult> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.sub) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      };
    }

    const userId = token.sub;

    const hasAccess = await RBACService.hasAllPolicies(userId, policies);

    if (!hasAccess) {
      return {
        authorized: false,
        response: NextResponse.json(
          { 
            error: "Forbidden", 
            message: `Access denied. Required all of: ${policies.join(", ")}` 
          },
          { status: 403 }
        )
      };
    }

    return {
      authorized: true,
      userId
    };
  } catch (error) {
    console.error("Error in requireAllPolicies:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify access" },
        { status: 500 }
      )
    };
  }
}

/**
 * Require admin access
 * @returns AuthCheckResult
 */
export async function requireAdmin(req: NextRequest): Promise<AuthCheckResult> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.sub) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      };
    }

    const userId = token.sub;

    const isAdminUser = await RBACService.isAdmin(userId);

    if (!isAdminUser) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden", message: "Admin access required" },
          { status: 403 }
        )
      };
    }

    return {
      authorized: true,
      userId
    };
  } catch (error) {
    console.error("Error in requireAdmin:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify access" },
        { status: 500 }
      )
    };
  }
}

/**
 * Get authenticated user (no policy check)
 * @returns AuthCheckResult with userId
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthCheckResult> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.sub) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      };
    }

    // Get user's policies for reference
    const policies = await RBACService.getUserPolicies(token.sub);

    return {
      authorized: true,
      userId: token.sub,
      policies
    };
  } catch (error) {
    console.error("Error in getAuthenticatedUser:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: "Failed to authenticate" },
        { status: 500 }
      )
    };
  }
}
