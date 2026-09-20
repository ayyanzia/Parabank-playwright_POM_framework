// utils/data-generators.js
// Generates random-but-valid test data for each ParaBank module using @faker-js/faker,
// so every test run exercises the app with a fresh dataset instead of hard-coded values.
const { faker } = require('@faker-js/faker');

/** A fresh, valid registration profile (persona) with a guaranteed-unique username. */
function randomPersona() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const password = `Qa${faker.string.alphanumeric({ length: 6 })}#1`;
  return {
    firstName,
    lastName,
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
    phone: faker.string.numeric(10),
    ssn: `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,
    // Timestamp suffix guarantees a unique username on every run against the shared demo DB.
    username: `qa_${faker.internet.username().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${Date.now().toString().slice(-6)}`,
    password,
  };
}

/** A random valid dollar amount, e.g. for transfers/bill pay/loans, within a realistic band. */
function randomAmount(min = 5, max = 500) {
  return faker.finance.amount({ min, max, dec: 2 });
}

/** A random valid bill-pay payee. */
function randomPayee() {
  return {
    name: faker.company.name().slice(0, 20),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
    phone: faker.string.numeric(10),
    accountNumber: faker.string.numeric(8),
  };
}

/** A random malformed/invalid string for negative-path testing (not SQL/exploit payloads). */
function randomInvalidText() {
  return faker.helpers.arrayElement(['1234', 'abcd!!', '####', '   ', 'N/A-??']);
}

module.exports = { randomPersona, randomAmount, randomPayee, randomInvalidText, faker };