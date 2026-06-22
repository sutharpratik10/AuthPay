import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/config/auth'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 60 requests per minute
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = rateLimiters.api(async (_req: NextRequest) => {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Fetch user from database to check if password is set
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, password: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if password is set (not null)
    const hasPassword = user.password !== null && user.password !== undefined

    return NextResponse.json({
      hasPassword
    })

  } catch (error) {
    console.error('Password status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});
