// pages/BasePage.js
class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.leftNav = page.locator('#leftPanel');
  }

  async gotoHome() {
    await this.page.goto('index.htm');
  }

  async logout() {
    await this.page.locator('#leftPanel a', { hasText: 'Log Out' }).click();
  }

  navLink(text) {
    return this.leftNav.getByRole('link', { name: text, exact: true });
  }

  /** The generic red/error message box ParaBank renders inside #rightPanel. */
  errorMessage() {
    return this.page.locator('#rightPanel .error, #rightPanel p.error');
  }

  async isLoggedIn() {
    return (await this.leftNav.getByRole('link', { name: 'Log Out' }).count()) > 0;
  }
}

module.exports = { BasePage };