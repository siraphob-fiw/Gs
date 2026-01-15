import { defineConfig } from 'vitest/config';
import path from 'path';

export interface TestConfigOptions {
  testDir?: string;
  coverage?: boolean;
  coverageThreshold?: number;
  setupFiles?: string[];
  globalSetup?: string;
  globalTeardown?: string;
  testTimeout?: number;
  hookTimeout?: number;
  teardownTimeout?: number;
  maxWorkers?: number;
  minWorkers?: number;
  silent?: boolean;
  verbose?: boolean;
  bail?: number;
  passWithNoTests?: boolean;
  environment?: 'node' | 'jsdom' | 'happy-dom';
  globals?: boolean;
  isolate?: boolean;
  pool?: 'threads' | 'forks';
}

/**
 * Create a Vitest configuration for StrengthOS testing
 */
export function createTestConfig(options: TestConfigOptions = {}) {
  const {
    testDir = 'src',
    coverage = true,
    coverageThreshold = 80,
    setupFiles = [],
    globalSetup,
    globalTeardown,
    testTimeout = 30000,
    hookTimeout = 10000,
    teardownTimeout = 10000,
    maxWorkers,
    minWorkers,
    silent = false,
    verbose = false,
    bail = 1,
    passWithNoTests = true,
    environment = 'node',
    globals = true,
    isolate = true,
    pool = 'threads',
  } = options;

  return defineConfig({
    test: {
      // Test discovery
      include: [
        `${testDir}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`,
        `${testDir}/**/*.{integration,e2e,perf}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`,
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      ],

      // Environment
      environment,
      globals,
      isolate,
      pool,

      // Timeouts
      testTimeout,
      hookTimeout,
      teardownTimeout,

      // Workers
      ...(maxWorkers && { maxWorkers }),
      ...(minWorkers && { minWorkers }),

      // Setup
      setupFiles: [
        ...setupFiles,
        // Add default setup files
        path.resolve(__dirname, './setup/test-setup.ts'),
      ],
      globalSetup,
      // globalTeardown, // Not supported in this vitest version

      // Reporting
      silent,
      ...(verbose && { reporter: 'verbose' }),
      bail,
      passWithNoTests,

      // Coverage
      coverage: coverage ? {
        enabled: true,
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'coverage/**',
          'dist/**',
          '**/node_modules/**',
          '**/test/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/*.config.*',
          '**/setup/**',
          '**/mocks/**',
          '**/factories/**',
        ],
        thresholds: {
          global: {
            branches: coverageThreshold,
            functions: coverageThreshold,
            lines: coverageThreshold,
            statements: coverageThreshold,
          },
        },
        all: true,
        skipFull: false,
      } : undefined,

      // TypeScript
      typecheck: {
        enabled: true,
        tsconfig: './tsconfig.json',
      },
    },

    // Resolve
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '@test': path.resolve(process.cwd(), 'src/__tests__'),
        '@mocks': path.resolve(process.cwd(), 'src/__mocks__'),
        '@factories': path.resolve(process.cwd(), 'src/factories'),
      },
    },

    // Define
    define: {
      __TEST__: true,
    },
  });
}

/**
 * Predefined configurations for different test types
 */
export const testConfigs = {
  /**
   * Unit test configuration
   */
  unit: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 10000,
    coverage: true,
    coverageThreshold: 90,
    environment: 'node',
    isolate: true,
    ...options,
  }),

  /**
   * Integration test configuration
   */
  integration: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 30000,
    coverage: true,
    coverageThreshold: 70,
    environment: 'node',
    isolate: false,
    maxWorkers: 1, // Sequential execution for integration tests
    ...options,
  }),

  /**
   * End-to-end test configuration
   */
  e2e: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    coverage: false,
    environment: 'node',
    isolate: false,
    maxWorkers: 1,
    bail: 1,
    ...options,
  }),

  /**
   * Performance test configuration
   */
  performance: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 120000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    coverage: false,
    environment: 'node',
    isolate: false,
    maxWorkers: 1,
    silent: true,
    ...options,
  }),

  /**
   * Browser test configuration
   */
  browser: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 30000,
    coverage: true,
    coverageThreshold: 80,
    environment: 'jsdom',
    globals: true,
    ...options,
  }),

  /**
   * Component test configuration
   */
  component: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 15000,
    coverage: true,
    coverageThreshold: 85,
    environment: 'jsdom',
    globals: true,
    isolate: true,
    ...options,
  }),
};

