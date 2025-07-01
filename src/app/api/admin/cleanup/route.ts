import { NextResponse } from "next/server";
import { CleanupService } from "@/services/cleanup";

export async function POST() {
  try {
    console.log('[API] Manual cleanup triggered');
    
    const result = await CleanupService.runCleanup();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Cleanup completed successfully",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to run cleanup",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to trigger cleanup",
    endpoint: "/api/admin/cleanup",
    method: "POST"
  }, { status: 405 });
}
