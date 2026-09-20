// tests/security.spec.js — 7 tests, single shared page session (no auth required)
// Consolidates security checks + unauthenticated access tests
const { test, expect } = require('@playwright/test');
const { BASE_URL } = require('./helpers/shared');



test.describe('Module: Security & Input Validation', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
  });

  test.afterAll(async () => { await page.close(); });

  test('TC-SEC-001 SQL injection in login username does not crash server', async () => {
    await page.goto('index.htm');
    await page.fill('input[name="username"]', "' OR '1'='1");
    await page.fill('input[name="password"]', "' OR '1'='1");
    await page.click('input[value="Log In"]');
    const body = await page.locator('body').innerText();
    const noAccess = !body.includes('Accounts Overview') || body.includes('Error');
    expect(noAccess).toBeTruthy();
  });

  test('TC-SEC-002 XSS script tag in first name is not executed', async () => {
    await page.goto('register.htm');
    let alertTriggered = false;
    page.on('dialog', async (dialog) => { alertTriggered = true; await dialog.dismiss(); });
    await page.fill('input[name="customer.firstName"]', '<script>alert("xss")</script>');
    await page.fill('input[name="customer.lastName"]', 'Test');
    await page.fill('input[name="customer.address.street"]', '100 Test St');
    await page.fill('input[name="customer.address.city"]', 'Testcity');
    await page.fill('input[name="customer.address.state"]', 'TX');
    await page.fill('input[name="customer.address.zipCode"]', '75001');
    await page.fill('input[name="customer.phoneNumber"]', '2145559999');
    await page.fill('input[name="customer.ssn"]', '123-45-6789');
    await page.fill('input[name="customer.username"]', `sec_xss_${Date.now()}`);
    await page.fill('input[name="customer.password"]', 'SecTest@123');
    await page.fill('#repeatedPassword', 'SecTest@123');
    await page.click('input[value="Register"]');
    await page.waitForTimeout(3000);
    expect(alertTriggered).toBeFalsy();
  });

  test('TC-SEC-003 Very long username (255 chars) does not crash', async () => {
    await page.goto('register.htm');
    await page.fill('input[name="customer.firstName"]', 'Test');
    await page.fill('input[name="customer.lastName"]', 'Long');
    await page.fill('input[name="customer.address.street"]', '100 Test St');
    await page.fill('input[name="customer.address.city"]', 'Testcity');
    await page.fill('input[name="customer.address.state"]', 'TX');
    await page.fill('input[name="customer.address.zipCode"]', '75001');
    await page.fill('input[name="customer.phoneNumber"]', '2145550000');
    await page.fill('input[name="customer.ssn"]', '987-65-4321');
    await page.fill('input[name="customer.username"]', 'a'.repeat(255));
    await page.fill('input[name="customer.password"]', 'LongTest@123');
    await page.fill('#repeatedPassword', 'LongTest@123');
    await page.click('input[value="Register"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('500');
  });

  test('TC-SEC-004 Empty SSN is rejected by registration form', async () => {
    await page.goto('register.htm');
    await page.fill('input[name="customer.firstName"]', 'Secure');
    await page.fill('input[name="customer.lastName"]', 'Tester');
    await page.fill('input[name="customer.address.street"]', '1 Security Lane');
    await page.fill('input[name="customer.address.city"]', 'SafeCity');
    await page.fill('input[name="customer.address.state"]', 'CA');
    await page.fill('input[name="customer.address.zipCode"]', '90001');
    await page.fill('input[name="customer.phoneNumber"]', '3105559999');
    await page.fill('input[name="customer.username"]', `sec_nosnn_${Date.now()}`);
    await page.fill('input[name="customer.password"]', 'SecTest@456');
    await page.fill('#repeatedPassword', 'SecTest@456');
    await page.click('input[value="Register"]');
    const errors = page.locator('#customerForm .error, #customerForm span.error');
    await expect(errors.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-SEC-005 Find Transactions without login shows error or redirect', async () => {
    await page.goto('findtrans.htm');
    const body = await page.locator('body').innerText();
    const safe = body.includes('Error') || body.includes('Log In') || page.url().includes('index.htm');
    expect(safe).toBeTruthy();
  });

  test('TC-SEC-006 Request Loan without login shows error or redirect', async () => {
    await page.goto('requestloan.htm');
    const body = await page.locator('body').innerText();
    const safe = body.includes('Error') || body.includes('Log In') || page.url().includes('index.htm');
    expect(safe).toBeTruthy();
  });

  test('TC-SEC-007 Update Contact without login shows error or redirect', async () => {
    await page.goto('updateprofile.htm');
    const body = await page.locator('body').innerText();
    const safe = body.includes('Error') || body.includes('Log In') || page.url().includes('index.htm');
    expect(safe).toBeTruthy();
  });
});
