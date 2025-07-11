import { NextResponse } from 'next/server'
import { db } from '@/db'
import { timezones } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const activeTimezones = await db
      .select({
        id: timezones.id,
        name: timezones.name,
        code: timezones.code,
        utcOffset: timezones.utcOffset,
        description: timezones.description
      })
      .from(timezones)
      .where(eq(timezones.isActive, true))
      .orderBy(timezones.utcOffset, timezones.name)

    return NextResponse.json(activeTimezones)
  } catch (error) {
    console.error('Error fetching timezones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timezones' },
      { status: 500 }
    )
  }
}
