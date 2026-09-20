// tests/navigation.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Navigation', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  const linksToTest = [
    'Open New Account', 'Accounts Overview', 'Transfer Funds', 
    'Bill Pay', 'Find Transactions', 'Update Contact Info', 'Request Loan'
  ];

  for (const link of linksToTest) {
    test(`TC-NAV-001 Navigation check for ${link}`, async () => {
      await page.locator('#leftPanel a', { hasText: link }).click();
      await page.waitForTimeout(1000);
      await expect(page.locator('#rightPanel')).toBeVisible({ timeout: 10000 });
    });
  }

  test('TC-NAV-002 All expected nav links are present after login', async () => {
    const leftPanel = page.locator('#leftPanel');
    for (const txt of linksToTest) {
      expect(await leftPanel.getByRole('link', { name: txt }).count()).toBeGreaterThan(0);
    }
  });

  test('TC-NAV-003 Home page shows login form without authentication', async ({ browser }) => {
    const tempCtx = await browser.newContext({ baseURL: BASE_URL });
    const tempPage = await tempCtx.newPage();
    await tempPage.goto('index.htm');
    await expect(tempPage.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    await tempPage.close(); await tempCtx.close();
  });

  test('TC-NAV-004 Log Out link is visible after login', async () => {
    await expect(page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
  });

  test('TC-NAV-005 Direct URL to protected page without login redirects', async ({ browser }) => {
    const tempCtx = await browser.newContext({ baseURL: BASE_URL });
    const tempPage = await tempCtx.newPage();
    await tempPage.goto('overview.htm');
    const bodyText = await tempPage.locator('body').innerText();
    const safe = bodyText.includes('Log In') || bodyText.includes('Error') || tempPage.url().includes('index.htm');
    expect(safe).toBeTruthy();
    await tempPage.close(); await tempCtx.close();
  });
  
  test('TC-NAV-006 Verify main logo exists', async () => {
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
  });
});
