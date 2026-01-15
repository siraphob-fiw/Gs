import { vi } from 'vitest';

// Mock global fetch for HTTP client tests
global.fetch = vi.fn();

// Mock AbortController if not available in test environment
if (!global.AbortController) {
  global.AbortController = vi.fn(() => ({
    signal: {},
    abort: vi.fn(),
  })) as any;
}

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
