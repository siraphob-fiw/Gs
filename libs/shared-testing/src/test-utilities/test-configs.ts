/**
 * Test configuration presets for different scenarios
 * Provides predefined configurations for common testing scenarios
 */

import { TestExecutionOptions, TestCategory } from './test-execution';

/**
 * Predefined test execution configurations
 */
export const testConfigurations = {
  /**
   * Development configuration - fast feedback
   */
  development: {
    options: {
      watch: true,
      verbose: false,
      bail: true,
      maxWorkers: 4,
      timeout: 30000,
      reporter: 'default',
    } as TestExecutionOptions,
    categories: ['unit', 'smoke'],
    description: 'Fast tests for development feedback',
  },

  /**
   * CI/CD configuration - comprehensive testing
   */
  ci: {
    options: {
      coverage: true,
      verbose: true,
      bail: false,
      maxWorkers: 2,
      timeout: 120000,
      reporter: 'junit',
      outputFile: 'test-results.xml',
    } as TestExecutionOptions,
    categories: ['unit', 'integration', 'e2e'],
    description: 'Comprehensive testing for CI/CD pipelines',
  },

  /**
   * Pre-commit configuration - essential tests
   */
  preCommit: {
    options: {
      bail: true,
      maxWorkers: 4,
      timeout: 60000,
      reporter: 'default',
      silent: false,
    } as TestExecutionOptions,
    categories: ['unit', 'smoke'],
    description: 'Essential tests for pre-commit hooks',
  },

  /**
   * Performance testing configuration
   */
  performance: {
    options: {
      bail: false,
      maxWorkers: 1,
      timeout: 300000,
      reporter: 'verbose',
      verbose: true,
    } as TestExecutionOptions,
    categories: ['performance'],
    description: 'Performance and load testing',
  },

  /**
   * Smoke testing configuration
   */
  smoke: {
    options: {
      bail: true,
      maxWorkers: 4,
      timeout: 60000,
      reporter: 'default',
    } as TestExecutionOptions,
    categories: ['smoke'],
    description: 'Quick smoke tests for critical functionality',
  },

  /**
   * Full regression testing
   */
  regression: {
    options: {
      coverage: true,
      bail: false,
      maxWorkers: 2,
      timeout: 180000,
      reporter: 'html',
      outputFile: 'regression-report.html',
    } as TestExecutionOptions,
    categories: ['unit', 'integration', 'e2e', 'performance'],
    description: 'Full regression test suite',
  },

  /**
   * Debug configuration
   */
  debug: {
    options: {
      debug: true,
      verbose: true,
      bail: true,
      maxWorkers: 1,
      timeout: 0, // No timeout for debugging
      reporter: 'verbose',
    } as TestExecutionOptions,
    categories: ['unit'],
    description: 'Debug configuration for troubleshooting',
  },

  /**
   * Quick validation configuration
   */
  quick: {
    options: {
      bail: true,
      maxWorkers: 8,
      timeout: 15000,
      reporter: 'default',
      silent: false,
    } as TestExecutionOptions,
    tags: ['fast'],
    description: 'Quick validation tests',
  },

  /**
   * API testing configuration
   */
  api: {
    options: {
      bail: false,
      maxWorkers: 2,
      timeout: 60000,
      reporter: 'verbose',
    } as TestExecutionOptions,
    categories: ['api'],
    description: 'API endpoint testing',
  },

  /**
   * Frontend testing configuration
   */
  frontend: {
    options: {
      bail: false,
      maxWorkers: 4,
      timeout: 45000,
      reporter: 'default',
    } as TestExecutionOptions,
    categories: ['component', 'unit'],
    tags: ['frontend', 'react'],
    description: 'Frontend component and unit testing',
  },
};

/**
 * Environment-specific configurations
 */
export const environmentConfigurations = {
  local: {
    ...testConfigurations.development,
    description: 'Local development environment',
  },

  docker: {
    options: {
      ...testConfigurations.ci.options,
      maxWorkers: 1, // Limited resources in containers
      timeout: 180000, // Longer timeout for slower containers
    },
    categories: testConfigurations.ci.categories,
    description: 'Docker container environment',
  },

  github: {
    options: {
      ...testConfigurations.ci.options,
      reporter: 'github-actions',
    },
    categories: testConfigurations.ci.categories,
    description: 'GitHub Actions environment',
  },

  jenkins: {
    options: {
      ...testConfigurations.ci.options,
      reporter: 'junit',
      outputFile: 'junit.xml',
    },
    categories: testConfigurations.ci.categories,
    description: 'Jenkins CI environment',
  },
};

/**
 * Application-specific test categories
 */
