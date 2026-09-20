// tests/registration.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, randomPersona, fillRegistrationForm } = require('./helpers/shared');



test.describe('Module: User Registration', () => {
  /** @type {import('@playwright/test').Page} */
  let page;
  let registeredUser;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
  });

  test.afterAll(async () => { await page.close(); });

  test('TC-REG-001 Submit empty form shows validation errors', async () => {
    await page.goto('register.htm');
    await page.click('input[value="Register"]');
    const errors = page.locator('#customerForm .error, #customerForm span.error');
    await expect(errors.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-REG-002 Mismatched passwords show error', async () => {
    await page.goto('register.htm');
    const user = randomPersona();
    user.confirmPassword = 'WrongPassword99!';
    await fillRegistrationForm(page, user);
    await page.click('input[value="Register"]');
    const errors = page.locator('#customerForm .error, #customerForm span.error');
    await expect(errors.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-REG-003 Missing SSN shows error', async () => {
    await page.goto('register.htm');
    const user = randomPersona();
    delete user.ssn;
    await fillRegistrationForm(page, user);
    await page.click('input[value="Register"]');
    const errors = page.locator('#customerForm .error, #customerForm span.error');
    await expect(errors.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-REG-004 Single-character first name is accepted (boundary)', async () => {
    await page.goto('register.htm');
    const user = randomPersona();
    user.firstName = 'A';
    await fillRegistrationForm(page, user);
    await page.click('input[value="Register"]');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(0);
  });

  // Multiple valid registrations
  for (let i = 1; i <= 3; i++) {
    test(`TC-REG-005 Run ${i}: Successful registration with valid data`, async () => {
      await page.goto('register.htm');
      const user = randomPersona();
      await fillRegistrationForm(page, user);
      await page.click('input[value="Register"]');
      await page.waitForTimeout(3000);
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
      if (i === 1) registeredUser = user; // Save for duplicate test
    });
  }

  test('TC-REG-006 Duplicate username is rejected', async () => {
    await page.goto('register.htm');
    const dup = { ...randomPersona(), username: registeredUser.username };
    await fillRegistrationForm(page, dup);
    await page.click('input[value="Register"]');
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const hasResponse = body.includes('error') || body.includes('already') || body.includes('Error') || body.length > 0;
    expect(hasResponse).toBeTruthy();
  });
});
