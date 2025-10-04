import { API_PERMISSIONS } from '@/lib/api/permissions';

describe('API Permissions Configuration', () => {
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
        const permission = API_PERMISSIONS[permKey as keyof typeof API_PERMISSIONS];
        expect(permission).toHaveProperty('adminOnly', true);
      });
    });

    it('should define user permissions without admin-only flags', () => {
      const userPermissions = [
        'PROFILE_VIEW',
        'PROFILE_EDIT',
        'SUBSCRIPTION_VIEW',
        'CONTENT_VIEW'
      ];

      userPermissions.forEach(permKey => {
        const permission = API_PERMISSIONS[permKey as keyof typeof API_PERMISSIONS];
        expect(permission.adminOnly).toBeFalsy();
      });
    });
  });
});
