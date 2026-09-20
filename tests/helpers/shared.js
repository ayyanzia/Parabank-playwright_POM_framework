// tests/helpers/shared.js
// Shared utilities for every spec file — single-session regression approach.
const { faker } = require('@faker-js/faker');

const BASE_URL = process.env.PARABANK_BASE_URL || 'https://parabank.parasoft.com/parabank/';

/** Generates a unique, valid registration profile. */
function randomPersona() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
    phone: faker.string.numeric(10),
    ssn: `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,
    username: `qa_${faker.internet.username().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${Date.now().toString().slice(-6)}`,
    password: `Qa${faker.string.alphanumeric({ length: 6 })}#1`,
  };
}

/** Fills whichever registration fields are present in the profile object. */
async function fillRegistrationForm(page, user) {
  if (user.firstName !== undefined) await page.fill('input[name="customer.firstName"]', user.firstName);
  if (user.lastName  !== undefined) await page.fill('input[name="customer.lastName"]', user.lastName);
  if (user.street    !== undefined) await page.fill('input[name="customer.address.street"]', user.street);
  if (user.city      !== undefined) await page.fill('input[name="customer.address.city"]', user.city);
  if (user.state     !== undefined) await page.fill('input[name="customer.address.state"]', user.state);
  if (user.zipCode   !== undefined) await page.fill('input[name="customer.address.zipCode"]', user.zipCode);
  if (user.phone     !== undefined) await page.fill('input[name="customer.phoneNumber"]', user.phone);
  if (user.ssn       !== undefined) await page.fill('input[name="customer.ssn"]', user.ssn);
  if (user.username  !== undefined) await page.fill('input[name="customer.username"]', user.username);
  if (user.password  !== undefined) await page.fill('input[name="customer.password"]', user.password);
  const confirm = user.confirmPassword ?? user.password;
  if (confirm !== undefined) await page.fill('#repeatedPassword', confirm);
}

/** Registers a user on the shared page (no new page created). */
async function registerUser(page, user) {
  await page.goto('register.htm');
  await fillRegistrationForm(page, user);
  await page.click('input[value="Register"]');
  await page.waitForTimeout(2000);
}

/** Logs in on the shared page. Skips if already logged in. */
async function loginUser(page, username, password) {
  await page.goto('index.htm');
  const alreadyIn = await page.locator('#leftPanel a', { hasText: 'Log Out' }).count();
  if (alreadyIn > 0) return;
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('input[value="Log In"]');
  await page.waitForTimeout(2000);
}

/** Register + login in one call, returning the user object. */
async function registerAndLogin(page) {
  const user = randomPersona();
  await registerUser(page, user);
  await loginUser(page, user.username, user.password);
  return user;
}

/** Returns true if the page body contains a server error message. */
async function hasPageError(page) {
  const body = await page.locator('body').innerText();
  return body.includes('An internal error') || body.includes('Error!');
}

module.exports = { BASE_URL, randomPersona, fillRegistrationForm, registerUser, loginUser, registerAndLogin, hasPageError };
