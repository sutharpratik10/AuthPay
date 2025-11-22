import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { otpCodes } from '@/server/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import crypto from 'crypto'
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * SECURE PASSWORD RESET: Step 2 - Verify the OTP code
 * Requires sessionToken from Step 1 to prevent unauthorized access
 */
/**
 * Rate Limited: 5 requests per 15 minutes (STRICT - prevents brute force)
 */
export const POST = rateLimiters.auth(async (req: NextRequest) =>request: NextRequest) {
  try {
    const { code, sessionToken } = await request.json()

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid session. Please start the password reset process again.' },
        { status: 400 }
      )
    }

    console.log('[Verify Reset Code] Verifying code with session token')

    // SECURITY: Verify both the code AND session token match
    // This prevents attackers from bypassing the email step
    const resetCode = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.code, code),
        eq(otpCodes.sessionToken, sessionToken),
        eq(otpCodes.type, 'password_reset'),
        eq(otpCodes.isValid, true),
        gt(otpCodes.expiresAt, new Date())
      )
    })

    if (!resetCode) {
      console.log('[Verify Reset Code] Invalid code or session token')
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new reset code.' },
        { status: 400 }
      )
    }

    console.log('[Verify Reset Code] Code verified successfully')

    // Generate a verified token (proof that code was verified)
    const verifiedToken = crypto.randomBytes(32).toString('hex')
    
    // SECURITY: Update the record to mark as verified
    // This creates a token chain: sessionToken → verifiedToken → password reset
    await db.update(otpCodes)
      .set({ 
        verifiedToken,
        verifiedAt: new Date()
      })
      .where(eq(otpCodes.id, resetCode.id))

    console.log('[Verify Reset Code] Verified token generated')

    return NextResponse.json({ 
      success: true,
      verifiedToken, // Client needs this for Step 3 (password reset)
      message: 'Code verified successfully' 
    })

  } catch (error) {
    console.error('[Verify Reset Code Error]:', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying the code' },
      { status: 500 }
    )
  }
});
