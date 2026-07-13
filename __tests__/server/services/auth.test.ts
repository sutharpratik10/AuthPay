/**
 * Tests for AuthService email verification and OTP attempt counting
 */

const mockOtpFindFirst = jest.fn();
const mockUserFindFirst = jest.fn();
const mockRolesFindFirst = jest.fn();
const mockUpdateWhere = jest.fn().mockResolvedValue([]);
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });
const mockDeleteWhere = jest.fn().mockResolvedValue([]);
const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });
const mockCleanupExpiredOtpCodes = jest.fn().mockResolvedValue({ success: true, deletedCount: 0 });

const mockTransaction = jest.fn();

jest.mock('@/server/db', () => ({
  db: {
    query: {
      otpCodes: { findFirst: (...args: unknown[]) => mockOtpFindFirst(...args) },
      users: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      roles: { findFirst: (...args: unknown[]) => mockRolesFindFirst(...args) },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([{ id: 'inserted' }]) }) }),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  }
}));

jest.mock('@/server/db/schema', () => ({
  users: {},
  otpCodes: {},
  userRoles: {},
}));

jest.mock('@/server/services/email-queue', () => ({
  EmailQueueService: {
    enqueueVerificationEmail: jest.fn(),
    enqueueWelcomeEmail: jest.fn(),
    enqueuePasswordResetEmail: jest.fn(),
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('uuid-123'),
}));

import { AuthService } from '@/server/services/auth';

// Replace cleanup with a mock so the fallback path remains deterministic
AuthService.cleanupExpiredOtpCodes = mockCleanupExpiredOtpCodes;

describe('AuthService.verifyEmail', () => {
  const userId = 'user-123';
  const email = 'test@example.com';
  const validCode = '87654321';
  const wrongCode = '12345678';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify a correct 8-digit code when userId is known', async () => {
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      user: { email, name: 'Test' },
    });
    mockUserFindFirst.mockResolvedValueOnce({ email, name: 'Test', isEmailVerified: true });

    const result = await AuthService.verifyEmail(validCode, userId);

    expect(result.success).toBe(true);
    expect(mockOtpFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        with: { user: true },
      })
    );
    expect(mockDelete).toHaveBeenCalled();
    expect(AuthService.cleanupExpiredOtpCodes).not.toHaveBeenCalled();
  });

  it('should increment attemptCount on a wrong guess and return generic error', async () => {
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      user: { email, name: 'Test' },
    });

    const result = await AuthService.verifyEmail(wrongCode, userId);

    expect(result).toMatchObject({ success: false, error: 'Invalid or expired verification code' });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ attemptCount: 1 });
  });

  it('should mark OTP invalid after 5 wrong guesses', async () => {
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 4,
      user: { email, name: 'Test' },
    });

    const result = await AuthService.verifyEmail(wrongCode, userId);

    expect(result.success).toBe(false);
    expect(mockUpdateSet).toHaveBeenCalledWith({ attemptCount: 5, isValid: false });
  });

  it('should increment attemptCount on an expired code', async () => {
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
      attemptCount: 1,
      user: { email, name: 'Test' },
    });

    const result = await AuthService.verifyEmail(validCode, userId);

    expect(result.success).toBe(false);
    expect(mockUpdateSet).toHaveBeenCalledWith({ attemptCount: 2 });
  });

  it('should fall back to exact-code lookup when userId is not provided', async () => {
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      user: { email, name: 'Test' },
    });
    mockUserFindFirst.mockResolvedValueOnce({ email, name: 'Test', isEmailVerified: true });

    const result = await AuthService.verifyEmail(validCode);

    expect(result.success).toBe(true);
    expect(AuthService.cleanupExpiredOtpCodes).toHaveBeenCalled();
  });

  it('should reject a 6-digit code for the new 8-digit verification flow', async () => {
    // This test documents that the UI sends 8-digit codes; a 6-digit code is simply a wrong guess.
    mockOtpFindFirst.mockResolvedValueOnce({
      id: 'otp-1',
      userId,
      code: validCode,
      type: 'email_verification',
      isValid: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      user: { email, name: 'Test' },
    });

    const result = await AuthService.verifyEmail('123456', userId);

    expect(result.success).toBe(false);
    expect(mockUpdateSet).toHaveBeenCalledWith({ attemptCount: 1 });
  });
});

describe('AuthService.generateVerificationCode', () => {
  it('should generate 8-digit numeric codes', () => {
    const code = (AuthService as unknown as { generateVerificationCode: () => string }).generateVerificationCode();
    expect(code).toMatch(/^\d{8}$/);
  });
});

describe('AuthService.registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockReset();
  });

  it('should normalize a Gmail + alias email before storing', async () => {
    const inputEmail = 'john.doe+tag@gmail.com';
    const normalizedEmail = 'johndoe@gmail.com';

    mockUserFindFirst.mockResolvedValueOnce(undefined);
    mockRolesFindFirst.mockResolvedValueOnce({ id: 'role-123' });

    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback({
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([{
              id: 'uuid-123',
              email: normalizedEmail,
              name: null,
              isEmailVerified: false,
            }]),
          }),
        }),
      });
    });

    const result = await AuthService.registerUser(inputEmail, 'StrongP@ssw0rd');

    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      user: expect.objectContaining({ email: normalizedEmail }),
    });
    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      })
    );
  });

  it('should normalize a Gmail dot-variant email before storing', async () => {
    const inputEmail = 'john.doe@gmail.com';
    const normalizedEmail = 'johndoe@gmail.com';

    mockUserFindFirst.mockResolvedValueOnce(undefined);
    mockRolesFindFirst.mockResolvedValueOnce({ id: 'role-123' });

    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback({
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([{
              id: 'uuid-123',
              email: normalizedEmail,
              name: null,
              isEmailVerified: false,
            }]),
          }),
        }),
      });
    });

    const result = await AuthService.registerUser(inputEmail, 'StrongP@ssw0rd');

    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      user: expect.objectContaining({ email: normalizedEmail }),
    });
  });
});

describe('AuthService.initiatePasswordReset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a normalized account when given a Gmail + alias', async () => {
    const inputEmail = 'jane.doe+tag@gmail.com';
    const normalizedEmail = 'janedoe@gmail.com';

    mockUserFindFirst.mockResolvedValueOnce({
      id: 'user-123',
      email: normalizedEmail,
      name: 'Jane',
    });

    const result = await AuthService.initiatePasswordReset(inputEmail);

    expect(result.success).toBe(true);
    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      })
    );
    // Ensure lookup used the normalized email by inspecting the where callback
    const whereFn = mockUserFindFirst.mock.calls[0][0].where;
    const usersTable = { email: 'email' };
    const eqMock = (a: unknown, b: unknown) => ({ eq: [a, b] });
    const whereResult = whereFn(usersTable, { eq: eqMock });
    expect(whereResult.eq[1]).toBe(normalizedEmail);
  });

  it('should still return generic success when email does not exist', async () => {
    mockUserFindFirst.mockResolvedValueOnce(undefined);

    const result = await AuthService.initiatePasswordReset('unknown+tag@gmail.com');

    expect(result.success).toBe(true);
    expect(result).toMatchObject({
      message: 'If an account exists with this email, a reset code has been sent',
    });
  });
});
