// tests/accounts-overview.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Accounts Overview', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  for (let i = 1; i <= 2; i++) {
    test(`TC-AOV-001 Run ${i}: Accounts overview table is visible after login`, async () => {
      await page.goto('overview.htm');
      await expect(page.locator('#accountTable')).toBeVisible({ timeout: 15000 });
    });
  }

  test('TC-AOV-002 At least one account row is present', async () => {
    const rows = page.locator('#accountTable tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TC-AOV-003 Click account number shows activity', async () => {
    const accountLinks = page.locator('#accountTable a');
    const count = await accountLinks.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await accountLinks.first().click();
      await page.waitForTimeout(2000);
      const heading = await page.locator('#rightPanel h1').innerText();
      expect(heading).toContain('Account Details');
    }
  });

  test('TC-AOV-004 Total balance cell shows a dollar amount', async () => {
    const totalCell = page.locator('#accountTable tfoot td').nth(1);
    const text = await totalCell.textContent({ timeout: 10000 });
    expect(text).toMatch(/\$[\d,]+\.\d{2}/);
  });
});
