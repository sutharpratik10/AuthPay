import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionService } from '@/services/session';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request information
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    // Extract IP address (prioritize x-real-ip, then first IP from x-forwarded-for)
    let ipAddress: string | undefined;
    if (realIP) {
      ipAddress = realIP;
    } else if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    }    // Create session record
    const sessionRecord = await SessionService.createSession({
      userId: session.user.id,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      sessionId: sessionRecord.id
    });
  } catch (error) {
    console.error('Error creating session record:', error);
    return NextResponse.json(
      { error: 'Failed to create session record' },
      { status: 500 }
    );
  }
}
