/**
 * Tests for NextAuth credentials provider email normalization
 */

const mockUserFindFirst = jest.fn();
const mockUpdateWhere = jest.fn().mockResolvedValue([]);
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });
const mockSessionCreate = jest.fn().mockResolvedValue(undefined);

jest.mock('@/server/db', () => ({
  db: {
    query: {
      users: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
  }
}));

jest.mock('@/server/db/schema', () => ({
  users: {},
}));

jest.mock('@/server/services/session', () => ({
  SessionService: {
    createSession: (...args: unknown[]) => mockSessionCreate(...args),
  }
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock the OAuth providers to avoid ESM/CJS interop issues in Jest
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn((config: { authorize?: (credentials: Record<string, unknown>) => Promise<unknown> }) => ({
    id: 'credentials',
    name: 'credentials',
    ...config,
  })),
}));

jest.mock('next-auth/providers/github', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'github', name: 'GitHub' })),
}));
jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'google', name: 'Google' })),
}));
jest.mock('next-auth/providers/facebook', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'facebook', name: 'Facebook' })),
}));
jest.mock('next-auth/providers/azure-ad', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'azure-ad', name: 'AzureAD' })),
}));
jest.mock('next-auth/providers/apple', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'apple', name: 'Apple' })),
}));

import authConfig from '@/config/auth.config';

describe('Credentials provider authorize', () => {
  let authorize: (credentials: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    const credentialsProvider = (authConfig.providers as unknown as Array<{ name?: string; id?: string; authorize?: (credentials: Record<string, unknown>) => Promise<unknown> }>).find(
      (p) => p.name === 'credentials' || p.id === 'credentials'
    );
    if (!credentialsProvider || typeof credentialsProvider.authorize !== 'function') {
      throw new Error('Credentials provider not found');
    }
    authorize = credentialsProvider.authorize.bind(credentialsProvider);
  });

  it('should log in with a Gmail + alias when the account was registered with the normalized email', async () => {
    const normalizedEmail = 'johndoe@gmail.com';

    mockUserFindFirst.mockResolvedValueOnce({
      id: 'user-123',
      email: normalizedEmail,
      name: 'John',
      password: 'hashed-password',
      isEmailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      userPreferences: { twoFactorAuth: false },
    });

    const result = await authorize({
      email: 'john.doe+tag@gmail.com',
      password: 'StrongP@ssw0rd',
    });

    expect(result).toMatchObject({
      id: 'user-123',
      email: normalizedEmail,
    });
    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      })
    );
  });

  it('should log in with a Gmail dot-variant when the account was registered with the normalized email', async () => {
    const normalizedEmail = 'johndoe@gmail.com';

    mockUserFindFirst.mockResolvedValueOnce({
      id: 'user-123',
      email: normalizedEmail,
      name: 'John',
      password: 'hashed-password',
      isEmailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      userPreferences: { twoFactorAuth: false },
    });

    const result = await authorize({
      email: 'john.doe@gmail.com',
      password: 'StrongP@ssw0rd',
    });

    expect(result).toMatchObject({
      id: 'user-123',
      email: normalizedEmail,
    });
  });

  it('should reject an invalid email', async () => {
    const result = await authorize({
      email: 'not-an-email',
      password: 'StrongP@ssw0rd',
    });

    expect(result).toBeNull();
    expect(mockUserFindFirst).not.toHaveBeenCalled();
  });
});
