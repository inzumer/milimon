/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Reuses Astro's Vite config, so tsconfig `paths` aliases and the React plugin resolve the same way
// in tests as in the app. `.astro` files are covered by `astro check` and the build, not by Vitest.
export default getViteConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/index.ts', 'src/**/*.d.ts', 'src/env.d.ts'],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
