// @ts-check
// US-3: Log in with existing account

const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

test.describe('Login (US-3)', () => {
  test('login page loads at /login and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('wrong credentials show error and stay on login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).first().fill('wrongpass');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByRole('alert')).toContainText(/invalid|failed|incorrect/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('correct credentials log in and redirect to dashboard', async ({ page, request }) => {
    const email = process.env.E2E_SEED_EMAIL;
    const password = process.env.E2E_SEED_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set E2E_SEED_EMAIL and E2E_SEED_PASSWORD in .env to run this test');
      return;
    }
    await request.post('/api/v1/auth/dev/seed-e2e-user').catch(() => {});
    await login(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });
});
