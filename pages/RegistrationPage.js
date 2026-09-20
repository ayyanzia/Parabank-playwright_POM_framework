// pages/RegistrationPage.js
const { BasePage } = require('./BasePage');

class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = page.locator('input[name="customer.firstName"]');
    this.lastName = page.locator('input[name="customer.lastName"]');
    this.street = page.locator('input[name="customer.address.street"]');
    this.city = page.locator('input[name="customer.address.city"]');
    this.state = page.locator('input[name="customer.address.state"]');
    this.zipCode = page.locator('input[name="customer.address.zipCode"]');
    this.phone = page.locator('input[name="customer.phoneNumber"]');
    this.ssn = page.locator('input[name="customer.ssn"]');
    this.username = page.locator('input[name="customer.username"]');
    this.password = page.locator('input[name="customer.password"]');
    this.confirmPassword = page.locator('#repeatedPassword');
    this.registerButton = page.locator('input[value="Register"]');
    this.fieldErrors = page.locator('#customerForm .error, #customerForm span.error');
  }

  async goto() {
    await this.page.goto('register.htm');
  }

  /**
   * Fills whichever fields are provided (pass '' or omit to leave blank), letting
   * negative-path tests submit intentionally-incomplete/invalid forms.
   */
  async fill(profile) {
    const map = {
      firstName: this.firstName, lastName: this.lastName, street: this.street,
      city: this.city, state: this.state, zipCode: this.zipCode, phone: this.phone,
      ssn: this.ssn, username: this.username, password: this.password,
    };
    for (const [key, locator] of Object.entries(map)) {
      if (profile[key] !== undefined) await locator.fill(String(profile[key]));
    }
    if (profile.confirmPassword !== undefined) {
      await this.confirmPassword.fill(String(profile.confirmPassword));
    } else if (profile.password !== undefined) {
      await this.confirmPassword.fill(String(profile.password));
    }
  }

  async submit() {
    await this.registerButton.click();
  }

  async register(profile) {
    await this.fill(profile);
    await this.submit();
  }

  /** Text shown on successful registration ("Welcome <username>"). */
  welcomeHeading() {
    return this.page.locator('#rightPanel h1.title');
  }
}

module.exports = { RegistrationPage };