import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      session,
      hasSession: !!session,
      isAuthenticated: !!session,
      isEmailVerified: !!session?.user?.isEmailVerified,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get session",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
