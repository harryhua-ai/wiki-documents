import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.docusaurus',
      'api',
      'monitoring',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/test/**',
      ],
    },
    ui: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './src/test'),
      // Docusaurus module aliases
      '@docusaurus/Translate': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/Link': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/ExecutionEnvironment': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/theme-common': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/useGlobals': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/useBaseUrl': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
    },
  },
});
