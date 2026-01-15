import { vi } from 'vitest';

// Mock bcrypt for password tests
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock fast-jwt for JWT tests
vi.mock('fast-jwt', () => ({
  createSigner: vi.fn(),
  createVerifier: vi.fn(),
  TokenError: class TokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TokenError';
    }
  },
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
