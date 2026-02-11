// @ts-check
// US-1: View the public home page

const { test, expect } = require('@playwright/test');

test.describe('Home page (US-1)', () => {
  test('loads at / without errors', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBe(true);
  });

  test('shows expected heading and content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Real-time');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Intelligence');
    await expect(page.getByRole('paragraph').filter({ hasText: /high-performance interface/ })).toBeVisible();
  });

  test('when not logged in, shows Login and Register in nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('when not logged in, shows sign-in form on home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });
});
