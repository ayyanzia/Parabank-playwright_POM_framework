// tests/login.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, randomPersona, registerUser, loginUser } = require('./helpers/shared');



test.describe('Module: User Login', () => {
  let page;
  let user;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    user = randomPersona();
    await registerUser(page, user);
  });

  test.afterAll(async () => { await page.close(); });

  // Test multiple successful logins
  for (let i = 1; i <= 2; i++) {
    test(`TC-LOG-001 Run ${i}: Login with valid credentials`, async () => {
      await page.goto('index.htm');
      await page.fill('input[name="username"]', user.username);
      await page.fill('input[name="password"]', user.password);
      await page.click('input[value="Log In"]');
      await page.waitForTimeout(2000);
      const heading = page.locator('#rightPanel h1.title').first();
      await expect(heading).toBeVisible({ timeout: 15000 });
      // Logout to prepare for next test
      const logoutLink = page.locator('#leftPanel a', { hasText: 'Log Out' });
      if (await logoutLink.count() > 0) await logoutLink.click();
    });
  }

  test('TC-LOG-002 Login with wrong password shows error', async () => {
    await page.goto('index.htm');
    await page.fill('input[name="username"]', user.username);
    await page.fill('input[name="password"]', 'TotallyWrongPass!');
    await page.click('input[value="Log In"]');
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    const rejected = bodyText.includes('Error') || bodyText.includes('could not be verified') || !bodyText.includes('Accounts Overview');
    expect(rejected).toBeTruthy();
  });

  test('TC-LOG-003 Login with non-existent username shows error', async () => {
    await page.goto('index.htm');
    await page.fill('input[name="username"]', 'nonexistent_user_xyz_99999');
    await page.fill('input[name="password"]', 'SomePass123!');
    await page.click('input[value="Log In"]');
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    const rejected = bodyText.includes('Error') || bodyText.includes('could not be verified') || !bodyText.includes('Accounts Overview');
    expect(rejected).toBeTruthy();
  });

  test('TC-LOG-004 Login rejected with empty fields', async () => {
    await page.goto('index.htm');
    await page.fill('input[name="username"]', '');
    await page.fill('input[name="password"]', '');
    await page.click('input[value="Log In"]');
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Please enter a username and password.');
  });

  test('TC-LOG-005 Logout redirects back to login page', async () => {
    await loginUser(page, user.username, user.password);
    const logoutLink = page.locator('#leftPanel a', { hasText: 'Log Out' });
    await logoutLink.click();
    await page.waitForTimeout(2000);
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
  });
});
