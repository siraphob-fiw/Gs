import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@strengthos/shared-types': path.resolve(__dirname, '../shared-types/src/index.ts'),
      '@strengthos/shared-utils': path.resolve(__dirname, '../shared-utils/src/index.ts'),
    },
  },
});