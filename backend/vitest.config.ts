import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    // Integration tests start a MongoDB container, which takes a while the first time.
    hookTimeout: 120_000,
  },
});
