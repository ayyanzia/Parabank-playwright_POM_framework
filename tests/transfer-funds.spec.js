// tests/transfer-funds.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Transfer Funds', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  const transferAmounts = ['10', '50', '100'];

  for (const amt of transferAmounts) {
    test(`TC-TRF-001 Transfer $${amt} between accounts`, async () => {
      await page.goto('transfer.htm');
      await page.waitForTimeout(2000);
      // Removed skip guard. Test will correctly fail if account dropdown is empty
      await page.fill('#amount', amt);
      await page.click('input[value="Transfer"]');
      await page.waitForTimeout(3000);
      const body = await page.locator('body').innerText();
      const ok = body.includes('Transfer Complete') || body.includes('transferred');
      expect(ok).toBeTruthy();
    });
  }

  test('TC-TRF-002 Transfer page shows From and To dropdowns', async () => {
    await page.goto('transfer.htm');
    await page.waitForTimeout(2000);
    await expect(page.locator('#fromAccountId')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#toAccountId')).toBeVisible({ timeout: 10000 });
  });

  test('TC-TRF-003 Transfer with blank amount shows an error or no crash', async () => {
    await page.goto('transfer.htm');
    await page.waitForTimeout(2000);
    await page.fill('#amount', '');
    await page.click('input[value="Transfer"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const handled = !body.includes('500') && !body.includes('Internal Server');
    expect(handled).toBeTruthy();
  });

  test('TC-TRF-004 Transfer with zero amount handled', async () => {
    await page.goto('transfer.htm');
    await page.waitForTimeout(2000);
    await page.fill('#amount', '0');
    await page.click('input[value="Transfer"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const handled = !body.includes('500') && !body.includes('Internal Server');
    expect(handled).toBeTruthy();
  });
});
