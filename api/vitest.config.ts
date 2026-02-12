import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html'],
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
      exclude: [
        '**/*.test.ts',
        '**/*.config.ts',
        '**/dist/**',
        '**/node_modules/**',
        '**/coverage/**',
      ],
    },
  },
});
