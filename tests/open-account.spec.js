// tests/open-account.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Open New Account', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  for (let i = 1; i <= 2; i++) {
    test(`TC-OAC-001 Run ${i}: Open a new Checking account`, async () => {
      await page.goto('openaccount.htm');
      await page.waitForTimeout(2000);
      const typeSelect = page.locator('#type');
      await typeSelect.selectOption('0'); // CHECKING
      await page.waitForTimeout(1000);
      await page.click('input[value="Open New Account"]');
      await page.waitForTimeout(3000);
      const body = await page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
      expect(body).toContain('Account Opened');
    });
  }

  for (let i = 1; i <= 2; i++) {
    test(`TC-OAC-002 Run ${i}: Open a new Savings account`, async () => {
      await page.goto('openaccount.htm');
      await page.waitForTimeout(2000);
      const typeSelect = page.locator('#type');
      await typeSelect.selectOption('1'); // SAVINGS
      await page.waitForTimeout(1000);
      await page.click('input[value="Open New Account"]');
      await page.waitForTimeout(3000);
      const body = await page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
      expect(body).toContain('Account Opened');
    });
  }

  test('TC-OAC-003 Open Account page accessible via nav link', async () => {
    const navLink = page.locator('#leftPanel a', { hasText: 'Open New Account' });
    await navLink.click();
    await page.waitForTimeout(2000);
    const body = await page.locator('#rightPanel').innerText();
    expect(body.length).toBeGreaterThan(0);
  });
});
