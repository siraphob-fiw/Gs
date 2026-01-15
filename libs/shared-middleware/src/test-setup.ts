import { vi } from 'vitest';

// Mock NestJS decorators and dependencies
vi.mock('@nestjs/common', () => ({
  Injectable: () => (target: any) => target,
  NestMiddleware: () => (target: any) => target,
  BadRequestException: class BadRequestException extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'BadRequestException';
    }
  },
  ForbiddenException: class ForbiddenException extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'ForbiddenException';
    }
  },
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
