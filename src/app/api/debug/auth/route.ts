import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const path = request.nextUrl.pathname;
    
    const response = {
      timestamp: new Date().toISOString(),
      path,
      sessionExists: !!session,
      session: session,
      isAuthenticated: !!session,
      isEmailVerified: !!session?.user?.isEmailVerified,
      userInfo: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isEmailVerified: session.user.isEmailVerified
      } : null
    };
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get auth state",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
