import { NextResponse } from 'next/server';
import { phonePeService } from '@/lib/phonepe';

export async function GET() {
  try {
    // Test the payment status API with a sample merchant transaction ID
    const testMerchantTransactionId = 'TXN_1754328911071_3960e0bb'; // From the log above
    
    console.log('Testing payment status for:', testMerchantTransactionId);
    
    const statusRequest = await phonePeService.checkPaymentStatus(testMerchantTransactionId);
    
    console.log('Status request details:', {
      url: statusRequest.url,
      headers: statusRequest.headers
    });

    // Make the actual API call to PhonePe
    const response = await fetch(statusRequest.url, {
      method: 'GET',
      headers: statusRequest.headers
    });

    const responseData = await response.json();
    
    console.log('PhonePe status response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

    return NextResponse.json({
      success: true,
      testResults: {
        merchantTransactionId: testMerchantTransactionId,
        requestUrl: statusRequest.url,
        requestHeaders: statusRequest.headers,
        responseStatus: response.status,
        responseData: responseData
      }
    });

  } catch (error) {
    console.error('Error testing payment status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test payment status', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
