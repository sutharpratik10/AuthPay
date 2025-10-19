/**
 * EXAMPLE: Policy-Protected API Route
 * 
 * This demonstrates how to use policy-based access control in your API routes.
 * Simply import the requirePolicy function and check if the user has access.
 * 
 * DELETE THIS FILE - IT'S JUST AN EXAMPLE!
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePolicy, requireAnyPolicy, POLICIES } from "@/lib/rbac";

/**
 * Example: Create content endpoint
 * Requires "content:create" policy
 */
export async function POST(req: NextRequest) {
  // Check if user has the required policy
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  
  if (!authCheck.authorized) {
    // User doesn't have access - return the error response
    return authCheck.response;
  }

  // User is authorized! Proceed with the logic
  const userId = authCheck.userId; // You have access to the user's ID

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await req.json();
    
    // Your content creation logic here
    // ...

    return NextResponse.json({
      success: true,
      message: "Content created successfully",
      userId
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}

/**
 * Example: View content endpoint
 * Requires either "content:view" OR "content:manage" policy
 */
export async function GET(req: NextRequest) {
  // Check if user has ANY of the required policies
  const authCheck = await requireAnyPolicy(req, [
    POLICIES.CONTENT_VIEW,
    POLICIES.CONTENT_MANAGE
  ]);
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // User has at least one of the required policies
  try {
    // Your content fetching logic here
    // ...

    return NextResponse.json({
      success: true,
      data: [] // Your content data
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

/**
 * Example: You can also use custom policy names (not in POLICIES constants)
 */
export async function PUT(req: NextRequest) {
  // Use a custom policy name
  const authCheck = await requirePolicy(req, "custom:action");
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  return NextResponse.json({ success: true });
}
