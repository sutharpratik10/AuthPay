// Global test setup
import '@testing-library/jest-dom';

// Simple test helpers
const mockNextResponse = {
  json: jest.fn((data: unknown, init?: { status?: number }) => ({
    status: init?.status || 200,
    data
  }))
};

const mockNextRequest = jest.fn();

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: mockNextRequest,
  NextResponse: mockNextResponse
}));

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
