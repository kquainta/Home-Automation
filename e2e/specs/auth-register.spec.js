// @ts-check
// US-2: Register a new account (when registration is allowed – first admin)

const { test, expect } = require('@playwright/test');
const { register, clearUsers } = require('../fixtures/auth');

test.describe('Register (US-2)', () => {
  test('register page loads; shows either form or disabled message', async ({ page }) => {
    await page.goto('/register');
    const hasForm = await page.getByRole('heading', { name: /create first administrator/i }).isVisible().catch(() => false);
    const hasDisabled = await page.getByRole('heading', { name: /registration disabled/i }).isVisible().catch(() => false);
    expect(hasForm || hasDisabled).toBe(true);
  });

  test('when registration allowed, valid submit creates account and redirects to dashboard', async ({ page, request }) => {
    await page.goto('/register');
    const hasForm = await page.getByRole('heading', { name: /create first administrator/i }).isVisible().catch(() => false);
    if (!hasForm) {
      test.skip(true, 'Registration not allowed (not first admin)');
      return;
    }
    const password = process.env.E2E_SEED_PASSWORD;
    if (!password) {
      test.skip(true, 'Set E2E_SEED_PASSWORD in .env to run this test');
      return;
    }
    await clearUsers(request);
    await page.goto('/register');
    const email = `e2e-reg-${Date.now()}@example.com`;
    await register(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/recent activity|quick actions|dashboard/i)).toBeVisible();
  });

  test('when registration allowed, duplicate email shows error', async ({ page, request }) => {
    await page.goto('/register');
    const hasForm = await page.getByRole('heading', { name: /create first administrator/i }).isVisible().catch(() => false);
    if (!hasForm) {
      test.skip(true, 'Registration not allowed');
      return;
    }
    const password = process.env.E2E_SEED_PASSWORD;
    if (!password) {
      test.skip(true, 'Set E2E_SEED_PASSWORD in .env to run this test');
      return;
    }
    await clearUsers(request);
    await page.goto('/register');
    const email = 'e2e-dup@example.com';
    await register(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('button', { name: /logout/i }).click();
    await page.goto('/register');
    await page.getByLabel(/user identifier|email|username/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page.getByRole('alert')).toContainText(/already|exist|taken|failed/i);
  });
});
