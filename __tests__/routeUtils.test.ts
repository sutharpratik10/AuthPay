/**
 * Tests for Route Utilities
 * Testing route building, URL generation, and redirect helpers
 */

import { ROUTES, buildUrl, getLoginRedirectUrl, URL } from '@/routes/routeUtils';

describe('Route Utils', () => {
  describe('ROUTES constants', () => {
    it('should have correct auth routes', () => {
      expect(ROUTES.AUTH.ROOT).toBe('/auth');
      expect(ROUTES.AUTH.LOGIN).toBe('/auth/login');
      expect(ROUTES.AUTH.SIGNUP).toBe('/auth/signup');
      expect(ROUTES.AUTH.FORGOT_PASSWORD).toBe('/auth/forgot-password');
    });

    it('should have correct protected routes', () => {
      expect(ROUTES.PROTECTED.ROOT).toBe('/protected');
      expect(ROUTES.PROTECTED.ADMIN_DASHBOARD).toBe('/protected/admin/dashboard');
      expect(ROUTES.PROTECTED.USER_DASHBOARD).toBe('/protected/user/dashboard');
      expect(ROUTES.PROTECTED.SETTINGS).toBe('/protected/settings');
    });

    it('should have correct public routes', () => {
      expect(ROUTES.PUBLIC.HOME).toBe('/');
      expect(ROUTES.PUBLIC.ABOUT).toBe('/about');
      expect(ROUTES.PUBLIC.CONTACT).toBe('/contact');
    });
  });

  describe('buildUrl', () => {
    it('should build URL with single parameter', () => {
      const pattern = '/user/:id';
      const result = buildUrl(pattern, { id: '123' });
      expect(result).toBe('/user/123');
    });

    it('should build URL with multiple parameters', () => {
      const pattern = '/user/:userId/post/:postId';
      const result = buildUrl(pattern, { userId: '123', postId: '456' });
      expect(result).toBe('/user/123/post/456');
    });

    it('should handle numeric parameters', () => {
      const pattern = '/page/:pageNum';
      const result = buildUrl(pattern, { pageNum: 42 });
      expect(result).toBe('/page/42');
    });

    it('should return original pattern if no params provided', () => {
      const pattern = '/static/route';
      const result = buildUrl(pattern);
      expect(result).toBe('/static/route');
    });

    it('should handle empty params object', () => {
      const pattern = '/user/:id';
      const result = buildUrl(pattern, {});
      expect(result).toBe('/user/:id');
    });
  });

  describe('getLoginRedirectUrl', () => {
    it('should return login route when no returnTo provided', () => {
      const result = getLoginRedirectUrl();
      expect(result).toBe(ROUTES.AUTH.LOGIN);
    });

    it('should encode returnTo parameter', () => {
      const returnTo = '/protected/dashboard';
      const result = getLoginRedirectUrl(returnTo);
      expect(result).toBe(`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`);
    });

    it('should properly encode special characters in returnTo', () => {
      const returnTo = '/page?tab=settings&section=profile';
      const result = getLoginRedirectUrl(returnTo);
      expect(result).toContain('returnTo=');
      expect(result).toContain(encodeURIComponent(returnTo));
    });

    it('should handle undefined returnTo', () => {
      const result = getLoginRedirectUrl(undefined);
      expect(result).toBe(ROUTES.AUTH.LOGIN);
    });
  });

  describe('URL helper object', () => {
    it('should provide login URL', () => {
      expect(URL.login()).toBe(ROUTES.AUTH.LOGIN);
    });

    it('should provide signup URL', () => {
      expect(URL.signup()).toBe(ROUTES.AUTH.SIGNUP);
    });

    it('should provide dashboard URLs', () => {
      expect(URL.adminDashboard()).toBe(ROUTES.PROTECTED.ADMIN_DASHBOARD);
      expect(URL.userDashboard()).toBe(ROUTES.PROTECTED.USER_DASHBOARD);
    });

    it('should provide settings and profile URLs', () => {
      expect(URL.settings()).toBe(ROUTES.PROTECTED.SETTINGS);
      expect(URL.profile()).toBe(ROUTES.PROTECTED.PROFILE);
      expect(URL.account()).toBe(ROUTES.PROTECTED.ACCOUNT);
    });

    it('should provide public URLs', () => {
      expect(URL.home()).toBe(ROUTES.PUBLIC.HOME);
    });

    it('should expose helper functions', () => {
      expect(typeof URL.buildUrl).toBe('function');
      expect(typeof URL.getLoginRedirectUrl).toBe('function');
    });
  });
});
