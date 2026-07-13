/**
 * Tests for sanitize.ts utility functions
 */

import {
  sanitizeString,
  sanitizeEmail,
  normalizeEmail,
  sanitizeOTPCode,
  sanitizeUUID,
  validatePassword,
  sanitizeName,
  hasSQLInjectionPatterns,
  escapeHTML,
  sanitizeHexToken,
} from '@/lib/utils/sanitize';

describe('sanitizeString', () => {
  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should remove null bytes and control characters', () => {
    expect(sanitizeString('hello\x00world\x07')).toBe('helloworld');
  });

  it('should preserve newlines and tabs', () => {
    expect(sanitizeString('hello\nworld\ttab')).toBe('hello\nworld\ttab');
  });

  it('should return empty string for null or undefined', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should validate correct email formats', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    expect(sanitizeEmail('User.Name+tag@Example.co.uk')).toBe('user.name+tag@example.co.uk');
  });

  it('should reject invalid email formats', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('@example.com')).toBeNull();
  });

  it('should sanitize and accept emails with trailing newline or carriage return', () => {
    expect(sanitizeEmail('test@example.com\n')).toBe('test@example.com');
    expect(sanitizeEmail('test@example.com\r')).toBe('test@example.com');
  });
});

describe('normalizeEmail', () => {
  it('should remove plus aliases', () => {
    expect(normalizeEmail('user+tag@example.com')).toBe('user@example.com');
  });

  it('should remove dots from gmail local parts', () => {
    expect(normalizeEmail('u.s.e.r@gmail.com')).toBe('user@gmail.com');
  });

  it('should remove dots from googlemail.com local parts', () => {
    expect(normalizeEmail('u.s.e.r@googlemail.com')).toBe('user@googlemail.com');
  });
});

describe('sanitizeOTPCode', () => {
  it('should accept 6-digit numeric codes', () => {
    expect(sanitizeOTPCode('123456')).toBe('123456');
  });

  it('should accept 8-digit numeric codes', () => {
    expect(sanitizeOTPCode('12345678')).toBe('12345678');
  });

  it('should reject non-numeric and wrong-length codes', () => {
    expect(sanitizeOTPCode('12345')).toBeNull();
    expect(sanitizeOTPCode('12345a')).toBeNull();
    expect(sanitizeOTPCode('1234567')).toBeNull();
    expect(sanitizeOTPCode('123456789')).toBeNull();
  });
});

describe('sanitizeUUID', () => {
  it('should accept valid UUID v4 strings', () => {
    expect(sanitizeUUID('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should reject invalid UUIDs', () => {
    expect(sanitizeUUID('not-a-uuid')).toBeNull();
    expect(sanitizeUUID('123456')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('should accept passwords meeting all requirements', () => {
    expect(validatePassword('StrongP@ssw0rd')).toEqual({ valid: true });
  });

  it('should accept passwords meeting exactly 3 of 4 classes', () => {
    expect(validatePassword('StrongPass1')).toEqual({ valid: true }); // upper, lower, digit
    expect(validatePassword('strongpass1!')).toEqual({ valid: true }); // lower, digit, special
    expect(validatePassword('STRONGPASS1!')).toEqual({ valid: true }); // upper, digit, special
    expect(validatePassword('StrongPass!')).toEqual({ valid: true }); // upper, lower, special
  });

  it('should reject passwords that are too short', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should reject passwords that are too long', () => {
    const result = validatePassword('A1!'.padEnd(130, 'a'));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password too long');
  });

  it('should reject passwords that meet length but fail complexity', () => {
    const result = validatePassword('onlylowercase');
    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character'
    );
  });

  it('should reject passwords with only 2 character classes', () => {
    expect(validatePassword('lowercase123').valid).toBe(false);
    expect(validatePassword('UPPERCASE123').valid).toBe(false);
    expect(validatePassword('PasswordOnly').valid).toBe(false);
  });

  it('should reject empty or non-string passwords', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
    expect(validatePassword(null)).toEqual({ valid: false, error: 'Password is required' });
    expect(validatePassword(undefined)).toEqual({ valid: false, error: 'Password is required' });
  });
});

describe('sanitizeName', () => {
  it('should accept valid names', () => {
    expect(sanitizeName('John Doe')).toBe('John Doe');
    expect(sanitizeName("O'Connor-Miller")).toBe("O'Connor-Miller");
  });

  it('should reject empty or invalid names', () => {
    expect(sanitizeName('')).toBeNull();
    expect(sanitizeName('John@Doe')).toBeNull();
  });
});

describe('hasSQLInjectionPatterns', () => {
  it('should detect common SQL injection patterns', () => {
    expect(hasSQLInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    expect(hasSQLInjectionPatterns("1 OR 1=1")).toBe(true);
  });

  it('should return false for safe input', () => {
    expect(hasSQLInjectionPatterns('Hello world')).toBe(false);
  });
});

describe('escapeHTML', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHTML('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });
});

describe('sanitizeHexToken', () => {
  it('should accept hex tokens', () => {
    expect(sanitizeHexToken('a1B2c3')).toBe('a1b2c3');
  });

  it('should reject non-hex tokens', () => {
    expect(sanitizeHexToken('ghijkl')).toBeNull();
  });

  it('should enforce length when specified', () => {
    expect(sanitizeHexToken('a1b2', 4)).toBe('a1b2');
    expect(sanitizeHexToken('a1b2', 6)).toBeNull();
  });
});
