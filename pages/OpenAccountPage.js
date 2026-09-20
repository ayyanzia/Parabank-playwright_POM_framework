// pages/OpenAccountPage.js
const { BasePage } = require('./BasePage');

class OpenAccountPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountType = page.locator('#type');
    this.fromAccountId = page.locator('#fromAccountId');
    this.openAccountButton = page.locator('input[value="Open New Account"]');
    this.newAccountId = page.locator('#newAccountId');
    this.successHeading = page.locator('#openAccountResult h1.title, #rightPanel h1.title');
  }

  async goto() {
    await this.page.goto('openaccount.htm');
  }

  async openNewAccount({ type = 'CHECKING', fromAccountLabel } = {}) {
    const typeOptions = await this.accountType.locator('option').allTextContents();
    if (typeOptions.some((option) => option.includes(type))) {
      await this.accountType.selectOption({ label: type });
    }
    if (fromAccountLabel) {
      await this.fromAccountId.selectOption({ label: fromAccountLabel });
    }
    await this.openAccountButton.click();
  }

  async availableFromAccounts() {
    return this.fromAccountId.locator('option').allTextContents();
  }
}

module.exports = { OpenAccountPage };