import { NextResponse } from 'next/server';
import { phonePeService } from '@/lib/phonepe';

export async function GET() {
  try {
    // Create a test payment payload
    const testPayload = await phonePeService.createPayment({
      userId: 'test-user-123',
      orderId: 'TEST-ORDER-123',
      amount: 199.99,
      mobileNumber: '9876543210',
      redirectUrl: 'http://localhost:3000/payment/success',
      callbackUrl: 'http://localhost:3000/api/payments/phonepe/callback'
    });

    // Decode the payload to verify it's valid JSON
    const decodedPayload = JSON.parse(Buffer.from(testPayload.payload, 'base64').toString());

    return NextResponse.json({
      success: true,
      testData: {
        url: testPayload.url,
        payload: testPayload.payload,
        xVerify: testPayload.xVerify,
        decodedPayload,
        headers: testPayload.headers,
        payloadLength: testPayload.payload.length,
        xVerifyLength: testPayload.xVerify.length
      }
    });

  } catch (error) {
    console.error('Error testing PhonePe payload:', error);
    return NextResponse.json(
      { error: 'Failed to test PhonePe payload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
