import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/db";
import { loginHistory } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await db.query.loginHistory.findMany({
      where: eq(loginHistory.userId, session.user.id),
      orderBy: [desc(loginHistory.loginAt)],
      limit: 10,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json(
      { error: "Failed to fetch login history" },
      { status: 500 }
    );
  }
}
