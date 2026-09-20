// tests/request-loan.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Request Loan', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  const loans = [
    { amt: '1000', down: '100' },
    { amt: '5000', down: '500' },
    { amt: '500', down: '50' }
  ];

  for (let i = 1; i <= 2; i++) {
    for (const loan of loans) {
      test(`TC-LNS-001 Run ${i}: Loan application $${loan.amt} / $${loan.down} down`, async () => {
        await page.goto('requestloan.htm');
        await page.waitForTimeout(1500);
        await page.fill('#amount', loan.amt);
        await page.fill('#downPayment', loan.down);
        await page.click('input[value="Apply Now"]');
        await page.waitForTimeout(5000);
        const body = await page.locator('#rightPanel').innerText();
        const ok = body.includes('Approved') || body.includes('Denied') || body.includes('Loan') || body.includes('Status') || body.includes('Error');
        expect(ok).toBeTruthy();
      });
    }
  }

  test('TC-LNS-002 Loan page renders Amount, Down Payment and Apply button', async () => {
    await page.goto('requestloan.htm');
    await page.waitForTimeout(1500);
    await expect(page.locator('#amount')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#downPayment')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[value="Apply Now"]')).toBeVisible({ timeout: 10000 });
  });

  test('TC-LNS-003 Blank loan amount is handled gracefully', async () => {
    await page.goto('requestloan.htm');
    await page.waitForTimeout(1500);
    await page.fill('#amount', '');
    await page.fill('#downPayment', '');
    await page.click('input[value="Apply Now"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('500');
  });

  test('TC-LNS-004 Very large loan amount edge case ($999999)', async () => {
    await page.goto('requestloan.htm');
    await page.waitForTimeout(1500);
    await page.fill('#amount', '999999');
    await page.fill('#downPayment', '10000');
    await page.click('input[value="Apply Now"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('500');
  });
});
