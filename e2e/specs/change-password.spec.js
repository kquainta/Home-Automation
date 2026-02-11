// @ts-check
// US-6: Change password (when user must_change_password or optional flow)

const { test, expect } = require('@playwright/test');

test.describe('Change password (US-6)', () => {
  test('when not logged in, /change-password redirects to login', async ({ page }) => {
    await page.goto('/change-password');
    await expect(page).toHaveURL(/\/login/);
  });

  test('when logged in without must_change_password, /change-password redirects to dashboard', async ({ page, request }) => {
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
    await page.getByLabel(/user identifier|email|username/i).fill('e2e-cp@example.com');
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /create administrator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/change-password');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
