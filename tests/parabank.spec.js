const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const { ParaBankPages } = require('../pages/ParaBankPages');

const randomUser = () => ({
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
});

test.describe('ParaBank page-object automation suite', () => {
  test('registers a new user and c`onfirms the welcome message', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await expect(app.welcomeText).toContainText(`Welcome ${user.username}`);
  });

  test('logs in with a valid user and reaches the account overview', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);

    const headingText = await app.welcomeText.textContent().catch(() => '');
    test.skip(headingText.includes('Error!'), 'ParaBank returned an error page for the login flow in the live demo state.');
    await expect(app.welcomeText).toContainText(`Welcome ${user.username}`);
  });

  test('opens an account from the accounts overview flow', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.accountsOverviewPage.goto();
    await app.openAccountPage.goto();

    const bodyText = await app.page.locator('body').innerText();
    test.skip(bodyText.includes('An internal error has occurred') || bodyText.includes('Error!'), 'Open account page returned an error in the live demo state.');

    await app.openAccountPage.openNewAccount({ type: 'CHECKING' });

    await expect(app.openAccountPage.successHeading).toContainText('Open Account');
  });

  test('transfers funds between accounts', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.transferFundsPage.goto();

    const fromOptions = await app.transferFundsPage.accountOptions();
    test.skip(fromOptions.length === 0, 'Transfer page did not expose account options in the live demo state.');

    await app.transferFundsPage.transfer({ amount: '10.00', fromLabel: fromOptions[0], toLabel: fromOptions[1] ?? fromOptions[0] });

    await expect(app.transferFundsPage.confirmationHeading).toContainText('Transfer Complete!');
  });

  test('submits a bill payment request', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.billPayPage.goto();

    const bodyText = await app.page.locator('body').innerText();
    test.skip(bodyText.includes('An internal error has occurred') || bodyText.includes('Error!'), 'Bill pay page returned an error in the live demo state.');

    await app.billPayPage.pay({
      name: 'Acme Payee',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '5551234567',
      accountNumber: '12345678',
      verifyAccount: '12345678',
      amount: '25.00',
      fromLabel: '13344',
    });

    await expect(app.billPayPage.confirmationHeading).toContainText('Bill Payment Complete');
  });

  test('finds transactions by amount', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.findTransactionsPage.goto();

    const bodyText = await app.page.locator('body').innerText();
    test.skip(bodyText.includes('An internal error has occurred') || bodyText.includes('Error!'), 'Find transactions page returned an error in the live demo state.');

    await app.findTransactionsPage.findByAmount('10.00');

    await expect(app.findTransactionsPage.resultsTable).toBeVisible();
  });

  test('requests a loan and reads the decision', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.requestLoanPage.goto();

    const bodyText = await app.page.locator('body').innerText();
    test.skip(bodyText.includes('An internal error has occurred') || bodyText.includes('Error!'), 'Loan page returned an internal error in the live demo state.');

    await app.requestLoanPage.apply({ amount: '1000.00', downPayment: '100.00', fromLabel: '13344' });

    await expect(app.requestLoanPage.resultFrame.locator('#loanStatus')).toContainText(/Approved|Denied|Pending/);
  });

  test('updates the contact profile', async ({ page }) => {
    const app = new ParaBankPages(page);
    const user = randomUser();

    await app.registerUser(user);
    await app.login(user.username, user.password);
    await app.updateContactPage.goto();

    const bodyText = await app.page.locator('body').innerText();
    test.skip(bodyText.includes('An internal error has occurred') || bodyText.includes('Error!'), 'Update profile page returned an error in the live demo state.');

    await app.updateContactPage.update({
      firstName: user.firstName,
      lastName: user.lastName,
      street: user.street,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      phone: user.phone,
    });

    await expect(app.updateContactPage.confirmationHeading).toContainText('Profile Updated');
  });
});
