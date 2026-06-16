/**
 * DIVA — Test Setup
 *
 * Global test configuration and mocks.
 */

// Set test environment
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/diva_test';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock console methods to reduce test output noise
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };
