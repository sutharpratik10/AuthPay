import { NextRequest, NextResponse } from "next/server";

// 1. Setup Mocks
const mockSession = { user: { id: "test-user-id" } };
jest.mock('@/config/auth', () => ({
  auth: jest.fn(() => Promise.resolve(mockSession))
}));

jest.mock('@/lib/api/permissions', () => ({
  withPolicy: (handler: any) => handler,
  API_POLICIES: { ADMIN_ACCESS: 'admin:access' }
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve([])),
};

jest.mock('@/server/db', () => ({
  db: mockDb
}));

jest.mock('@/server/db/schema', () => ({
  freeTrialSettings: { id: 'freeTrialSettings.id', isActive: 'freeTrialSettings.isActive' },
  userSubscriptions: { userId: 'userSubscriptions.userId' },
  subscriptionStatuses: { name: 'subscriptionStatuses.name' }
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ col, val }))
}));

// 2. Import Handlers (after mocks are defined)
import { GET as adminGet, POST as adminPost } from "@/app/api/admin/free-trial/route";
import { POST as userPost } from "@/app/api/subscription-plans/free-trial/activate/route";
import { auth } from "@/config/auth";

// 3. Helper to create mock NextRequest
function createMockRequest(body?: any) {
  return {
    json: jest.fn().mockResolvedValue(body)
  } as unknown as NextRequest;
}

describe('Free Trial API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Routes (/api/admin/free-trial)', () => {
    describe('GET handler', () => {
      it('should return null when no free trial settings exist', async () => {
        mockDb.limit.mockResolvedValueOnce([]);
        
        const response = await adminGet({} as NextRequest) as NextResponse;
        const json = await response.json();
        
        expect(mockDb.select).toHaveBeenCalled();
        expect(json).toEqual({ data: null });
      });

      it('should return existing free trial settings', async () => {
        const mockSettings = { id: 1, planId: 'plan-123', durationDays: 14, isActive: true };
        mockDb.limit.mockResolvedValueOnce([mockSettings]);
        
        const response = await adminGet({} as NextRequest) as NextResponse;
        const json = await response.json();
        
        expect(json).toEqual({ data: mockSettings });
      });
    });

    describe('POST handler', () => {
      it('should create new settings if none exist', async () => {
        const reqBody = { planId: '550e8400-e29b-41d4-a716-446655440000', durationDays: 7, isActive: true };
        const req = createMockRequest(reqBody);
        
        // Mock existing lookup returning empty
        mockDb.limit.mockResolvedValueOnce([]);
        // Mock insert returning created row
        mockDb.returning.mockResolvedValueOnce([{ id: 1, ...reqBody }]);
        
        const response = await adminPost(req) as NextResponse;
        const json = await response.json();
        
        expect(mockDb.insert).toHaveBeenCalled();
        expect(json.message).toBe("Free trial settings created successfully");
        expect(json.data.planId).toBe(reqBody.planId);
      });

      it('should update existing settings if they exist', async () => {
        const reqBody = { planId: '550e8400-e29b-41d4-a716-446655440000', durationDays: 30, isActive: false };
        const req = createMockRequest(reqBody);
        
        // Mock existing lookup returning one record
        mockDb.limit.mockResolvedValueOnce([{ id: 1 }]);
        // Mock update returning updated row
        mockDb.returning.mockResolvedValueOnce([{ id: 1, ...reqBody }]);
        
        const response = await adminPost(req) as NextResponse;
        const json = await response.json();
        
        expect(mockDb.update).toHaveBeenCalled();
        expect(json.message).toBe("Free trial settings updated successfully");
        expect(json.data.durationDays).toBe(30);
      });

      it('should return 400 for invalid data', async () => {
        const reqBody = { planId: 'not-a-uuid', durationDays: -5 };
        const req = createMockRequest(reqBody);
        
        const response = await adminPost(req) as NextResponse;
        const json = await response.json();
        
        expect(response.status).toBe(400);
        expect(json.error).toBe("Invalid data");
      });
    });
  });

  describe('User Routes (/api/subscription-plans/free-trial/activate)', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null for this test
      (auth as jest.Mock).mockResolvedValueOnce(null);
      
      const response = await userPost() as NextResponse;
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it('should return 400 if free trial is not active', async () => {
      // Mock no active settings found
      mockDb.limit.mockResolvedValueOnce([]);
      
      const response = await userPost() as NextResponse;
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe("Free trial is not currently available");
    });

    it('should return 400 if user has already subscribed', async () => {
      // Mock active settings
      mockDb.limit.mockResolvedValueOnce([{ planId: 'plan-1', durationDays: 14 }]);
      
      // Mock user has existing subscriptions (no limit on this query in route.ts)
      mockDb.then.mockImplementationOnce((resolve) => resolve([{ id: 'sub-1' }])); 
      
      const response = await userPost() as NextResponse;
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe("You are not eligible for a free trial as you have previously subscribed.");
    });

    it('should successfully activate free trial for eligible user', async () => {
      // Mock active settings
      mockDb.limit.mockResolvedValueOnce([{ planId: 'plan-1', durationDays: 14 }]);
      
      // Mock user has NO existing subscriptions (where() returns array in route.ts)
      mockDb.then.mockImplementationOnce((resolve) => resolve([]));
      
      // Mock finding the 'free-trial' status
      mockDb.limit.mockResolvedValueOnce([{ id: 'status-123' }]);
      
      // Mock insert subscription returning the new sub
      mockDb.returning.mockResolvedValueOnce([{ id: 'new-sub', statusId: 'status-123' }]);
      
      const response = await userPost() as NextResponse;
      const json = await response.json();
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(json.message).toBe("Free trial activated successfully!");
      expect(json.data.id).toBe("new-sub");
    });

    it('should return 500 if system configuration error (missing free-trial status)', async () => {
      // Mock active settings
      mockDb.limit.mockResolvedValueOnce([{ planId: 'plan-1', durationDays: 14 }]);
      
      // Mock user has NO existing subscriptions
      mockDb.then.mockImplementationOnce((resolve) => resolve([]));
      
      // Mock finding the 'free-trial' status but returning empty
      mockDb.limit.mockResolvedValueOnce([]);
      
      const response = await userPost() as NextResponse;
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe("System configuration error");
    });
  });
});
