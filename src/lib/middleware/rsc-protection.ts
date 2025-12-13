/**
 * RSC Protection Middleware
 * 
 * Protects against CVE-2025-55182 / CVE-2025-66478
 * React Server Components deserialization RCE vulnerability
 * 
 * This provides defense-in-depth protection even after patching.
 * The primary fix is upgrading to patched versions of Next.js and React.
 * 
 * @see https://nvd.nist.gov/vuln/detail/CVE-2025-55182
 */

import { NextRequest, NextResponse } from 'next/server';

// Dangerous patterns that indicate exploitation attempts
const DANGEROUS_PATTERNS: RegExp[] = [
  // Node.js module requires
  /require\s*\(\s*["']child_process["']\s*\)/i,
  /require\s*\(\s*["']fs["']\s*\)/i,
  /require\s*\(\s*["']net["']\s*\)/i,
  /require\s*\(\s*["']http["']\s*\)/i,
  /require\s*\(\s*["']https["']\s*\)/i,
  /require\s*\(\s*["']os["']\s*\)/i,
  /require\s*\(\s*["']vm["']\s*\)/i,
  /require\s*\(\s*["']cluster["']\s*\)/i,
  /require\s*\(\s*["']dgram["']\s*\)/i,
  /require\s*\(\s*["']dns["']\s*\)/i,
  /require\s*\(\s*["']readline["']\s*\)/i,
  /require\s*\(\s*["']repl["']\s*\)/i,
  /require\s*\(\s*["']tls["']\s*\)/i,
  
  // Dynamic imports of dangerous modules
  /import\s*\(\s*["']child_process["']\s*\)/i,
  /import\s*\(\s*["']fs["']\s*\)/i,
  
  // Process access
  /process\.env/i,
  /process\.exit/i,
  /process\.kill/i,
  /process\.binding/i,
  /process\.mainModule/i,
  
  // Code execution
  /execSync|spawnSync|exec\s*\(|spawn\s*\(/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /new\s+Function/i,
  /setTimeout\s*\(\s*["'`]/i,
  /setInterval\s*\(\s*["'`]/i,
  /setImmediate\s*\(\s*["'`]/i,
  
  // Prototype pollution
  /__proto__/i,
  /constructor\s*\[/i,
  /\.prototype\s*=/i,
  /Object\.assign\s*\(\s*Object\.prototype/i,
  /Object\.defineProperty\s*\(\s*Object\.prototype/i,
  
  // Cloud metadata endpoints (SSRF)
  /169\.254\.169\.254/,  // AWS/Azure metadata
  /metadata\.google\.internal/i,  // GCP metadata
  /100\.100\.100\.200/,  // Alibaba Cloud metadata
  
  // Sensitive file access
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/root\//i,
  /\.aws\/credentials/i,
  /\.ssh\//i,
  /\/proc\/self/i,
  /\/proc\/\d+/,
  
  // Shell command patterns
  /curl\s+.*\|\s*(bash|sh)/i,
  /wget\s+.*\|\s*(bash|sh)/i,
  /base64\s+-d/i,
  
  // Known malware/tools
  /xmrig/i,
  /sliver/i,
  /cobalt\s*strike/i,
  /metasploit/i,
  /meterpreter/i,
  
  // Reverse shell patterns
  /reverse.*shell/i,
  /bind.*shell/i,
  /nc\s+-[elp]/i,  // netcat
  /bash\s+-i\s+>&/i,  // bash reverse shell
  /python\s+-c.*socket/i,  // python reverse shell
  /perl\s+-e.*socket/i,  // perl reverse shell
  /ruby\s+-rsocket/i,  // ruby reverse shell
  /php\s+-r.*fsockopen/i,  // php reverse shell
  
  // Node.js specific RCE patterns
  /global\.process/i,
  /globalThis\.process/i,
  /this\.constructor\.constructor/i,
  /\[\s*["']constructor["']\s*\]/i,
];

// RSC-specific content types
const RSC_CONTENT_TYPES = [
  'text/x-component',
  'application/x-rsc',
  'text/x-flight',
];

/**
 * Security event for logging
 */
interface SecurityEvent {
  timestamp: Date;
  ip: string;
  userAgent: string;
  path: string;
  threats: string[];
  payload: string;
  blocked: boolean;
}

// In-memory security event log (limited to last 1000 events)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000;

/**
 * Validate payload for malicious content
 */
function validatePayload(payload: string): { valid: boolean; threats: string[] } {
  const threats: string[] = [];
  
  if (!payload || payload.length === 0) {
    return { valid: true, threats: [] };
  }
  
  // Check raw payload
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(payload)) {
      threats.push(`Dangerous pattern: ${pattern.source.substring(0, 50)}`);
    }
  }
  
  // Check URL decoded payload
  try {
    const decoded = decodeURIComponent(payload);
    if (decoded !== payload) {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(decoded)) {
          threats.push(`URL encoded threat: ${pattern.source.substring(0, 50)}`);
        }
      }
    }
  } catch {
    // Invalid URL encoding, continue
  }
  
  // Check Base64 decoded payload
  try {
    // Only attempt to decode if it looks like base64
    if (/^[A-Za-z0-9+/]+=*$/.test(payload) && payload.length > 20) {
      const base64Decoded = Buffer.from(payload, 'base64').toString('utf-8');
      // Only check if it looks like valid decoded content
      if (base64Decoded.length > 0 && /^[\x20-\x7E\s]+$/.test(base64Decoded)) {
        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(base64Decoded)) {
            threats.push(`Base64 encoded threat: ${pattern.source.substring(0, 50)}`);
          }
        }
      }
    }
  } catch {
    // Not valid base64, continue
  }
  
  // Check for malformed RSC chunk structures with executable code
  if (payload.includes('0:{"id"') && payload.includes('"name"')) {
    const nameMatch = payload.match(/"name"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (nameMatch && nameMatch[1]) {
      const nameValue = nameMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(nameValue)) {
          threats.push(`Malicious RSC name field: ${pattern.source.substring(0, 50)}`);
        }
      }
    }
  }
  
  // Check for chunks field with executable code
  if (payload.includes('"chunks"')) {
    const chunksMatch = payload.match(/"chunks"\s*:\s*\[([^\]]*)\]/);
    if (chunksMatch && chunksMatch[1]) {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(chunksMatch[1])) {
          threats.push(`Malicious RSC chunks: ${pattern.source.substring(0, 50)}`);
        }
      }
    }
  }
  
  return {
    valid: threats.length === 0,
    threats,
  };
}

/**
 * Check if request is an RSC request
 */
function isRSCRequest(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';
  const rscHeader = request.headers.get('rsc') || '';
  const nextAction = request.headers.get('next-action') || '';
  
  return (
    RSC_CONTENT_TYPES.some(type => contentType.includes(type) || accept.includes(type)) ||
    rscHeader === '1' ||
    nextAction !== ''
  );
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||  // Cloudflare
    request.headers.get('true-client-ip') ||    // Akamai
    'unknown'
  );
}

/**
 * Log security event
 */
function logSecurityEvent(event: SecurityEvent): void {
  securityEvents.push(event);
  
  // Keep only last MAX_EVENTS events in memory
  while (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift();
  }
  
  // Always log blocked requests
  if (event.blocked) {
    console.error('[RSC-PROTECTION] 🚨 BLOCKED ATTACK:', {
      timestamp: event.timestamp.toISOString(),
      ip: event.ip,
      path: event.path,
      threats: event.threats,
      userAgent: event.userAgent.substring(0, 100),
    });
  }
}

/**
 * RSC Protection Middleware
 * 
 * Inspects incoming requests for CVE-2025-55182 exploitation attempts
 * Should be the FIRST middleware in the chain
 */
export async function rscProtectionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Check all POST/PUT/PATCH requests and RSC requests
  const shouldInspect = 
    isRSCRequest(request) || 
    ['POST', 'PUT', 'PATCH'].includes(request.method);
  
  if (!shouldInspect) {
    return null; // Allow request to continue
  }
  
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const path = request.nextUrl.pathname;
  
  try {
    // Clone request to read body without consuming it
    const clonedRequest = request.clone();
    let body = '';
    
    try {
      body = await clonedRequest.text();
    } catch {
      // Body might not be text, continue
    }
    
    if (body && body.length > 0) {
      const validation = validatePayload(body);
      
      if (!validation.valid) {
        // Log the security event
        logSecurityEvent({
          timestamp: new Date(),
          ip,
          userAgent,
          path,
          threats: validation.threats,
          payload: body.substring(0, 500), // Truncate for logging
          blocked: true,
        });
        
        // Block the request with 403 Forbidden
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            code: 'SECURITY_VIOLATION',
            message: 'Request blocked by security policy',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Security-Block': 'CVE-2025-55182',
              'X-Content-Type-Options': 'nosniff',
            },
          }
        );
      }
    }
    
    // Check URL parameters for encoded payloads
    const searchParams = request.nextUrl.searchParams;
    for (const [key, value] of searchParams.entries()) {
      if (value && value.length > 0) {
        const paramValidation = validatePayload(value);
        if (!paramValidation.valid) {
          logSecurityEvent({
            timestamp: new Date(),
            ip,
            userAgent,
            path,
            threats: paramValidation.threats,
            payload: `${key}=${value.substring(0, 200)}`,
            blocked: true,
          });
          
          return new NextResponse(
            JSON.stringify({
              error: 'Forbidden',
              code: 'SECURITY_VIOLATION',
              message: 'Request blocked by security policy',
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'X-Security-Block': 'CVE-2025-55182',
                'X-Content-Type-Options': 'nosniff',
              },
            }
          );
        }
      }
    }
  } catch (error) {
    // Log error but don't block request on parsing errors to avoid DoS
    console.error('[RSC-PROTECTION] Error inspecting request:', error);
  }
  
  return null; // Allow request to continue
}

/**
 * Get recent security events for monitoring
 */
export function getSecurityEvents(limit: number = 100): SecurityEvent[] {
  return securityEvents.slice(-Math.min(limit, MAX_EVENTS));
}

/**
 * Get security statistics
 */
export function getSecurityStats(): {
  totalEvents: number;
  blockedRequests: number;
  recentBlockedIPs: string[];
  topThreats: { threat: string; count: number }[];
} {
  const threatCounts = new Map<string, number>();
  const recentBlockedIPs = new Set<string>();
  let blockedCount = 0;
  
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  for (const event of securityEvents) {
    if (event.blocked) {
      blockedCount++;
      
      if (event.timestamp.getTime() > oneDayAgo) {
        recentBlockedIPs.add(event.ip);
      }
      
      for (const threat of event.threats) {
        threatCounts.set(threat, (threatCounts.get(threat) || 0) + 1);
      }
    }
  }
  
  const topThreats = Array.from(threatCounts.entries())
    .map(([threat, count]) => ({ threat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalEvents: securityEvents.length,
    blockedRequests: blockedCount,
    recentBlockedIPs: Array.from(recentBlockedIPs).slice(0, 20),
    topThreats,
  };
}

// Export for testing
export { validatePayload, isRSCRequest, DANGEROUS_PATTERNS, RSC_CONTENT_TYPES };
