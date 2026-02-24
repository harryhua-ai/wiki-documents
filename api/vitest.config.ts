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
    // 全局测试设置文件
    setupFiles: ['./test/setup.ts'],
    globals: true, // 启用全局测试函数 (beforeEach, afterEach, describe, it, etc.)
    env: {
      NODE_ENV: 'test',
      EMBEDDING_API_KEY: 'test-key',
      ZHIPU_API_KEY: 'test-zhipu-key',
      SILICONFLOW_API_KEY: 'test-siliconflow-key',
      DEEPSEEK_API_KEY: 'test-deepseek-key',
      QWEN_API_KEY: 'test-qwen-key',
    },
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
        '**/test/**', // 排除测试辅助文件
      ],
    },
  },
});
