// pages/FindTransactionsPage.js
const { BasePage } = require('./BasePage');

class FindTransactionsPage extends BasePage {
  constructor(page) {
    super(page);
    this.transactionIdInput = page.locator('#transactionId');
    this.dateInput = page.locator('#transactionDate');
    this.fromDateInput = page.locator('#fromDate');
    this.toDateInput = page.locator('#toDate');
    this.amountInput = page.locator('#amount');
    this.resultsTable = page.locator('#transactionTable');
    this.resultsRows = page.locator('#transactionTable tbody tr');
    this.errorText = page.locator('#rightPanel .error, #transactionTable + .error');
  }

  async goto(accountId) {
    const url = accountId ? `/findtrans.htm?id=${accountId}` : 'findtrans.htm';
    await this.page.goto(url);
  }

  async findByTransactionId(id) {
    await this.transactionIdInput.fill(String(id));
    await this.page.getByRole('button', { name: 'Find Transactions' }).first().click();
  }

  async findByDate(date) {
    await this.dateInput.fill(date);
    await this.page.getByRole('button', { name: 'Find Transactions' }).nth(1).click();
  }

  async findByDateRange(fromDate, toDate) {
    await this.fromDateInput.fill(fromDate);
    await this.toDateInput.fill(toDate);
    await this.page.getByRole('button', { name: 'Find Transactions' }).nth(2).click();
  }

  async findByAmount(amount) {
    await this.amountInput.fill(String(amount));
    await this.page.getByRole('button', { name: 'Find Transactions' }).nth(3).click();
  }
}

module.exports = { FindTransactionsPage };