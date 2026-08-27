import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ai': path.resolve(__dirname, 'src/ai'),
      '@backend': path.resolve(__dirname, 'src/backend'),
      '@db': path.resolve(__dirname, 'src/database'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    // Every suite resets the shared test database, so suites must not overlap.
    fileParallelism: false,
  },
});
