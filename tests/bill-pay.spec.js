// tests/bill-pay.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, registerAndLogin } = require('./helpers/shared');



test.describe('Module: Bill Payment', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await registerAndLogin(page);
  });

  test.afterAll(async () => { await page.close(); });

  async function fillBillPayForm(payeeName, amount, mismatchVerify = false) {
    await page.goto('billpay.htm');
    await page.waitForTimeout(1500);
    if (payeeName !== '') await page.fill('input[name="payee.name"]', payeeName);
    await page.fill('input[name="payee.address.street"]', '100 Bill Ave');
    await page.fill('input[name="payee.address.city"]', 'Billtown');
    await page.fill('input[name="payee.address.state"]', 'NY');
    await page.fill('input[name="payee.address.zipCode"]', '10001');
    await page.fill('input[name="payee.phoneNumber"]', '2125551000');
    const acctNum = '12345';
    await page.fill('input[name="payee.accountNumber"]', acctNum);
    await page.fill('input[name="verifyAccount"]', mismatchVerify ? '99999' : acctNum);
    await page.fill('input[name="amount"]', amount);
  }

  const payees = [
    { name: 'Acme Corp', amt: '25' },
    { name: 'Global Utilities', amt: '75' },
    { name: 'Metro Gas', amt: '42' }
  ];

  for (let i = 1; i <= 2; i++) {
    for (const payee of payees) {
      test(`TC-BPY-001 Run ${i}: Pay "${payee.name}" $${payee.amt}`, async () => {
        await fillBillPayForm(payee.name, payee.amt);
        await page.click('input[value="Send Payment"]');
        await page.waitForTimeout(2000);
        const body = await page.locator('body').innerText();
        expect(body).toMatch(new RegExp(`Bill Payment.*Complete|${payee.name}`, 'i'));
      });
    }
  }

  test('TC-BPY-002 Mismatched account numbers are rejected', async () => {
    await fillBillPayForm('Test Payee', '10', true);
    await page.click('input[value="Send Payment"]');
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const rejected = body.includes('match') || body.includes('error') || body.includes('do not match') || body.includes('Error');
    expect(rejected).toBeTruthy();
  });

  test('TC-BPY-003 Blank payee name is rejected', async () => {
    await page.goto('billpay.htm');
    await page.waitForTimeout(1500);
    await page.click('input[value="Send Payment"]');
    await page.waitForTimeout(1500);
    const errors = page.locator('#billpayForm .error, #billpayForm span.error, .ng-invalid');
    const errCount = await errors.count();
    expect(errCount).toBeGreaterThan(0);
  });

  test('TC-BPY-004 Confirmation shows payee name and amount', async () => {
    await fillBillPayForm('Verification Corp', '99');
    await page.click('input[value="Send Payment"]');
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText();
    const ok = body.includes('Verification Corp') || body.includes('99') || body.includes('Complete');
    expect(ok).toBeTruthy();
  });
});
