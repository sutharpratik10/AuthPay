/**
 * Input Validation Middleware
 * Provides request validation for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  sanitizeEmail, 
  sanitizeString, 
  validatePassword,
  sanitizeOTPCode,
  sanitizeHexToken,
  hasSQLInjectionPatterns
} from './sanitize';

export interface ValidationSchema {
  email?: { required?: boolean };
  password?: { required?: boolean };
  name?: { required?: boolean; maxLength?: number };
  code?: { required?: boolean; type?: 'otp' | 'hex' };
  token?: { required?: boolean; length?: number };
  [key: string]: { required?: boolean; maxLength?: number; type?: string; length?: number } | undefined;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedData?: Record<string, string | null>;
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody(
  body: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const sanitizedData: Record<string, string | null> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    if (!rules) continue;
    
    const value = body[field];
    
    // Check required fields
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return { valid: false, error: `${field} is required` };
    }
    
    // Skip validation if field is empty and not required
    if (!value) {
      sanitizedData[field] = null;
      continue;
    }
    
    // Must be a string
    if (typeof value !== 'string') {
      return { valid: false, error: `${field} must be a string` };
    }
    
    // Check for SQL injection patterns (defense in depth)
    if (hasSQLInjectionPatterns(value)) {
      console.warn(`[SECURITY] Potential SQL injection attempt detected in ${field}`);
      return { valid: false, error: 'Invalid input detected' };
    }
    
    // Field-specific validation
    switch (field) {
      case 'email':
        const email = sanitizeEmail(value);
        if (rules.required && !email) {
          return { valid: false, error: 'Invalid email format' };
        }
        sanitizedData[field] = email;
        break;
        
      case 'password':
      case 'newPassword':
      case 'currentPassword':
        const passwordResult = validatePassword(value);
        if (!passwordResult.valid) {
          return { valid: false, error: passwordResult.error };
        }
        sanitizedData[field] = value; // Don't sanitize passwords
        break;
        
      case 'code':
        if (rules.type === 'otp') {
          const otp = sanitizeOTPCode(value);
          if (rules.required && !otp) {
            return { valid: false, error: 'Invalid verification code format' };
          }
          sanitizedData[field] = otp;
        } else {
          sanitizedData[field] = sanitizeString(value);
        }
        break;
        
      case 'token':
      case 'sessionToken':
      case 'verifiedToken':
        const token = sanitizeHexToken(value, rules.length);
        if (rules.required && !token) {
          return { valid: false, error: 'Invalid token format' };
        }
        sanitizedData[field] = token || sanitizeString(value);
        break;
        
      default:
        let sanitized = sanitizeString(value);
        if (rules.maxLength && sanitized.length > rules.maxLength) {
          return { valid: false, error: `${field} exceeds maximum length` };
        }
        sanitizedData[field] = sanitized;
    }
  }
  
  return { valid: true, sanitizedData };
}

/**
 * Create a validated API handler wrapper
 */
export function withValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const body = await req.json();
      
      // Validate body structure
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
      
      // Validate against schema
      const validation = validateRequestBody(body as Record<string, unknown>, schema);
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      // Call the handler with sanitized data
      return handler(req, validation.sanitizedData as T);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: 'sql_injection_attempt' | 'rate_limit_exceeded' | 'invalid_token' | 'suspicious_activity',
  details: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details
  };
  
  console.warn('[SECURITY EVENT]', JSON.stringify(logEntry));
  
  // In production, you might want to send this to a security monitoring service
  // Example: await sendToSecurityMonitoring(logEntry);
}
