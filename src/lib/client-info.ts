import { NextRequest } from 'next/server';

/**
 * Extract the real client IP address from request headers
 * Handles various proxy configurations and development environments
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers in order of preference
  const headers = [
    'x-real-ip',
    'x-forwarded-for', 
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // For x-forwarded-for, take the first IP (client IP)
      const ip = value.split(',')[0].trim();
      
      // Skip private/local IPs in production
      if (isPublicIP(ip)) {
        return ip;
      }
    }
  }
  // Fallback to connection IP (usually only available in some environments)
  // Note: NextRequest doesn't have direct IP access, this is handled by the runtime
  
  // In development or when behind proxies, try to get external IP
  // For testing purposes, we can use a test IP if in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Development environment detected - using test IP for location services');
    return '8.8.8.8'; // Google DNS - will show Mountain View, CA
  }

  // Final fallback
  return '127.0.0.1';
}

/**
 * Check if an IP address is public (not private/local)
 */
function isPublicIP(ip: string): boolean {
  if (!ip || ip === 'localhost' || ip === '::1' || ip === '127.0.0.1') {
    return false;
  }
  
  // IPv4 private ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  
  if (match) {
    const octets = match.slice(1).map(Number);
    const [a, b] = octets;
    
    // 10.0.0.0/8
    if (a === 10) return false;
    
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return false;
    
    // 192.168.0.0/16
    if (a === 192 && b === 168) return false;
    
    // 127.0.0.0/8 (localhost)
    if (a === 127) return false;
  }

  // Check for IPv6 private addresses
  if (ip.startsWith('::') || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return false;
  }

  return true;
}

/**
 * Get comprehensive client information from request
 */
export function getClientInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown User Agent';
  const ipAddress = getClientIP(request);
    // Additional debugging info
  const debugInfo = {
    'x-real-ip': request.headers.get('x-real-ip'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-client-ip': request.headers.get('x-client-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    'host': request.headers.get('host'),
    'origin': request.headers.get('origin'),
  };
  
  return {
    userAgent,
    ipAddress,
    debugInfo
  };
}
