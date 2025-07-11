import { NextResponse } from 'next/server'
import { db } from '@/db'
import { languages } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const activeLanguages = await db
      .select({
        id: languages.id,
        name: languages.name,
        code: languages.code,
        nativeName: languages.nativeName
      })
      .from(languages)
      .where(eq(languages.isActive, true))
      .orderBy(languages.name)

    return NextResponse.json(activeLanguages)
  } catch (error) {
    console.error('Error fetching languages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 }
    )
  }
}
