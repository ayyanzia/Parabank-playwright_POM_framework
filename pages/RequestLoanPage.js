// pages/RequestLoanPage.js
const { BasePage } = require('./BasePage');

class RequestLoanPage extends BasePage {
  constructor(page) {
    super(page);
    this.amountInput = page.locator('#amount');
    this.downPaymentInput = page.locator('#downPayment');
    this.fromAccountId = page.locator('#fromAccountId');
    this.applyButton = page.locator('input[value="Apply Now"]');
    // The loan decision renders inside an iframe (#loanRequestResultPage) on classic ParaBank.
    this.resultFrame = page.frameLocator('#loanRequestResultPage');
  }

  async goto() {
    await this.page.goto('requestloan.htm');
  }

  async apply({ amount, downPayment, fromLabel } = {}) {
    if (amount !== undefined) await this.amountInput.fill(String(amount));
    if (downPayment !== undefined) await this.downPaymentInput.fill(String(downPayment));
    if (fromLabel) await this.fromAccountId.selectOption({ label: fromLabel });
    await this.applyButton.click();
  }

  async decisionText() {
    await this.page.waitForTimeout(1000); // loan decision iframe renders asynchronously
    return this.resultFrame.locator('#loanStatus').innerText();
  }

  async newAccountId() {
    return this.resultFrame.locator('#newAccountId').innerText();
  }
}

module.exports = { RequestLoanPage };