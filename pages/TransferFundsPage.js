// pages/TransferFundsPage.js
const { BasePage } = require('./BasePage');

class TransferFundsPage extends BasePage {
  constructor(page) {
    super(page);
    this.amountInput = page.locator('#amount');
    this.fromAccountId = page.locator('#fromAccountId');
    this.toAccountId = page.locator('#toAccountId');
    this.transferButton = page.locator('input[value="Transfer"]');
    this.confirmationHeading = page.locator('#showResult h1.title');
    this.errorText = page.locator('#rightPanel .error');
  }

  async goto() {
    await this.page.goto('transfer.htm');
  }

  async transfer({ amount, fromLabel, toLabel } = {}) {
    if (amount !== undefined) await this.amountInput.fill(String(amount));
    if (fromLabel) await this.fromAccountId.selectOption({ label: fromLabel });
    if (toLabel) await this.toAccountId.selectOption({ label: toLabel });
    await this.transferButton.click();
  }

  async accountOptions() {
    return this.fromAccountId.locator('option').allTextContents();
  }
}

module.exports = { TransferFundsPage };