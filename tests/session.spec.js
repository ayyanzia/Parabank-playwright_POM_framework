// tests/session.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, randomPersona, registerUser, loginUser } = require('./helpers/shared');



test.describe('Module: Session Management', () => {
  let page;
  let user;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    user = randomPersona();
    await registerUser(page, user);
  });

  test.afterAll(async () => { await page.close(); });

  test('TC-SES-001 Session persists across page navigation to overview', async () => {
    await loginUser(page, user.username, user.password);
    await page.goto('overview.htm');
    await expect(page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
  });

  test('TC-SES-002 Session persists across page navigation to bill pay', async () => {
    await page.goto('billpay.htm');
    await expect(page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
  });

  test('TC-SES-003 After logout, protected pages are inaccessible', async () => {
    const logoutLink = page.locator('#leftPanel a', { hasText: 'Log Out' });
    await logoutLink.click();
    await page.waitForTimeout(2000);
    await page.goto('overview.htm');
    const body = await page.locator('body').innerText();
    const blocked = body.includes('Log In') || body.includes('Error') || page.url().includes('index.htm');
    expect(blocked).toBeTruthy();
  });

  test('TC-SES-004 Login form shown when unauthenticated', async () => {
    await page.goto('index.htm');
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[value="Log In"]')).toBeVisible({ timeout: 10000 });
  });
});
