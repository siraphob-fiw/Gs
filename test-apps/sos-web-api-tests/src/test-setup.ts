/**
 * Minimal test setup for sos-web-api-tests
 * This file configures the test environment without global mocks
 * All mocking is now handled through dependency injection overrides
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Configure test timeouts based on environment
import { TestEnvironmentConfig } from './utils/test-config';

const timeouts = TestEnvironmentConfig.getTimeouts();
jest.setTimeout(timeouts.unit); // Default timeout for unit tests

// Minimal global setup - no global mocks
beforeEach(() => {
  // Clear all mocks to prevent test pollution
  // Individual tests handle their own mocking through dependency injection
  jest.clearAllMocks();
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Export test utilities for use in test files
export { TestEnvironmentConfig } from './utils/test-config';
export { SosWebApiTestConfigs } from './utils/test-config';
export { TestModuleBuilder } from './utils/test-module-builder';
export { SosWebApiTestApplicationFactory } from './utils/test-application-factory';
// export { 
//   userTestFactory, 
//   tenantTestFactory, 
//   programTestFactory, 
//   sessionTestFactory,
//   sosWebApiTestDataBuilder 
// } from './fixtures/test-factories';