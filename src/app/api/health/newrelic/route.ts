import { NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/middleware/rate-limit';

/**
 * New Relic Health Check Endpoint
 * 
 * This endpoint verifies that New Relic APM is active and monitoring
 * 
 * @route GET /api/health/newrelic
 */
/**
 * Rate Limited: 100 requests per minute
 */
export const GET = rateLimiters.readOnly(async (req: NextRequest) =>) {
  try {
    // Try to import newrelic to verify it's available
    await import('newrelic');
    
    // Check if license key is set
    const licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
    const appName = process.env.NEW_RELIC_APP_NAME || 'Auth-Pay';
    
    // Get agent info
    const agentInfo = {
      isActive: !!licenseKey,
      appName: appName,
      licenseKeySet: !!licenseKey,
      licenseKeyPreview: licenseKey ? `${licenseKey.substring(0, 10)}...` : 'NOT SET',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      dashboard: 'https://one.newrelic.com/',
      accountId: '7393250',
      applicationId: '1388738971',
      directLink: 'https://rpm.newrelic.com/accounts/7393250/applications/1388738971'
    };
    
    return NextResponse.json({
      status: licenseKey ? 'active' : 'inactive',
      message: licenseKey 
        ? '✅ New Relic APM is active and monitoring' 
        : '⚠️  New Relic APM is NOT active - license key not set',
      ...agentInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: '❌ New Relic module not found or failed to load',
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendation: 'Run: npm install newrelic'
    }, { status: 500 });
  }
});
