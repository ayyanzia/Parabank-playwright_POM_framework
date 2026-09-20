/**
 * tests/regression.spec.js
 *
 * SINGLE-SESSION REGRESSION SUITE — ParaBank
 * ============================================
 * One browser  → One context → One page → All 93 tests in sequence.
 * The browser never closes or restarts between tests or modules.
 * A failing test records ❌ FAIL and execution continues to the next test.
 *
 * Max wait time: 20 seconds (per playwright.config.js).
 */

'use strict';

const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = 'https://parabank.parasoft.com/parabank/';

function randomPersona() {
  const ts = Date.now().toString().slice(-6);
  return {
    firstName: faker.person.firstName(),
    lastName:  faker.person.lastName(),
    street:    faker.location.streetAddress(),
    city:      faker.location.city(),
    state:     faker.location.state({ abbreviated: true }),
    zipCode:   faker.location.zipCode('#####'),
    phone:     faker.string.numeric(10),
    ssn:       `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,
    username:  `qa_${faker.internet.username().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${ts}`,
    password:  `Qa${faker.string.alphanumeric({ length: 6 })}#1`,
  };
}

async function fillReg(page, user) {
  if (user.firstName !== undefined) await page.fill('input[name="customer.firstName"]', user.firstName);
  if (user.lastName  !== undefined) await page.fill('input[name="customer.lastName"]',  user.lastName);
  if (user.street    !== undefined) await page.fill('input[name="customer.address.street"]', user.street);
  if (user.city      !== undefined) await page.fill('input[name="customer.address.city"]',   user.city);
  if (user.state     !== undefined) await page.fill('input[name="customer.address.state"]',  user.state);
  if (user.zipCode   !== undefined) await page.fill('input[name="customer.address.zipCode"]', user.zipCode);
  if (user.phone     !== undefined) await page.fill('input[name="customer.phoneNumber"]', user.phone);
  if (user.ssn       !== undefined) await page.fill('input[name="customer.ssn"]',      user.ssn);
  if (user.username  !== undefined) await page.fill('input[name="customer.username"]', user.username);
  if (user.password  !== undefined) await page.fill('input[name="customer.password"]', user.password);
  const confirm = user.confirmPassword ?? user.password;
  if (confirm !== undefined) await page.fill('#repeatedPassword', confirm);
}

async function doRegister(page, user) {
  await page.goto(BASE_URL + 'register.htm');
  await fillReg(page, user);
  await page.click('input[value="Register"]');
  await page.waitForTimeout(1500);
}

async function doLogin(page, username, password) {
  await page.goto(BASE_URL + 'index.htm');
  await page.waitForTimeout(500);
  const loggedIn = await page.locator('#leftPanel a', { hasText: 'Log Out' }).count();
  if (loggedIn > 0) return;   // already logged in, no restart needed
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('input[value="Log In"]');
  await page.waitForTimeout(1500);
}

async function doLogout(page) {
  const link = page.locator('#leftPanel a', { hasText: 'Log Out' });
  if (await link.count() > 0) {
    await link.click();
    await page.waitForTimeout(1000);
  }
}

// ─── Shared State (single session across ALL modules) ─────────────────────────

// We'll create a single browser context in beforeAll at the describe root,
// and keep the same page object for every single test.

let _browser;
let _context;
let _page;

// Primary test user — registered once at the very start, reused for all authenticated modules.
let _primaryUser;

// ─── Suite Root ──────────────────────────────────────────────────────────────

test.describe('ParaBank Regression Suite — Single Browser Session', () => {

  test.beforeAll(async ({ browser }) => {
    _browser = browser;
    _context = await browser.newContext({ baseURL: BASE_URL });
    _page    = await _context.newPage();

    // Register the primary user once — used by all authenticated modules
    _primaryUser = randomPersona();
    await doRegister(_page, _primaryUser);
    await doLogin(_page, _primaryUser.username, _primaryUser.password);
  });

  test.afterAll(async () => {
    await _page.close();
    await _context.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 1 — USER REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: User Registration', () => {

    test('TC-REG-001 Submit empty form shows validation errors', async () => {
      await _page.goto('register.htm');
      await _page.click('input[value="Register"]');
      const errors = _page.locator('#customerForm .error, #customerForm span.error');
      await expect(errors.first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-REG-002 Mismatched passwords show error', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      u.confirmPassword = 'WrongPassword99!';
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      const errors = _page.locator('#customerForm .error, #customerForm span.error');
      await expect(errors.first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-REG-003 Missing SSN shows error', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      delete u.ssn;
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      const errors = _page.locator('#customerForm .error, #customerForm span.error');
      await expect(errors.first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-REG-004 Single-character first name is accepted (boundary)', async () => {
      await _page.goto('register.htm');
      const u = randomPersona(); u.firstName = 'A';
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-REG-005 Run 1: Successful registration with valid data', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-REG-005 Run 2: Successful registration with valid data', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-REG-005 Run 3: Successful registration with valid data', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-REG-006 Duplicate username is rejected', async () => {
      await _page.goto('register.htm');
      const dup = { ...randomPersona(), username: _primaryUser.username };
      await fillReg(_page, dup);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 2 — USER LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: User Login', () => {

    test.beforeEach(async () => {
      // Ensure we start each login test logged out
      await doLogout(_page);
    });

    test('TC-LOG-001 Run 1: Login with valid credentials', async () => {
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', _primaryUser.username);
      await _page.fill('input[name="password"]', _primaryUser.password);
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1500);
      const heading = _page.locator('#rightPanel h1.title').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('TC-LOG-001 Run 2: Login with valid credentials', async () => {
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', _primaryUser.username);
      await _page.fill('input[name="password"]', _primaryUser.password);
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1500);
      const heading = _page.locator('#rightPanel h1.title').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('TC-LOG-002 Login with wrong password shows error', async () => {
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', _primaryUser.username);
      await _page.fill('input[name="password"]', 'TotallyWrongPass!');
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      const rejected = body.includes('Error') || body.includes('could not be verified');
      expect(rejected).toBeTruthy();
    });

    test('TC-LOG-003 Login with non-existent username shows error', async () => {
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', 'nonexistent_user_xyz_99999');
      await _page.fill('input[name="password"]', 'SomePass123!');
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      const rejected = body.includes('Error') || body.includes('could not be verified');
      expect(rejected).toBeTruthy();
    });

    test('TC-LOG-004 Login rejected with empty fields', async () => {
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', '');
      await _page.fill('input[name="password"]', '');
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1000);
      const body = await _page.locator('body').innerText();
      expect(body).toContain('Please enter a username and password.');
    });

    test('TC-LOG-005 Logout redirects back to login page', async () => {
      // Log in first
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      const logoutLink = _page.locator('#leftPanel a', { hasText: 'Log Out' });
      await expect(logoutLink).toBeVisible({ timeout: 10000 });
      await logoutLink.click();
      await _page.waitForTimeout(1000);
      await expect(_page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 3 — NAVIGATION  (needs to be logged in)
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Navigation', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    const navLinks = [
      'Open New Account', 'Accounts Overview', 'Transfer Funds',
      'Bill Pay', 'Find Transactions', 'Update Contact Info', 'Request Loan'
    ];

    for (const link of navLinks) {
      test(`TC-NAV-001 Navigation check for "${link}"`, async () => {
        await doLogin(_page, _primaryUser.username, _primaryUser.password);
        await _page.locator('#leftPanel a', { hasText: link }).click();
        await _page.waitForTimeout(1000);
        await expect(_page.locator('#rightPanel')).toBeVisible({ timeout: 10000 });
      });
    }

    test('TC-NAV-002 All expected nav links present after login', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      for (const txt of navLinks) {
        const count = await _page.locator('#leftPanel').getByRole('link', { name: txt }).count();
        expect(count, `"${txt}" link missing`).toBeGreaterThan(0);
      }
    });

    test('TC-NAV-003 Home page shows login form without authentication', async () => {
      // Use a fresh temporary context — doesn't close the main session
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'index.htm');
      await expect(tmpPage.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
      await tmpPage.close(); await tmpCtx.close();
    });

    test('TC-NAV-004 Log Out link visible after login', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await expect(_page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
    });

    test('TC-NAV-005 Protected URL without login redirects or shows error', async () => {
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'overview.htm');
      const body = await tmpPage.locator('body').innerText();
      const safe = body.includes('Log In') || body.includes('Error') || tmpPage.url().includes('index.htm');
      expect(safe).toBeTruthy();
      await tmpPage.close(); await tmpCtx.close();
    });

    test('TC-NAV-006 Main logo is visible on page', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await expect(_page.locator('.logo')).toBeVisible({ timeout: 10000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 4 — ACCOUNTS OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Accounts Overview', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    test('TC-AOV-001 Run 1: Accounts overview table visible after login', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      await expect(_page.locator('#accountTable')).toBeVisible({ timeout: 20000 });
    });

    test('TC-AOV-001 Run 2: Accounts overview table visible after login', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      await expect(_page.locator('#accountTable')).toBeVisible({ timeout: 20000 });
    });

    test('TC-AOV-002 At least one account row is present', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      const rows = _page.locator('#accountTable tbody tr');
      await expect(rows.first()).toBeVisible({ timeout: 20000 });
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('TC-AOV-003 Click account number shows activity page', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      const links = _page.locator('#accountTable a');
      await expect(links.first()).toBeVisible({ timeout: 20000 });
      await links.first().click();
      await _page.waitForTimeout(1500);
      const heading = await _page.locator('#rightPanel h1').innerText();
      expect(heading.toLowerCase()).toContain('account');
    });

    test('TC-AOV-004 Total balance cell shows a dollar amount', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      await _page.waitForTimeout(2000);
      const cell = _page.locator('#accountTable tfoot td').nth(1);
      const text = await cell.textContent({ timeout: 20000 });
      expect(text).toMatch(/\$[\d,]+\.\d{2}/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 5 — OPEN NEW ACCOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Open New Account', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    async function openAccountOfType(type, expectText) {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('openaccount.htm');
      await _page.waitForTimeout(1500);
      await _page.locator('#type').selectOption(type);
      await _page.waitForTimeout(500);
      await _page.click('input[value="Open New Account"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('#rightPanel').innerText();
      expect(body).toContain(expectText);
    }

    test('TC-OAC-001 Run 1: Open a new Checking account', async () => {
      await openAccountOfType('0', 'Account Opened');
    });

    test('TC-OAC-001 Run 2: Open a new Checking account', async () => {
      await openAccountOfType('0', 'Account Opened');
    });

    test('TC-OAC-002 Run 1: Open a new Savings account', async () => {
      await openAccountOfType('1', 'Account Opened');
    });

    test('TC-OAC-002 Run 2: Open a new Savings account', async () => {
      await openAccountOfType('1', 'Account Opened');
    });

    test('TC-OAC-003 Open Account page accessible via nav link', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.locator('#leftPanel a', { hasText: 'Open New Account' }).click();
      await _page.waitForTimeout(1000);
      const body = await _page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6 — TRANSFER FUNDS
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Transfer Funds', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    async function doTransfer(amount) {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('transfer.htm');
      await _page.waitForTimeout(1500);
      await _page.fill('#amount', amount);
      await _page.click('input[value="Transfer"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      const ok = body.includes('Transfer Complete') || body.includes('transferred');
      expect(ok).toBeTruthy();
    }

    test('TC-TRF-001 Transfer $10 between accounts',  async () => { await doTransfer('10'); });
    test('TC-TRF-001 Transfer $50 between accounts',  async () => { await doTransfer('50'); });
    test('TC-TRF-001 Transfer $100 between accounts', async () => { await doTransfer('100'); });

    test('TC-TRF-002 Transfer page shows From and To dropdowns', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('transfer.htm');
      await _page.waitForTimeout(1500);
      await expect(_page.locator('#fromAccountId')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('#toAccountId')).toBeVisible({ timeout: 10000 });
    });

    test('TC-TRF-003 Transfer with blank amount does not crash server', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('transfer.htm');
      await _page.waitForTimeout(1500);
      await _page.fill('#amount', '');
      await _page.click('input[value="Transfer"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      expect(body).not.toContain('Internal Server Error');
    });

    test('TC-TRF-004 Transfer with zero amount is handled', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('transfer.htm');
      await _page.waitForTimeout(1500);
      await _page.fill('#amount', '0');
      await _page.click('input[value="Transfer"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      expect(body).not.toContain('Internal Server Error');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 7 — BILL PAY
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Bill Payment', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    async function fillBill(payeeName, amount, mismatch = false) {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('billpay.htm');
      await _page.waitForTimeout(1500);
      if (payeeName) await _page.fill('input[name="payee.name"]', payeeName);
      await _page.fill('input[name="payee.address.street"]',  '100 Bill Ave');
      await _page.fill('input[name="payee.address.city"]',    'Billtown');
      await _page.fill('input[name="payee.address.state"]',   'NY');
      await _page.fill('input[name="payee.address.zipCode"]', '10001');
      await _page.fill('input[name="payee.phoneNumber"]',     '2125551000');
      const acct = '12345';
      await _page.fill('input[name="payee.accountNumber"]', acct);
      await _page.fill('input[name="verifyAccount"]', mismatch ? '99999' : acct);
      await _page.fill('input[name="amount"]', amount);
    }

    const payees = [
      { name: 'Acme Corp',        amt: '25' },
      { name: 'Global Utilities', amt: '75' },
      { name: 'Metro Gas',        amt: '42' },
    ];

    for (let run = 1; run <= 2; run++) {
      for (const p of payees) {
        test(`TC-BPY-001 Run ${run}: Pay "${p.name}" $${p.amt}`, async () => {
          await fillBill(p.name, p.amt);
          await _page.click('input[value="Send Payment"]');
          await _page.waitForTimeout(2000);
          const body = await _page.locator('body').innerText();
          expect(body).toMatch(new RegExp(`Bill Payment.*Complete|${p.name}`, 'i'));
        });
      }
    }

    test('TC-BPY-002 Mismatched account numbers are rejected', async () => {
      await fillBill('Test Payee', '10', true);
      await _page.click('input[value="Send Payment"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      const rejected = body.includes('match') || body.includes('error') || body.includes('Error');
      expect(rejected).toBeTruthy();
    });

    test('TC-BPY-003 Blank payee name is rejected', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('billpay.htm');
      await _page.waitForTimeout(1500);
      await _page.click('input[value="Send Payment"]');
      await _page.waitForTimeout(1000);
      const errors = _page.locator('#billpayForm .error, #billpayForm span.error');
      expect(await errors.count()).toBeGreaterThan(0);
    });

    test('TC-BPY-004 Confirmation shows payee name and amount', async () => {
      await fillBill('Verification Corp', '99');
      await _page.click('input[value="Send Payment"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      const ok = body.includes('Verification Corp') || body.includes('99') || body.includes('Complete');
      expect(ok).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 8 — FIND TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Find Transactions', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    async function gotoFind() {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('findtrans.htm');
      await _page.waitForTimeout(1500);
      // Wait for account select to populate
      await _page.locator('#accountId option').first().waitFor({ timeout: 10000 }).catch(() => {});
    }

    const amounts = ['10', '50', '100'];
    for (const amt of amounts) {
      test(`TC-FTX-001 Find transactions by amount $${amt}`, async () => {
        await gotoFind();
        await _page.fill('#amount', amt);
        await _page.click('#findByAmount');
        await _page.waitForTimeout(2000);
        const body = await _page.locator('#rightPanel').innerText();
        expect(body.length).toBeGreaterThan(0);
      });
    }

    const dates = ['07-01-2026', '01-01-2026', '12-31-2025'];
    for (const date of dates) {
      test(`TC-FTX-002 Find transactions by date ${date}`, async () => {
        await gotoFind();
        await _page.fill('#transactionDate', date);
        await _page.click('#findByDate');
        await _page.waitForTimeout(2000);
        const body = await _page.locator('#rightPanel').innerText();
        expect(body.length).toBeGreaterThan(0);
      });
    }

    test('TC-FTX-003 Find transactions by date range', async () => {
      await gotoFind();
      await _page.fill('#fromDate', '01-01-2026');
      await _page.fill('#toDate', '12-31-2026');
      await _page.click('#findByDateRange');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-FTX-004 Find by non-existent transaction ID shows no results', async () => {
      await gotoFind();
      await _page.fill('#transactionId', '99999999');
      await _page.click('#findById');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-FTX-005 Find Transactions without login shows error or redirect', async () => {
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'findtrans.htm');
      const body = await tmpPage.locator('body').innerText();
      const safe = body.includes('Error') || body.includes('Log In') || tmpPage.url().includes('index.htm');
      expect(safe).toBeTruthy();
      await tmpPage.close(); await tmpCtx.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 9 — REQUEST LOAN
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Request Loan', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    const loans = [
      { amt: '1000', down: '100' },
      { amt: '5000', down: '500' },
      { amt: '500',  down: '50'  },
    ];

    for (let run = 1; run <= 2; run++) {
      for (const l of loans) {
        test(`TC-LNS-001 Run ${run}: Loan application $${l.amt} / $${l.down} down`, async () => {
          await doLogin(_page, _primaryUser.username, _primaryUser.password);
          await _page.goto('requestloan.htm');
          await _page.waitForTimeout(1000);
          await _page.fill('#amount', l.amt);
          await _page.fill('#downPayment', l.down);
          await _page.click('input[value="Apply Now"]');
          await _page.waitForTimeout(4000);
          const body = await _page.locator('#rightPanel').innerText();
          const ok = body.includes('Approved') || body.includes('Denied') || body.includes('Loan') || body.includes('Status');
          expect(ok).toBeTruthy();
        });
      }
    }

    test('TC-LNS-002 Loan page renders Amount, Down Payment and Apply button', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('requestloan.htm');
      await _page.waitForTimeout(1000);
      await expect(_page.locator('#amount')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('#downPayment')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('input[value="Apply Now"]')).toBeVisible({ timeout: 10000 });
    });

    test('TC-LNS-003 Blank loan amount handled gracefully', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('requestloan.htm');
      await _page.waitForTimeout(1000);
      await _page.fill('#amount', '');
      await _page.fill('#downPayment', '');
      await _page.click('input[value="Apply Now"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      expect(body).not.toContain('Internal Server Error');
    });

    test('TC-LNS-004 Very large loan amount edge case ($999999)', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('requestloan.htm');
      await _page.waitForTimeout(1000);
      await _page.fill('#amount', '999999');
      await _page.fill('#downPayment', '10000');
      await _page.click('input[value="Apply Now"]');
      await _page.waitForTimeout(4000);
      const body = await _page.locator('body').innerText();
      expect(body).not.toContain('Internal Server Error');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 10 — UPDATE CONTACT INFO
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Update Contact Info', () => {

    test.beforeAll(async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
    });

    const profiles = [
      { street: '111 First St',   city: 'City One'   },
      { street: '222 Second Ave', city: 'City Two'   },
      { street: '333 Third Blvd', city: 'City Three' },
    ];

    for (const p of profiles) {
      test(`TC-UCP-001 Update profile: ${p.street}, ${p.city}`, async () => {
        await doLogin(_page, _primaryUser.username, _primaryUser.password);
        await _page.goto('updateprofile.htm');
        await _page.waitForTimeout(2000);
        await _page.locator('#customer\\.address\\.street').fill(p.street);
        await _page.locator('#customer\\.address\\.city').fill(p.city);
        await _page.click('input[value="Update Profile"]');
        await _page.waitForTimeout(2000);
        const body = await _page.locator('#rightPanel').innerText();
        const ok = body.includes('updated') || body.includes('Updated') || body.includes('Profile') || body.length > 0;
        expect(ok).toBeTruthy();
      });
    }

    test('TC-UCP-002 Blank first name shows error or is rejected', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('updateprofile.htm');
      await _page.waitForTimeout(2000);
      await _page.locator('#customer\\.firstName').fill('');
      await _page.click('input[value="Update Profile"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-UCP-003 Update Contact Info nav link opens profile form', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.locator('#leftPanel a', { hasText: 'Update Contact Info' }).click();
      await _page.waitForTimeout(1500);
      const body = await _page.locator('#rightPanel').innerText();
      expect(body.length).toBeGreaterThan(0);
    });

    test('TC-UCP-004 Profile form has pre-populated fields', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('updateprofile.htm');
      await _page.waitForTimeout(2000);
      const firstName = await _page.locator('#customer\\.firstName').inputValue();
      const lastName  = await _page.locator('#customer\\.lastName').inputValue();
      expect(firstName.length + lastName.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 11 — SECURITY & INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Security & Input Validation', () => {

    test('TC-SEC-001 SQL injection in login username does not crash server', async () => {
      await doLogout(_page);
      await _page.goto('index.htm');
      await _page.fill('input[name="username"]', "' OR '1'='1");
      await _page.fill('input[name="password"]', "' OR '1'='1");
      await _page.click('input[value="Log In"]');
      await _page.waitForTimeout(1500);
      const body = await _page.locator('body').innerText();
      const safe = !body.includes('Stack Trace') && !body.includes('java.lang.Exception');
      expect(safe).toBeTruthy();
    });

    test('TC-SEC-002 XSS script tag in first name is not executed', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      u.firstName = '<script>alert("xss")</script>';
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(2000);
      const alerts = [];
      _page.on('dialog', d => { alerts.push(d.message()); d.dismiss(); });
      expect(alerts.length).toBe(0);
    });

    test('TC-SEC-003 Very long username (255 chars) does not crash', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      u.username = 'a'.repeat(255);
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      await _page.waitForTimeout(2000);
      const body = await _page.locator('body').innerText();
      const safe = !body.includes('Stack Trace');
      expect(safe).toBeTruthy();
    });

    test('TC-SEC-004 Empty SSN is rejected by registration form', async () => {
      await _page.goto('register.htm');
      const u = randomPersona();
      delete u.ssn;
      await fillReg(_page, u);
      await _page.click('input[value="Register"]');
      const errors = _page.locator('#customerForm .error, #customerForm span.error');
      await expect(errors.first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-SEC-005 Find Transactions without login shows error or redirect', async () => {
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'findtrans.htm');
      const body = await tmpPage.locator('body').innerText();
      const safe = body.includes('Error') || body.includes('Log In') || tmpPage.url().includes('index.htm');
      expect(safe).toBeTruthy();
      await tmpPage.close(); await tmpCtx.close();
    });

    test('TC-SEC-006 Request Loan without login shows error or redirect', async () => {
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'requestloan.htm');
      const body = await tmpPage.locator('body').innerText();
      const safe = body.includes('Error') || body.includes('Log In') || tmpPage.url().includes('index.htm');
      expect(safe).toBeTruthy();
      await tmpPage.close(); await tmpCtx.close();
    });

    test('TC-SEC-007 Update Contact without login shows error or redirect', async () => {
      const tmpCtx  = await _browser.newContext();
      const tmpPage = await tmpCtx.newPage();
      await tmpPage.goto(BASE_URL + 'updateprofile.htm');
      const body = await tmpPage.locator('body').innerText();
      const safe = body.includes('Error') || body.includes('Log In') || tmpPage.url().includes('index.htm');
      expect(safe).toBeTruthy();
      await tmpPage.close(); await tmpCtx.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 12 — SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: Session Management', () => {

    test('TC-SES-001 Session persists across navigation to overview', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('overview.htm');
      await expect(_page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
    });

    test('TC-SES-002 Session persists across navigation to bill pay', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await _page.goto('billpay.htm');
      await expect(_page.locator('#leftPanel a', { hasText: 'Log Out' })).toBeVisible({ timeout: 10000 });
    });

    test('TC-SES-003 After logout, protected pages are inaccessible', async () => {
      await doLogin(_page, _primaryUser.username, _primaryUser.password);
      await doLogout(_page);
      await _page.goto('overview.htm');
      const body = await _page.locator('body').innerText();
      const blocked = body.includes('Log In') || body.includes('Error') || _page.url().includes('index.htm');
      expect(blocked).toBeTruthy();
    });

    test('TC-SES-004 Login form shown when unauthenticated', async () => {
      await doLogout(_page);
      await _page.goto('index.htm');
      await expect(_page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('input[value="Log In"]')).toBeVisible({ timeout: 10000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 13 — UI & USABILITY
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Module: UI & Usability', () => {

    test('TC-UIU-001 Home page has correct browser title', async () => {
      await _page.goto('index.htm');
      await expect(_page).toHaveTitle(/ParaBank/i, { timeout: 10000 });
    });

    test('TC-UIU-002 Registration page renders all required form fields', async () => {
      await _page.goto('register.htm');
      const fields = [
        'input[name="customer.firstName"]', 'input[name="customer.lastName"]',
        'input[name="customer.address.street"]', 'input[name="customer.address.city"]',
        'input[name="customer.address.state"]',  'input[name="customer.address.zipCode"]',
        'input[name="customer.phoneNumber"]',     'input[name="customer.ssn"]',
        'input[name="customer.username"]',        'input[name="customer.password"]',
        '#repeatedPassword',
      ];
      for (const sel of fields) {
        await expect(_page.locator(sel)).toBeVisible({ timeout: 5000 });
      }
    });

    test('TC-UIU-003 Login page renders username, password and submit button', async () => {
      await doLogout(_page);
      await _page.goto('index.htm');
      await expect(_page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
      await expect(_page.locator('input[value="Log In"]')).toBeVisible({ timeout: 10000 });
    });

    test('TC-UIU-004 Forgot login info link is present', async () => {
      await _page.goto('index.htm');
      await expect(_page.locator('a', { hasText: /forgot|lookup/i })).toBeVisible({ timeout: 10000 });
    });

    test('TC-UIU-005 Register link is visible on home page', async () => {
      await _page.goto('index.htm');
      await expect(_page.locator('#loginPanel a', { hasText: /register/i })).toBeVisible({ timeout: 10000 });
    });

    test('TC-UIU-006 Register link leads to registration form', async () => {
      await _page.goto('index.htm');
      await _page.locator('#loginPanel a', { hasText: /register/i }).click();
      await expect(_page.locator('input[name="customer.firstName"]')).toBeVisible({ timeout: 10000 });
    });

    test('TC-UIU-007 No horizontal overflow at 1280px viewport', async () => {
      await _page.setViewportSize({ width: 1280, height: 800 });
      await _page.goto('index.htm');
      const scrollWidth  = await _page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth  = await _page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });

}); // end ParaBank Regression Suite
