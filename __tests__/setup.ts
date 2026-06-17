/**
 * Jest test setup file
 * This file runs before all tests to set up the test environment
 */

// Setup environment variables for testing
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Extend Jest matchers if needed
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error visible for debugging
};
