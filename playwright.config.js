// playwright.config.js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // Only run the single-session regression suite; ignore modular specs and helpers
  testMatch: ['**/regression.spec.js'],
  testIgnore: ['**/helpers/**'],
  timeout: 60 * 1000,          // 60s per test
  expect: { timeout: 20 * 1000 }, // 20s max for assertions (as requested)
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
  ],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: process.env.PARABANK_BASE_URL || 'https://parabank.parasoft.com/parabank/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20 * 1000,      // 20s max for all actions (as requested)
    navigationTimeout: 20 * 1000,  // 20s max for navigation (as requested)
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});