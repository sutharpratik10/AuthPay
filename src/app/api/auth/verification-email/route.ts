import { NextRequest, NextResponse } from 'next/server';

/**
 * Get email from verification token (stored in secure cookie)
 * This endpoint returns the email address that needs to be verified
 */
export async function GET(request: NextRequest) {
  try {
    // Get verification token from cookie
    const verificationToken = request.cookies.get('verification-token')?.value;

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'No verification session found. Please register again.' },
        { status: 401 }
      );
    }

    try {
      // Decode the token
      const tokenData = JSON.parse(
        Buffer.from(verificationToken, 'base64').toString('utf-8')
      );

      // Check if token has expired
      if (tokenData.exp && Date.now() > tokenData.exp) {
        // Clear expired token
        const response = NextResponse.json(
          { error: 'Verification session expired. Please register again.' },
          { status: 401 }
        );
        response.cookies.delete('verification-token');
        return response;
      }

      // Return email without exposing it in URL
      return NextResponse.json({
        success: true,
        email: tokenData.email,
        userId: tokenData.userId
      });

    } catch (decodeError) {
      console.error('Error decoding verification token:', decodeError);
      
      // Clear invalid token
      const response = NextResponse.json(
        { error: 'Invalid verification session. Please register again.' },
        { status: 401 }
      );
      response.cookies.delete('verification-token');
      return response;
    }

  } catch (error) {
    console.error('Error getting verification email:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
