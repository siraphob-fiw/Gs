const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../../apps/sos-web-training',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'sos-web-training-tests',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test-setup.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@strengthos/sos-web-training/(.*)$': '<rootDir>/../../apps/sos-web-training/src/$1',
    '^@strengthos/shared-testing/(.*)$': '<rootDir>/../../libs/shared-testing/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  maxWorkers: '50%',
  // Optimized for separated test application architecture
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  // Improved performance settings
  clearMocks: true,
  restoreMocks: true
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)