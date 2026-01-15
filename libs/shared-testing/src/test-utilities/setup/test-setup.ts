import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Set default timezone for consistent date testing
  process.env.TZ = 'UTC';
  
  // Suppress console logs in tests unless explicitly enabled
  if (!process.env.TEST_VERBOSE) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
  
  // Mock Date.now for consistent testing
  const mockDate = new Date('2024-01-01T00:00:00.000Z');
  vi.setSystemTime(mockDate);
});

afterAll(() => {
  // Restore all mocks
  vi.restoreAllMocks();
  
  // Reset system time
  vi.useRealTimers();
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers();
});

// Global test utilities
declare global {
  var testUtils: {
    mockDate: (date: string | Date) => void;
    restoreDate: () => void;
    mockConsole: () => {
      log: any;
      error: any;
      warn: any;
      info: any;
    };
    restoreConsole: () => void;
  };
}

globalThis.testUtils = {
  mockDate: (date: string | Date) => {
    vi.setSystemTime(new Date(date));
  },
  
  restoreDate: () => {
    vi.useRealTimers();
  },
  
  mockConsole: () => {
    return {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  },
  
  restoreConsole: () => {
    vi.restoreAllMocks();
  },
};

// Export for explicit imports
export const testUtils = globalThis.testUtils;