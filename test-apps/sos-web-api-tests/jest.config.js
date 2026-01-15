module.exports = {
  displayName: 'sos-web-api-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/test-setup.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@strengthos/sos-web-api/(.*)$': '<rootDir>/../../apps/sos-web-api/$1',
    '^@strengthos/shared-testing/(.*)$': '<rootDir>/../../libs/shared-testing/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  maxWorkers: '50%',
  // Optimized for separated test application architecture
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  // Improved performance settings
  clearMocks: true,
  restoreMocks: true,
  // Separate test categories with optimized configurations
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/unit/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
      moduleNameMapper: {
        '^@strengthos/sos-web-api/(.*)$': '<rootDir>/../../apps/sos-web-api/$1',
        '^@strengthos/shared-testing/(.*)$': '<rootDir>/../../libs/shared-testing/$1',
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest', 
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/integration/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
      moduleNameMapper: {
        '^@strengthos/sos-web-api/(.*)$': '<rootDir>/../../apps/sos-web-api/$1',
        '^@strengthos/shared-testing/(.*)$': '<rootDir>/../../libs/shared-testing/$1',
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/e2e/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
      moduleNameMapper: {
        '^@strengthos/sos-web-api/(.*)$': '<rootDir>/../../apps/sos-web-api/$1',
        '^@strengthos/shared-testing/(.*)$': '<rootDir>/../../libs/shared-testing/$1',
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    }
  ]
};