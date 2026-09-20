// pages/BillPayPage.js
const { BasePage } = require('./BasePage');

class BillPayPage extends BasePage {
  constructor(page) {
    super(page);
    this.payeeName = page.locator('input[name="payee.name"]');
    this.street = page.locator('input[name="payee.address.street"]');
    this.city = page.locator('input[name="payee.address.city"]');
    this.state = page.locator('input[name="payee.address.state"]');
    this.zipCode = page.locator('input[name="payee.address.zipCode"]');
    this.phone = page.locator('input[name="payee.phoneNumber"]');
    this.accountNumber = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccount = page.locator('input[name="verifyAccount"]');
    this.amount = page.locator('input[name="amount"]');
    this.fromAccountId = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.locator('input[value="Send Payment"]');
    this.confirmationHeading = page.locator('#billpayResult h1.title');
    this.errorText = page.locator('#rightPanel .error');
  }

  async goto() {
    await this.page.goto('billpay.htm');
  }

  async pay(payee = {}) {
    const map = {
      name: this.payeeName, street: this.street, city: this.city, state: this.state,
      zipCode: this.zipCode, phone: this.phone, accountNumber: this.accountNumber,
      verifyAccount: this.verifyAccount, amount: this.amount,
    };
    for (const [key, locator] of Object.entries(map)) {
      if (payee[key] !== undefined) await locator.fill(String(payee[key]));
    }
    if (payee.fromLabel) {
      const options = await this.fromAccountId.locator('option').allTextContents();
      if (options.some((option) => option.includes(payee.fromLabel))) {
        await this.fromAccountId.selectOption({ label: payee.fromLabel });
      }
    }
    await this.sendPaymentButton.click();
  }
}

module.exports = { BillPayPage };