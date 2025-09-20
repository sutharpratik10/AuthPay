import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }    // Check if email exists in database
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email.toLowerCase()),
      columns: { id: true, email: true }
    })
    const emailExists = !!existingUser

    return NextResponse.json({
      success: true,
      emailExists,
      message: emailExists 
        ? 'Email is already registered, kindly SignIn' 
        : 'Email is available'
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
