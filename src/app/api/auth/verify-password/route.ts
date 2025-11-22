import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/config/auth'
import { db } from '@/server/db'
import { otpCodes } from '@/server/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { emailService } from '@/server/services/email'
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) =>request: NextRequest) {
  console.log('[Verify Password API] Request received')
  
  try {
    const session = await auth()
    console.log('[Verify Password API] Session:', session?.user?.email || 'No session')
    
    if (!session?.user?.id) {
      console.log('[Verify Password API] Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[Verify Password API] Request body received')
    const { currentPassword } = body

    if (!currentPassword || typeof currentPassword !== 'string') {
      console.log('[Verify Password API] Invalid request - missing currentPassword')
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      )
    }    // Fetch user with current password
    const userId = session.user.id;
    console.log('[Verify Password API] Fetching user:', userId)
    
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { id: true, email: true, password: true, name: true }
    })

    if (!user) {
      console.log('[Verify Password API] User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log('[Verify Password API] User found:', user.email)

    if (!user.password) {
      console.log('[Verify Password API] User has no password')
      return NextResponse.json(
        { error: 'User has no password set. Please use OAuth login.' },
        { status: 400 }
      )
    }

    // Verify current password
    console.log('[Verify Password API] Verifying current password')
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    console.log('[Verify Password API] Password valid:', isCurrentPasswordValid)
    
    if (!isCurrentPasswordValid) {
      console.log('[Verify Password API] Current password is incorrect')
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Generate OTP for password change
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    console.log('[Verify Password API] Generated OTP for user')

    // Delete any existing password change OTP codes for this user
    await db.delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.type, "password_change")
        )
      )
    
    console.log('[Verify Password API] Deleted old OTP codes')

    // Store OTP in database
    await db.insert(otpCodes).values({
      userId: user.id,
      code: otp,
      type: "password_change",
      expiresAt: otpExpiry,
      isValid: true,
      createdAt: new Date(),
    })
    
    console.log('[Verify Password API] OTP stored in database')

    // Send OTP via email
    try {
      console.log('[Verify Password API] Attempting to send OTP email to:', user.email)
      await emailService.sendPasswordChangeOTP(user.email, otp, user.name || '')
      console.log('[Verify Password API] OTP email sent successfully')
    } catch (emailError) {
      console.error('[Verify Password API] Failed to send OTP email:', emailError)
      // Continue anyway - OTP is stored in database
    }

    console.log('[Verify Password API] Success response')
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address',
      // In development, you might want to return the OTP for testing
      // Remove this in production!
      ...(process.env.NODE_ENV === 'development' && { otp })
    })

  } catch (error) {
    console.error('[Verify Password API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});
