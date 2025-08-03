import { NextRequest, NextResponse } from 'next/server';
import { withPermission, checkPermission, requireAdmin, API_PERMISSIONS } from '@/lib/api-permissions';
import type { Session } from 'next-auth';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

jest.mock('@/services/permissions', () => ({
  PermissionService: {
    hasPermission: jest.fn(),
    isAdmin: jest.fn()
  }
}));

import { auth } from '@/auth';
import { PermissionService } from '@/services/permissions';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockHasPermission = PermissionService.hasPermission as jest.MockedFunction<typeof PermissionService.hasPermission>;
const mockIsAdmin = PermissionService.isAdmin as jest.MockedFunction<typeof PermissionService.isAdmin>;

describe('API Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withPermission', () => {
    const mockHandler = jest.fn().mockResolvedValue(new NextResponse('Success'));
    const mockRequest = new NextRequest('http://localhost/api/test');

    it('should allow access when user has required permission', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockHasPermission.mockResolvedValue(true);

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission' });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
      expect(response.status).toBe(200);
    });

    it('should deny access when user lacks required permission', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockHasPermission.mockResolvedValue(false);

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission' });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should deny access when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission' });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });

    it('should check admin status for admin-only routes', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockIsAdmin.mockResolvedValue(false);

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission', adminOnly: true });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockIsAdmin).toHaveBeenCalledWith('user-id');
      expect(response.status).toBe(403);
    });

    it('should allow admin access for admin-only routes', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockIsAdmin.mockResolvedValue(true);

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission', adminOnly: true });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
      expect(response.status).toBe(200);
    });

    it('should handle errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth error'));

      const wrappedHandler = withPermission(mockHandler, { permission: 'test.permission' });
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
    });
  });

  describe('checkPermission', () => {
    it('should return permission check result for authenticated user', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockHasPermission.mockResolvedValue(true);

      const result = await checkPermission('test.permission');

      expect(result).toEqual({
        hasPermission: true,
        userId: 'user-id',
        session: mockSession
      });
    });

    it('should return false for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await checkPermission('test.permission');

      expect(result).toEqual({
        hasPermission: false,
        userId: null,
        session: null
      });
    });

    it('should handle permission check errors', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockHasPermission.mockRejectedValue(new Error('Permission error'));

      const result = await checkPermission('test.permission');

      expect(result).toEqual({
        hasPermission: false,
        userId: 'user-id',
        session: mockSession
      });
    });
  });

  describe('requireAdmin', () => {
    it('should return admin status for authenticated admin', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockIsAdmin.mockResolvedValue(true);

      const result = await requireAdmin();

      expect(result).toEqual({
        isAdmin: true,
        userId: 'user-id',
        session: mockSession
      });
    });

    it('should return false for non-admin user', async () => {
      const mockSession: Session = {
        user: { id: 'user-id' },
        expires: ''
      };
      mockAuth.mockResolvedValue(mockSession);
      mockIsAdmin.mockResolvedValue(false);

      const result = await requireAdmin();

      expect(result).toEqual({
        isAdmin: false,
        userId: 'user-id',
        session: mockSession
      });
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireAdmin();

      expect(result).toEqual({
        isAdmin: false,
        userId: null,
        session: null
      });
    });
  });

  describe('API_PERMISSIONS', () => {
    it('should have all required permission configurations', () => {
      expect(API_PERMISSIONS.USER_VIEW).toEqual({
        permission: 'user.view'
      });

      expect(API_PERMISSIONS.PROFILE_EDIT).toEqual({
        permission: 'profile.edit'
      });

      expect(API_PERMISSIONS.SYSTEM_MANAGE).toEqual({
        permission: 'system.manage',
        adminOnly: true
      });
    });

    it('should have admin-only flags for sensitive operations', () => {
      const adminOnlyPermissions = [
        'SYSTEM_MANAGE',
        'USER_MANAGE',
        'SUBSCRIPTION_MANAGE'
      ];

      adminOnlyPermissions.forEach(permKey => {
        expect(API_PERMISSIONS[permKey as keyof typeof API_PERMISSIONS]).toHaveProperty('adminOnly', true);
      });
    });
  });
});
