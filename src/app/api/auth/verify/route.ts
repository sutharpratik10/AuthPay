<<<<<<< HEAD
import { Routes } from "@/routes/routes";

export const runtime = 'nodejs';

export const GET = Routes.GET;
export const POST = Routes.POST;
=======
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const result = await AuthService.verifyEmail(code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Email verified successfully",
      user: result.user
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await AuthService.resendVerificationEmail(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent successfully"
    });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return NextResponse.json(
      { error: "An error occurred while resending verification email" },
      { status: 500 }
    );
  }
}
>>>>>>> d76ea7b (implemented signup and login forms with error handling and validation)
