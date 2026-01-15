import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test discovery
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],

    // Environment
    environment: 'node',
    globals: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Setup
    setupFiles: [
      './src/test-utilities/setup/test-setup.ts',
    ],

    // Coverage disabled for now due to version conflicts
    coverage: {
      enabled: false,
    },

    // TypeScript
    typecheck: {
      enabled: true,
    },
  },

  // Resolve
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@test': path.resolve(__dirname, 'src/__tests__'),
    },
  },
});