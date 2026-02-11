// @ts-check
// US-5: Log out

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../fixtures/auth');

test.describe('Logout (US-5)', () => {
  test('when logged in, Logout is visible', async ({ page, request }) => {
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
    await page.getByLabel(/user identifier|email|username/i).fill('e2e-out@example.com');
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('after logout, public nav is shown and /dashboard redirects to login', async ({ page, request }) => {
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
    await page.getByLabel(/user identifier|email|username/i).fill('e2e-out2@example.com');
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await logout(page);
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
