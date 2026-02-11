/**
 * E2E helpers for auth flows. Use these in specs to keep tests readable and aligned with user stories.
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

/**
 * Log in via the Login page. Assumes we are not already logged in.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel(/username/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}

/**
 * Log in via the Home page sign-in form (when not logged in).
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function loginFromHome(page, email, password) {
  await page.goto('/');
  await page.getByLabel(/username/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}

/**
 * Register (only works when registration is allowed, e.g. first admin).
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function register(page, email, password) {
  await page.goto('/register');
  await page.getByLabel(/user identifier|email|username/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /create administrator/i }).click();
}

/**
 * Clear all users via dev endpoint. Use before "first admin" register test when backend allows it.
 * @param {import('@playwright/test').APIRequestContext} request - request fixture (same origin as baseURL so /api is proxied to backend)
 */
async function clearUsers(request) {
  try {
    await request.post(`${baseURL}/api/v1/auth/dev/clear-users`);
  } catch (_) {
    // Dev endpoint may be disabled; test may skip or handle
  }
}

/**
 * Log out via the Layout nav (click Logout).
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
  await page.getByRole('button', { name: /logout/i }).click();
}

module.exports = { login, loginFromHome, register, clearUsers, logout };
