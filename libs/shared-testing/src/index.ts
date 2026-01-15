// Factory exports
export * from './factories/base-factory';
export * from './factories/mock-factory';
export * from './factories/user-factory';
export * from './factories/tenant-factory';
export * from './factories/program-factory';
export * from './factories/session-factory';

// Builder exports
export * from './builders/test-module-builder';
export * from './builders/test-application-factory';

// Mock exports
export * from './mocks/service-mocks';
export * from './mocks/enhanced-service-mocks';
export * from './mocks/database-mocks';

// Test utility exports
export * from './test-utilities/test-runner';
export * from './test-utilities/test-helpers';
export * from './test-utilities/test-seeder';
export * from './test-utilities/test-config';
export * from './test-utilities/test-isolation';
export * from './test-utilities/test-execution';
export * from './test-utilities/test-configs';
export * from './test-utilities/test-debugging';

// Template exports
export * from './templates';

// Re-export commonly used types
export type {
  FactoryOptions,
  BatchOptions,
  FactoryTrait
} from './factories/base-factory';

export type {
  UserFactoryOptions
} from './factories/user-factory';

export type {
  TenantFactoryOptions
} from './factories/tenant-factory';

export type {
  ProgramFactoryOptions
} from './factories/program-factory';

export type {
  SessionFactoryOptions
} from './factories/session-factory';

export type {
  TestSuite,
  TestRunnerOptions,
  TestResult,
  TestSummary
} from './test-utilities/test-runner';

export type {
  MockServiceOptions
} from './mocks/service-mocks';

export type {
  SeederOptions,
  SeededData
} from './test-utilities/test-seeder';

export type {
  TestConfigOptions
} from './test-utilities/test-config';

export type {
  TestAppConfig,
  TemplateVariables,
  TemplateFile,
  AppTemplate
} from './templates/types';

// Convenience exports for common patterns
export { userFactory } from './factories/user-factory';
export { tenantFactory } from './factories/tenant-factory';
export { programFactory } from './factories/program-factory';
export { sessionFactory } from './factories/session-factory';
export { createServiceMocks } from './mocks/service-mocks';
export { createEnhancedServiceMocks, createJestServiceMocks } from './mocks/enhanced-service-mocks';
export { createMockKnex, createMockRepository } from './mocks/database-mocks';
export { TestModuleBuilder } from './builders/test-module-builder';
export { TestApplicationFactory } from './builders/test-application-factory';
export { createTestRunner, runTests } from './test-utilities/test-runner';
export { createTestSeeder, seedTestData } from './test-utilities/test-seeder';
export { 
  createTestConfig, 
  testConfigs, 
  environmentConfigs,
  createDatabaseTestConfig,
  createApiTestConfig,
  createMockServiceConfig
} from './test-utilities/test-config';

// Template utilities
export { 
  createTestApplication, 
  createTestApplicationInteractive,
  listTestApplications,
  testApplicationExists,
  getTestApplicationInfo
} from './templates/create-test-application';
export { getTemplate, substituteTemplate } from './templates/templates';

// Test helper classes
export {
  TestDatabase,
  TestTimer,
  TestDataGenerator,
  ApiTestHelper,
  MockHelper,
  AssertionHelper,
  TestSetup,
  PerformanceHelper
} from './test-utilities/test-helpers';

// Test isolation utilities
export {
  TestIsolationManager,
  MemoryLeakDetector,
  TestStateIsolation,
  TestResourceManager,
  TestIsolationUtils,
  globalTestIsolation
} from './test-utilities/test-isolation';

// Test execution utilities
export {
  TestExecutionManager,
  TestExecutionCLI,
  createTestExecutionManager,
  runTestCategory,
  runTestsByTags,
  runAllTests
} from './test-utilities/test-execution';

// Test configuration utilities
export {
  testConfigurations,
  environmentConfigurations,
  applicationCategories,
  tagGroups,
  performanceThresholds,
  getTestConfiguration,
  getEnvironmentConfiguration,
  getApplicationCategories,
  getCategoriesByTagGroup,
  getPerformanceThreshold,
  createScenarioConfiguration,
  validateConfiguration,
  getRecommendedConfiguration
} from './test-utilities/test-configs';

// Test debugging utilities
export {
  TestErrorHandler,
  TestErrorCategory,
  TestErrorSeverity,
  TestDebuggingUtils,
  EnhancedExpectation,
  globalTestErrorHandler,
  configureTestDebugging
} from './test-utilities/test-debugging';