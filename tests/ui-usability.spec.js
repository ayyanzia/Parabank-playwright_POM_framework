// tests/ui-usability.spec.js — 7 tests, single shared page session (no auth)
const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('./helpers/shared');



test.describe('Module: UI & Usability', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
  });

  test.afterAll(async () => { await page.close(); });

  test('TC-UIU-001 Home page has correct browser title', async () => {
    await page.goto('index.htm');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('parabank');
  });

  test('TC-UIU-002 Registration page renders all 11 required form fields', async () => {
    await page.goto('register.htm');
    const fields = [
      'input[name="customer.firstName"]', 'input[name="customer.lastName"]',
      'input[name="customer.address.street"]', 'input[name="customer.address.city"]',
      'input[name="customer.address.state"]', 'input[name="customer.address.zipCode"]',
      'input[name="customer.phoneNumber"]', 'input[name="customer.ssn"]',
      'input[name="customer.username"]', 'input[name="customer.password"]',
      '#repeatedPassword',
    ];
    for (const sel of fields) {
      await expect(page.locator(sel)).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-UIU-003 Login page renders username, password and submit button', async () => {
    await page.goto('index.htm');
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[value="Log In"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-UIU-004 Forgot login info link is present', async () => {
    await page.goto('index.htm');
    const link = page.getByRole('link', { name: 'Forgot login info?' });
    await expect(link).toBeVisible({ timeout: 5000 });
  });

  test('TC-UIU-005 Register link is visible on home page', async () => {
    await page.goto('index.htm');
    const link = page.getByRole('link', { name: 'Register' });
    await expect(link).toBeVisible({ timeout: 5000 });
  });

  test('TC-UIU-006 Register link leads to registration form', async () => {
    await page.goto('index.htm');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page.locator('#rightPanel h1.title')).toContainText('Signing up', { timeout: 10000 });
  });

  test('TC-UIU-007 No horizontal overflow at 1280px viewport', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('index.htm');
    const scrollW = await page.evaluate(() => document.body.scrollWidth);
    const clientW = await page.evaluate(() => document.body.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 20);
  });
});
