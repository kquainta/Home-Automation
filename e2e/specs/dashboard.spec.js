// @ts-check
// US-4: Access protected dashboard when authenticated

const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

test.describe('Dashboard (US-4)', () => {
  test('when not logged in, /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('when logged in, /dashboard loads and shows dashboard content', async ({ page, request }) => {
    const password = process.env.E2E_SEED_PASSWORD;
    if (!password) {
      test.skip(true, 'Set E2E_SEED_PASSWORD in .env to run this test');
      return;
    }
    await page.goto('/register');
    const hasForm = await page.getByRole('heading', { name: /create first administrator/i }).isVisible().catch(() => false);
    if (!hasForm) {
      test.skip(true, 'Need a user; registration not allowed');
      return;
    }
    await request.post('/api/v1/auth/dev/clear-users').catch(() => {});
    await page.goto('/register');
    await page.getByLabel(/user identifier|email|username/i).fill('e2e-dash@example.com');
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/recent activity/i)).toBeVisible();
    await expect(page.getByText(/quick actions/i)).toBeVisible();
  });

  test('when logged in, nav Dashboard link goes to dashboard', async ({ page, request }) => {
    const password = process.env.E2E_SEED_PASSWORD;
    if (!password) {
      test.skip(true, 'Set E2E_SEED_PASSWORD in .env to run this test');
      return;
    }
    await page.goto('/register');
    const hasForm = await page.getByRole('heading', { name: /create first administrator/i }).isVisible().catch(() => false);
    if (!hasForm) {
      test.skip(true, 'Need a user');
      return;
    }
    await request.post('/api/v1/auth/dev/clear-users').catch(() => {});
    await page.goto('/register');
    await page.getByLabel(/user identifier|email|username/i).fill('e2e-nav@example.com');
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/');
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
