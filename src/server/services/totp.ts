/**
 * TOTP Service
 * 
 * Handles all TOTP (Time-based One-Time Password) operations:
 * - Secret generation and URI creation
 * - Token verification with configurable time window
 * - Recovery code generation, hashing, and verification
 * - Secret encryption/decryption at rest
 * 
 * Uses the `otpauth` library (RFC 6238 compliant).
 */

import * as OTPAuth from 'otpauth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '@/lib/utils/encryption';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AuthPay';

// TOTP configuration
const TOTP_CONFIG = {
  /** Number of digits in the TOTP code */
  digits: 6,
  /** Time step in seconds */
  period: 30,
  /** Algorithm used for HMAC */
  algorithm: 'SHA1' as const,
  /** Time window tolerance (±1 step = 30s each way) */
  window: 1,
};

/** Number of recovery codes to generate */
const RECOVERY_CODE_COUNT = 10;
/** Length of each recovery code (characters) */
const RECOVERY_CODE_LENGTH = 8;
/** Bcrypt salt rounds for recovery code hashing */
const BCRYPT_ROUNDS = 10;

export class TOTPService {
  /**
   * Generate a new TOTP secret and OTP Auth URI for a user.
   * The secret is returned in base32 format (for manual entry)
   * and as a full otpauth:// URI (for QR code generation).
   */
  static generateSecret(email: string): { secret: string; uri: string } {
    const secret = new OTPAuth.Secret({ size: 20 }); // 160-bit secret

    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      label: email,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      secret,
    });

    return {
      secret: secret.base32,
      uri: totp.toString(),
    };
  }

  /**
   * Verify a TOTP token against a base32 secret.
   * Supports time-step drift within the configured window.
   * 
   * @returns true if the token is valid within the time window
   */
  static verifyToken(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // validate() returns the time step delta (0 = exact match, null = invalid)
    const delta = totp.validate({
      token,
      window: TOTP_CONFIG.window,
    });

    return delta !== null;
  }

  /**
   * Generate a set of single-use recovery codes.
   * Each code is an 8-character alphanumeric string.
   * 
   * @returns Array of plaintext recovery codes (display to user once)
   */
  static generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
    const codes: string[] = [];
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: 0, O, I, 1

    for (let i = 0; i < count; i++) {
      const bytes = crypto.randomBytes(RECOVERY_CODE_LENGTH);
      let code = '';
      for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
        code += charset[bytes[j] % charset.length];
      }
      // Format as XXXX-XXXX for readability
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Hash a recovery code for secure storage.
   */
  static async hashRecoveryCode(code: string): Promise<string> {
    // Normalize: uppercase, remove dashes
    const normalized = code.toUpperCase().replace(/-/g, '');
    return bcrypt.hash(normalized, BCRYPT_ROUNDS);
  }

  /**
   * Verify a recovery code against its stored hash.
   */
  static async verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
    const normalized = code.toUpperCase().replace(/-/g, '');
    return bcrypt.compare(normalized, hash);
  }

  /**
   * Encrypt a TOTP secret for database storage.
   */
  static encryptSecret(secret: string): string {
    return encrypt(secret);
  }

  /**
   * Decrypt a TOTP secret from database storage.
   */
  static decryptSecret(encryptedSecret: string): string {
    return decrypt(encryptedSecret);
  }
}
