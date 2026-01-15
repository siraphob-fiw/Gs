import '@testing-library/jest-dom';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Essential browser API mocks that are needed for jsdom environment
// These are minimal mocks for APIs not available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Note: Next.js router and navigation mocks are now handled per-test
// using TestModuleBuilder and component-specific mock utilities
// This prevents global mock pollution between tests