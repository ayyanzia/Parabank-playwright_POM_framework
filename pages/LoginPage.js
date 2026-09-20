// pages/LoginPage.js
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.forgotLoginLink = page.getByRole('link', { name: 'Forgot login info?' });
  }

  async goto() {
    await this.page.goto('index.htm');
  }

  async login(username, password) {
    await this.usernameInput.fill(username ?? '');
    await this.passwordInput.fill(password ?? '');
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };