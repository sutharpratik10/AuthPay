import { PermissionService } from '@/services/permissions';

// Mock the database and dependencies
jest.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn()
      }
    },
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn()
      })
    })
  }
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn()
}));

import { db } from '@/db';

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true for admin users with any permission', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'admin'
      });

      const result = await PermissionService.hasPermission('user-id', 'any.permission');
      expect(result).toBe(true);
    });

    it('should return true for user with valid user permission', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.hasPermission('user-id', 'subscription.view');
      expect(result).toBe(true);
    });

    it('should return false for user with invalid permission', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.hasPermission('user-id', 'system.manage');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PermissionService.hasPermission('non-existent-user', 'any.permission');
      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      (db.query.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await PermissionService.hasPermission('user-id', 'any.permission');
      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return admin role for admin user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'admin'
      });

      const result = await PermissionService.getUserRole('user-id');
      expect(result).toBe('admin');
    });

    it('should return user role for regular user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.getUserRole('user-id');
      expect(result).toBe('user');
    });

    it('should return null for non-existent user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PermissionService.getUserRole('non-existent-user');
      expect(result).toBe(null);
    });

    it('should return null on database error', async () => {
      (db.query.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await PermissionService.getUserRole('user-id');
      expect(result).toBe(null);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'admin'
      });

      const result = await PermissionService.isAdmin('user-id');
      expect(result).toBe(true);
    });

    it('should return false for regular user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.isAdmin('user-id');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PermissionService.isAdmin('non-existent-user');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for admin user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'admin'
      });

      const result = await PermissionService.getUserPermissions('user-id');
      expect(result).toContain('user.view');
      expect(result).toContain('system.manage');
      expect(result).toContain('subscription.manage');
      expect(result.length).toBeGreaterThan(10);
    });

    it('should return limited permissions for regular user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.getUserPermissions('user-id');
      expect(result).toContain('subscription.view');
      expect(result).toContain('profile.view');
      expect(result).not.toContain('system.manage');
      expect(result).not.toContain('user.manage');
    });

    it('should return empty array for non-existent user', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PermissionService.getUserPermissions('non-existent-user');
      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      (db.query.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await PermissionService.getUserPermissions('user-id');
      expect(result).toEqual([]);
    });
  });

  describe('setUserRole', () => {
    beforeEach(() => {
      // Mock the update chain
      const whereMock = jest.fn();
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.update as jest.Mock).mockReturnValue({ set: setMock });
    });

    it('should successfully update user role when called by admin', async () => {
      // Mock admin check
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' }) // First call for admin check
        .mockResolvedValueOnce({ role: 'user' });  // Second call if needed

      const result = await PermissionService.setUserRole('admin-user-id', 'target-user-id', 'admin');
      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it('should fail when called by non-admin user', async () => {
      // Mock non-admin user
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        role: 'user'
      });

      const result = await PermissionService.setUserRole('user-id', 'target-user-id', 'admin');
      expect(result).toBe(false);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('should return false on database error', async () => {
      (db.query.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await PermissionService.setUserRole('admin-user-id', 'target-user-id', 'admin');
      expect(result).toBe(false);
    });
  });
});