/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
  /**
   * Development environment
   */
  development: (options: TestConfigOptions = {}) => createTestConfig({
    coverage: false,
    verbose: true,
    bail: 0, // Don't bail on first failure
    passWithNoTests: true,
    ...options,
  }),

  /**
   * CI environment
   */
  ci: (options: TestConfigOptions = {}) => createTestConfig({
    coverage: true,
    coverageThreshold: 80,
    silent: true,
    bail: 1,
    passWithNoTests: false,
    maxWorkers: 2, // Limit workers in CI
    ...options,
  }),

  /**
   * Production environment (for smoke tests)
   */
  production: (options: TestConfigOptions = {}) => createTestConfig({
    testTimeout: 60000,
    coverage: false,
    silent: true,
    bail: 1,
    maxWorkers: 1,
    ...options,
  }),
};

/**
 * Database-specific test configuration
 */
export function createDatabaseTestConfig(options: TestConfigOptions = {}) {
  return createTestConfig({
    globalSetup: path.resolve(__dirname, './setup/database-setup.ts'),
    globalTeardown: path.resolve(__dirname, './setup/database-teardown.ts'),
    setupFiles: [
      path.resolve(__dirname, './setup/test-setup.ts'),
      path.resolve(__dirname, './setup/database-test-setup.ts'),
    ],
    testTimeout: 30000,
    isolate: false, // Share database connections
    maxWorkers: 1, // Sequential execution for database tests
    ...options,
  });
}

/**
 * API test configuration
 */
export function createApiTestConfig(options: TestConfigOptions = {}) {
  return createTestConfig({
    setupFiles: [
      path.resolve(__dirname, './setup/test-setup.ts'),
      path.resolve(__dirname, './setup/api-test-setup.ts'),
    ],
    testTimeout: 30000,
    environment: 'node',
    isolate: false,
    ...options,
  });
}

/**
 * Mock service configuration
 */
export function createMockServiceConfig(options: TestConfigOptions = {}) {
  return createTestConfig({
    setupFiles: [
      path.resolve(__dirname, './setup/test-setup.ts'),
      path.resolve(__dirname, './setup/mock-setup.ts'),
    ],
    testTimeout: 10000,
    environment: 'node',
    isolate: true,
    coverage: true,
    coverageThreshold: 95, // Higher threshold for mock tests
    ...options,
  });
}

/**
 * Load test configuration from environment
 */
export function loadTestConfigFromEnv(): TestConfigOptions {
  return {
    testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    coverage: process.env.TEST_COVERAGE !== 'false',
    coverageThreshold: parseInt(process.env.TEST_COVERAGE_THRESHOLD || '80'),
    maxWorkers: process.env.TEST_MAX_WORKERS ? parseInt(process.env.TEST_MAX_WORKERS) : undefined,
    silent: process.env.TEST_SILENT === 'true',
    verbose: process.env.TEST_VERBOSE === 'true',
    bail: parseInt(process.env.TEST_BAIL || '1'),
    environment: (process.env.TEST_ENVIRONMENT as any) || 'node',
  };
}

/**
 * Merge multiple configurations
 */
export function mergeTestConfigs(...configs: any[]): any {
  return configs.reduce((merged, config) => {
    return {
      ...merged,
      ...config,
      test: {
        ...merged.test,
        ...config.test,
        setupFiles: [
          ...(merged.test?.setupFiles || []),
          ...(config.test?.setupFiles || []),
        ],
        include: [
          ...(merged.test?.include || []),
          ...(config.test?.include || []),
        ],
        exclude: [
          ...(merged.test?.exclude || []),
          ...(config.test?.exclude || []),
        ],
      },
    };
  }, {});
}