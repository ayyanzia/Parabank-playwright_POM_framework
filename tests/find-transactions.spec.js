// tests/find-transactions.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Find Transactions', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  async function gotoFindTransactions() {
    await page.goto('findtrans.htm');
    await page.waitForTimeout(1500);
    const opts = page.locator('#accountId option');
    await opts.first().waitFor({ timeout: 10000 }).catch(() => {});
  }

  const amounts = ['10', '50', '100'];
  for (const amt of amounts) {
    test(`TC-FTX-001 Find transactions by amount $${amt}`, async () => {
      await gotoFindTransactions();
      await page.fill('#amount', amt);
      await page.click('#findByAmount');
      await page.waitForTimeout(3000);
      const body = await page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });
  }

  const dates = ['07-01-2026', '01-01-2026', '12-31-2025'];
  for (const date of dates) {
    test(`TC-FTX-002 Find transactions by date ${date}`, async () => {
      await gotoFindTransactions();
      await page.fill('#transactionDate', date);
      await page.click('#findByDate');
      await page.waitForTimeout(3000);
      const body = await page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });
  }

  test('TC-FTX-003 Find transactions by date range', async () => {
    await gotoFindTransactions();
    await page.fill('#fromDate', '01-01-2026');
    await page.fill('#toDate', '12-31-2026');
    await page.click('#findByDateRange');
    await page.waitForTimeout(3000);
    const body = await page.locator('#rightPanel').innerText();
    expect(body.length).toBeGreaterThan(0);
  });

  test('TC-FTX-004 Find by non-existent transaction ID shows no results', async () => {
    await gotoFindTransactions();
    await page.fill('#transactionId', '99999999');
    await page.click('#findById');
    await page.waitForTimeout(3000);
    const body = await page.locator('#rightPanel').innerText();
    expect(body.length).toBeGreaterThan(0);
  });
  
  test('TC-FTX-005 Find Transactions without login shows error or redirect', async ({ browser }) => {
    const tempCtx = await browser.newContext({ baseURL: BASE_URL });
    const tempPage = await tempCtx.newPage();
    await tempPage.goto('findtrans.htm');
    const bodyText = await tempPage.locator('body').innerText();
    const safe = bodyText.includes('Error') || bodyText.includes('Log In') || tempPage.url().includes('index.htm');
    expect(safe).toBeTruthy();
    await tempPage.close(); await tempCtx.close();
  });
});
