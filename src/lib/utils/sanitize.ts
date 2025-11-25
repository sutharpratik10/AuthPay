/**
 * Input Sanitization Utilities
 * Defense-in-depth approach to prevent injection attacks
 */

/**
 * Sanitize user input by removing potentially dangerous characters
 * This is a defense-in-depth measure - Drizzle ORM already parameterizes queries
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize email address
 * Returns null if invalid
 */
// RFC 5322 compliant email regex (simplified) - exported for reuse
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function sanitizeEmail(email: string | undefined | null): string | null {
  if (!email || typeof email !== 'string') return null;
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!EMAIL_REGEX.test(sanitized)) return null;
  if (sanitized.length > 254) return null;
  
  // Check for email header injection attempts
  if (sanitized.includes('\n') || sanitized.includes('\r')) return null;
  
  return sanitized;
}

/**
 * Validate OTP/verification code format
 * Only allows 6-digit numeric codes
 */
export function sanitizeOTPCode(code: string | undefined | null): string | null {
  if (!code || typeof code !== 'string') return null;
  
  const sanitized = sanitizeString(code);
  
  // OTP should be exactly 6 digits
  if (!/^\d{6}$/.test(sanitized)) return null;
  
  return sanitized;
}

/**
 * Validate UUID format
 */
export function sanitizeUUID(uuid: string | undefined | null): string | null {
  if (!uuid || typeof uuid !== 'string') return null;
  
  const sanitized = sanitizeString(uuid);
  
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(sanitized)) return null;
  
  return sanitized.toLowerCase();
}

/**
 * Validate and sanitize password
 * Returns null if password doesn't meet requirements
 */
export function validatePassword(password: string | undefined | null): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' };
  }
  
  return { valid: true };
}

/**
 * Sanitize name input
 * Allows letters, spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string | undefined | null): string | null {
  if (!name || typeof name !== 'string') return null;
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length === 0) return null;
  if (sanitized.length > 100) return null;
  
  // Only allow safe characters for names
  // Letters (including unicode), spaces, hyphens, apostrophes
  if (!/^[\p{L}\s'-]+$/u.test(sanitized)) return null;
  
  return sanitized;
}

/**
 * Check for SQL injection patterns
 * Returns true if suspicious patterns are detected
 */
export function hasSQLInjectionPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|JOIN)\b)/i,
    /('|"|;|--|\*|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s*['"0-9]/i,
    /\b(NULL|TRUE|FALSE)\b/i,
  ];
  
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHTML(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return input.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

/**
 * Validate hex token (for session tokens, CSRF tokens, etc.)
 */
export function sanitizeHexToken(token: string | undefined | null, length?: number): string | null {
  if (!token || typeof token !== 'string') return null;
  
  const sanitized = sanitizeString(token);
  
  // Only hex characters
  if (!/^[0-9a-f]+$/i.test(sanitized)) return null;
  
  // Check length if specified
  if (length && sanitized.length !== length) return null;
  
  return sanitized.toLowerCase();
}
