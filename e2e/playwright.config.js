// @ts-check
// E2E tests run against the live site (frontend + backend).
// Start the app first: e.g. docker-compose up, or backend on :8000 + frontend on :5173.
// Seed credentials: set E2E_SEED_EMAIL/E2E_SEED_PASSWORD in .env (or run "npm install" so dotenv loads it).

const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch {
  // dotenv not installed or .env missing; login tests that need E2E_SEED_* will skip
}

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  timeout: 15000,
  expect: { timeout: 5000 },
});
