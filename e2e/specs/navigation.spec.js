// @ts-check
// US-7: Navigation and routing

const { test, expect } = require('@playwright/test');

test.describe('Navigation (US-7)', () => {
  test('nav links go to correct routes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole('link', { name: /q-core/i }).first().click();
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown path redirects to home', async ({ page }) => {
    await page.goto('/unknown-page-404');
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });
});
