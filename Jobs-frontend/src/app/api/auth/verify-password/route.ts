import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { otpCodes } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { emailService } from '@/services/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const { currentPassword } = await request.json()

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      )
    }    // Fetch user with current password
    const userId = session.user.id;
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { id: true, email: true, password: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'User has no password set. Please use OAuth login.' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
        if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Generate OTP for password change
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Delete any existing password change OTP codes for this user
    await db.delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.type, "password_change")
        )
      )

    // Store OTP in database
    await db.insert(otpCodes).values({
      userId: user.id,
      code: otp,
      type: "password_change",
      expiresAt: otpExpiry,
      isValid: true,
      createdAt: new Date(),
    })

    // Send OTP via email
    try {
      await emailService.sendPasswordChangeOTP(user.email, otp, user.name || '')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Continue anyway - OTP is stored in database
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address',
      // In development, you might want to return the OTP for testing
      // Remove this in production!
      ...(process.env.NODE_ENV === 'development' && { otp })
    })

  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
