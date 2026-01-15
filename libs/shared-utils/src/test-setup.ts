import { vi } from 'vitest';

// Mock uuid for deterministic testing
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid-v4'),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(),
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
