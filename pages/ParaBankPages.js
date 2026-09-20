const { LoginPage } = require('./LoginPage');
const { RegistrationPage } = require('./RegistrationPage');
const { AccountsOverviewPage } = require('./AccountsOverviewPage');
const { OpenAccountPage } = require('./OpenAccountPage');
const { TransferFundsPage } = require('./TransferFundsPage');
const { BillPayPage } = require('./BillPayPage');
const { FindTransactionsPage } = require('./FindTransactionsPage');
const { RequestLoanPage } = require('./RequestLoanPage');
const { UpdateContactPage } = require('./UpdateContactPage');

class ParaBankPages {
  constructor(page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.registrationPage = new RegistrationPage(page);
    this.accountsOverviewPage = new AccountsOverviewPage(page);
    this.openAccountPage = new OpenAccountPage(page);
    this.transferFundsPage = new TransferFundsPage(page);
    this.billPayPage = new BillPayPage(page);
    this.findTransactionsPage = new FindTransactionsPage(page);
    this.requestLoanPage = new RequestLoanPage(page);
    this.updateContactPage = new UpdateContactPage(page);
    this.welcomeText = page.locator('#rightPanel h1.title');
    this.errorMsg = page.locator('#rightPanel .error, #rightPanel p.error');
  }

  async navigate() {
    await this.page.goto('index.htm');
  }

  async registerUser(profile) {
    await this.registrationPage.goto();
    await this.registrationPage.register(profile);
  }

  async login(username, password) {
    await this.loginPage.goto();
    const alreadyLoggedIn = await this.page.locator('#leftPanel a', { hasText: 'Log Out' }).count();
    if (alreadyLoggedIn > 0) {
      return;
    }
    await this.loginPage.login(username, password);
  }
}

module.exports = { ParaBankPages };
