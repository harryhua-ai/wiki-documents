import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * CamThink Wiki E2E 测试配置
 * 用于测试 Ask AI 聊天组件的端到端功能
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/api/**', '**/node_modules/**'],

  /* 测试输出目录 */
  outputDir: '.reports/testing-verification/e2e/test-results',

  /* 全局测试超时 */
  timeout: 60000,

  /* 期望断言超时 */
  expect: {
    timeout: 10000,
  },

  /* 完全并行运行测试文件 */
  fullyParallel: true,

  /* CI 环境下禁止 test.only */
  forbidOnly: !!process.env.CI,

  /* 启用测试重试（本地1次，CI环境2次） */
  retries: process.env.CI ? 2 : 1,

  /* 并行 workers（CI环境1个，本地4个） */
  workers: process.env.CI ? 1 : 4,

  /* 测试报告配置 */
  reporter: [
    ['html', { outputFolder: '.reports/testing-verification/e2e/playwright-report', open: 'never' }],
    ['list'],
  ],

  /* 全局测试配置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://localhost:3000',

    /* 失败重试时记录 trace */
    trace: 'on-first-retry',

    /* 失败时截图 */
    screenshot: 'only-on-failure',

    /* 失败时录制视频 */
    video: 'retain-on-failure',

    /* 测试超时时间（毫秒） - 已优化 */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  /* 测试项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 启动开发服务器 */
  webServer: {
    command: 'yarn start --host 0.0.0.0 --no-open',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
