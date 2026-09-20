// pages/AccountsOverviewPage.js
const { BasePage } = require('./BasePage');

class AccountsOverviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr');
    this.totalCell = page.locator('#accountTable tfoot td').nth(1);
  }

  async goto() {
    await this.page.goto('overview.htm');
  }

  /** Returns [{ accountNumber, balance, available }] parsed from the table. */
  async readAccounts() {
    const rows = await this.accountRows.all();
    const out = [];
    for (const row of rows) {
      const cells = await row.locator('td').allInnerTexts();
      if (cells.length >= 3) {
        out.push({ accountNumber: cells[0].trim(), balance: cells[1].trim(), available: cells[2].trim() });
      }
    }
    return out;
  }

  async openAccount(accountNumber) {
    await this.page.locator('#accountTable a', { hasText: accountNumber }).click();
  }
}

module.exports = { AccountsOverviewPage };