export const applicationCategories = {
  'sos-web-api': [
    {
      name: 'unit',
      pattern: 'src/unit/**/*.{test,spec}.ts',
      description: 'Unit tests for API services and utilities',
      timeout: 30000,
      parallel: true,
      tags: ['fast', 'isolated', 'backend'],
      environment: 'node',
      framework: 'jest',
    },
    {
      name: 'integration',
      pattern: 'src/integration/**/*.{test,spec}.ts',
      description: 'Integration tests for API modules',
      timeout: 60000,
      parallel: false,
      tags: ['medium', 'services', 'backend'],
      dependencies: ['unit'],
      environment: 'node',
      framework: 'jest',
    },
    {
      name: 'e2e',
      pattern: 'src/e2e/**/*.{test,spec}.ts',
      description: 'End-to-end API workflow tests',
      timeout: 120000,
      parallel: false,
      tags: ['slow', 'workflows', 'backend'],
      dependencies: ['unit', 'integration'],
      environment: 'node',
      framework: 'jest',
    },
    {
      name: 'api',
      pattern: 'src/**/*.api.{test,spec}.ts',
      description: 'API endpoint tests',
      timeout: 60000,
      parallel: false,
      tags: ['backend', 'api', 'endpoints'],
      environment: 'node',
      framework: 'jest',
    },
  ] as TestCategory[],

  'sos-web-training': [
    {
      name: 'unit',
      pattern: 'src/unit/**/*.{test,spec}.{ts,tsx}',
      description: 'Unit tests for utilities and hooks',
      timeout: 30000,
      parallel: true,
      tags: ['fast', 'isolated', 'frontend'],
      environment: 'jsdom',
      framework: 'jest',
    },
    {
      name: 'component',
      pattern: 'src/**/*.component.{test,spec}.tsx',
      description: 'React component tests',
      timeout: 45000,
      parallel: true,
      tags: ['frontend', 'react', 'components'],
      environment: 'jsdom',
      framework: 'jest',
    },
    {
      name: 'integration',
      pattern: 'src/integration/**/*.{test,spec}.{ts,tsx}',
      description: 'Integration tests for pages and features',
      timeout: 60000,
      parallel: false,
      tags: ['medium', 'frontend', 'pages'],
      dependencies: ['unit', 'component'],
      environment: 'jsdom',
      framework: 'jest',
    },
    {
      name: 'e2e',
      pattern: 'src/e2e/**/*.{test,spec}.ts',
      description: 'End-to-end user workflow tests',
      timeout: 120000,
      parallel: false,
      tags: ['slow', 'workflows', 'frontend'],
      dependencies: ['unit', 'component', 'integration'],
      environment: 'browser',
      framework: 'playwright',
    },
  ] as TestCategory[],
};

/**
 * Tag-based test groupings
 */
export const tagGroups = {
  speed: {
    fast: ['unit', 'smoke'],
    medium: ['integration', 'component', 'api'],
    slow: ['e2e', 'performance'],
  },
  
  scope: {
    isolated: ['unit'],
    services: ['integration', 'api'],
    workflows: ['e2e'],
  },
  
  technology: {
    backend: ['unit', 'integration', 'api'],
    frontend: ['component', 'unit'],
    fullstack: ['e2e'],
  },
  
  criticality: {
    critical: ['smoke', 'unit'],
    important: ['integration', 'api'],
    optional: ['performance'],
  },
};

/**
 * Performance thresholds for different test categories
 */
export const performanceThresholds = {
  unit: {
    maxDuration: 30000, // 30 seconds
    maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
    maxTestDuration: 1000, // 1 second per test
  },
  
  integration: {
    maxDuration: 120000, // 2 minutes
    maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
    maxTestDuration: 5000, // 5 seconds per test
  },
  
  e2e: {
    maxDuration: 600000, // 10 minutes
    maxMemoryIncrease: 200 * 1024 * 1024, // 200MB
    maxTestDuration: 30000, // 30 seconds per test
  },
  
  component: {
    maxDuration: 60000, // 1 minute
    maxMemoryIncrease: 75 * 1024 * 1024, // 75MB
    maxTestDuration: 2000, // 2 seconds per test
  },
  
  performance: {
    maxDuration: 1800000, // 30 minutes
    maxMemoryIncrease: 500 * 1024 * 1024, // 500MB
    maxTestDuration: 60000, // 1 minute per test
  },
};

/**
 * Get configuration by name
 */
export function getTestConfiguration(name: string) {
  return testConfigurations[name as keyof typeof testConfigurations];
}

/**
 * Get environment configuration by name
 */
export function getEnvironmentConfiguration(name: string) {
  return environmentConfigurations[name as keyof typeof environmentConfigurations];
}

/**
 * Get application categories by name
 */
export function getApplicationCategories(name: string): TestCategory[] {
  return applicationCategories[name as keyof typeof applicationCategories] || [];
}

/**
 * Get categories by tag group
 */
export function getCategoriesByTagGroup(group: string, subgroup: string): string[] {
  const tagGroupData = tagGroups[group as keyof typeof tagGroups];
  if (!tagGroupData) return [];
  
  return tagGroupData[subgroup as keyof typeof tagGroupData] || [];
}

/**
 * Get performance threshold for category
 */
export function getPerformanceThreshold(category: string) {
  return performanceThresholds[category as keyof typeof performanceThresholds];
}

/**
 * Create configuration for specific scenario
 */
export function createScenarioConfiguration(
  scenario: 'development' | 'ci' | 'preCommit' | 'performance' | 'smoke' | 'regression' | 'debug' | 'quick',
  overrides: Partial<TestExecutionOptions> = {}
) {
  const baseConfig = testConfigurations[scenario];
  if (!baseConfig) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  return {
    ...baseConfig,
    options: {
      ...baseConfig.options,
      ...overrides,
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfiguration(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.options) {
    errors.push('Configuration must have options');
  }

  if (!config.categories && !config.tags) {
    errors.push('Configuration must specify either categories or tags');
  }

  if (config.options?.timeout && config.options.timeout < 0) {
    errors.push('Timeout must be positive');
  }

  if (config.options?.maxWorkers && config.options.maxWorkers < 1) {
    errors.push('Max workers must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get recommended configuration for current environment
 */
export function getRecommendedConfiguration(): string {
  const env = process.env.NODE_ENV;
  const ci = process.env.CI;
  const github = process.env.GITHUB_ACTIONS;
  const jenkins = process.env.JENKINS_URL;

  if (ci) {
    if (github) return 'github';
    if (jenkins) return 'jenkins';
    return 'ci';
  }

  if (env === 'development') {
    return 'development';
  }

  return 'local';
}