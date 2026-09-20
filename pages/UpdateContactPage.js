// pages/UpdateContactPage.js
const { BasePage } = require('./BasePage');

class UpdateContactPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = page.locator('input[name="customer.firstName"]');
    this.lastName = page.locator('input[name="customer.lastName"]');
    this.street = page.locator('input[name="customer.address.street"]');
    this.city = page.locator('input[name="customer.address.city"]');
    this.state = page.locator('input[name="customer.address.state"]');
    this.zipCode = page.locator('input[name="customer.address.zipCode"]');
    this.phone = page.locator('input[name="customer.phoneNumber"]');
    this.updateButton = page.locator('input[value="Update Profile"]');
    this.confirmationHeading = page.locator('#updateProfileResult h1.title, #rightPanel h1.title').first();
    this.fieldErrors = page.locator('#updateProfileForm .error, #updateProfileForm span.error');
  }

  async goto() {
    await this.page.goto('updateprofile.htm');
  }

  async update(profile = {}) {
    const map = {
      firstName: this.firstName, lastName: this.lastName, street: this.street,
      city: this.city, state: this.state, zipCode: this.zipCode, phone: this.phone,
    };
    for (const [key, locator] of Object.entries(map)) {
      if (profile[key] !== undefined) {
        await locator.fill('');
        await locator.fill(String(profile[key]));
      }
    }
    await this.updateButton.click();
  }
}

module.exports = { UpdateContactPage };