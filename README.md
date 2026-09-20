# 🏦 ParaBank Playwright End-to-End Automation Framework

[![Playwright](https://img.shields.io/badge/Playwright-v1.40+-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Page%20Object%20Model-blue)](#-framework-architecture)
[![Report](https://img.shields.io/badge/Report-Interactive%20HTML%20Dashboard-FF5722)](#-reporting--test-execution-dashboard)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](.github/workflows/playwright.yml)

> **Enterprise-grade UI automation test suite** built using **JavaScript** and **Playwright** targeting core online banking workflows on [ParaBank](https://parabank.parasoft.com/parabank/). Built with a modular **Page Object Model (POM)** architecture, dynamic data generation, resilient single-session execution, and executive **HTML test execution dashboards**.

---

## 📌 Table of Contents

- [Executive Summary & Deliverables](#-executive-summary--deliverables)
- [Framework Architecture](#-framework-architecture)
- [Repository Directory Structure](#-repository-directory-structure)
- [Test Coverage & Banking Workflows](#-test-coverage--banking-workflows)
- [Prerequisites & Installation](#-prerequisites--installation)
- [Running Tests](#-running-tests)
- [Reporting & Test Execution Dashboard](#-reporting--test-execution-dashboard)
- [CI/CD Pipeline](#-cicd-pipeline)
- [GitHub Setup & Push Guide](#-github-setup--push-guide)

---

## 🚀 Executive Summary & Deliverables

This repository delivers a complete UI test automation solution designed to validate the reliability, security, and usability of ParaBank:

| Deliverable | Description | Location / Artifact |
| :--- | :--- | :--- |
| **UI Automation Test Cases** | Comprehensive test scenarios covering 13 functional modules and 60+ test cases. | `tests/*.spec.js` |
| **Playwright Test Scripts** | Fast, reliable, auto-waiting test scripts executed via Chromium. | `tests/` |
| **Reusable Components (POM)** | Modular, maintainable Page Object classes encapsulating selectors and business actions. | `pages/*.js` |
| **Dynamic Test Data Generators** | Realistic, collision-free customer persona and transaction generators using `@faker-js/faker`. | `data/data-generators.js` |
| **HTML Test Execution Dashboard** | Interactive executive HTML dashboard visualizing metrics, module pass rates, durations, and logs. | `reporting/`, `test-results/QA_REPORT.html` |
| **CI/CD Integration** | Automated test execution workflow on push and pull requests. | `.github/workflows/playwright.yml` |

---

## 🏗️ Framework Architecture

The framework is structured around the **Page Object Model (POM)** design pattern to ensure scalability, maintainability, and clean separation of concerns:

```
                      ┌─────────────────────────┐
                      │   Playwright Test Suite │
                      │  (Modular / Regression) │
                      └────────────┬────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
  │ Page Object Model │ │ Dynamic Test Data │ │  Shared Helpers   │
  │    (`pages/`)     │ │     (`data/`)     │ │(`tests/helpers/`) │
  └──────────┬────────┘ └───────────────────┘ └───────────────────┘
             │
             ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                   ParaBank Banking Platform                   │
  └───────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 Reports & Visual Dashboards                   │
  │   - Custom Executive HTML Dashboard (`test-results/QA_REPORT.html`)
  │   - Playwright Native HTML Report (`test-results/html-report`) │
  └───────────────────────────────────────────────────────────────┘
```

### Key Technical Highlights
- **Zero Hardcoded Data**: Generates unique usernames, SSNs, phone numbers, and addresses dynamically on every execution to avoid collisions on shared demo databases.
- **Single-Session Regression Strategy**: Runs chained, authenticated workflows within a single session to reduce execution overhead and prevent login rate-limiting.
- **Resilient Selectors**: Utilizes role-based locators, semantic labels, and scoped selectors for flake-resistant execution.
- **Fail-Safe Assertions**: Configured with 20s action and navigation timeouts with automatic screenshot/trace capture on failure.

---

## 📂 Repository Directory Structure

```plaintext
.
├── .github/
│   └── workflows/
│       └── playwright.yml         # GitHub Actions CI workflow configuration
├── data/
│   └── data-generators.js         # Faker-based dynamic persona and transaction data generators
├── pages/                         # Page Object Model (POM) layer
│   ├── BasePage.js                # Base class with global navigation, logout, and error helpers
│   ├── LoginPage.js               # Login form locators and authentication methods
│   ├── RegistrationPage.js        # User onboarding & profile registration actions
│   ├── AccountsOverviewPage.js    # Account summary table and balance validations
│   ├── OpenAccountPage.js         # New Checking/Savings account creation methods
│   ├── TransferFundsPage.js       # Internal account-to-account fund transfer flows
│   ├── BillPayPage.js             # Payee management and payment dispatching
│   ├── FindTransactionsPage.js    # Transaction search by ID, date, amount, and range
│   ├── UpdateContactPage.js       # Profile info updates and field validations
│   ├── RequestLoanPage.js         # Loan application form submission and decision checks
│   └── ParaBankPages.js           # Unified Page Object aggregation barrel
├── reporting/                     # Custom reporting engine
│   ├── generate-html-report.js    # Standalone generator for the executive QA HTML dashboard
│   └── generate-report.js         # Markdown executive summary generator
├── tests/                         # Playwright automated test suites
│   ├── helpers/
│   │   └── shared.js              # Reusable session setup, login helpers, and assertions
│   ├── accounts-overview.spec.js  # Accounts list, balance display, and details tests
│   ├── bill-pay.spec.js           # Bill payment validation and error handling tests
│   ├── find-transactions.spec.js  # Transaction lookup queries and verification
│   ├── login.spec.js              # Valid/invalid credentials and auth validations
│   ├── navigation.spec.js         # Header, footer, and sidebar navigation link verification
│   ├── open-account.spec.js       # Checking vs. Savings account creation flows
│   ├── parabank.spec.js           # Integrated end-to-end customer journey tests
│   ├── registration.spec.js       # User registration, duplicate check, and mandatory fields
│   ├── regression.spec.js         # Complete single-session 60+ test regression suite
│   ├── request-loan.spec.js       # Loan requests, down payments, and approval flows
│   ├── security.spec.js           # Session expiration, SQL injection handling, XSS resistance
│   ├── session.spec.js            # Multi-tab persistence and session state validations
│   ├── transfer-funds.spec.js     # Fund transfer execution and balance consistency
│   ├── ui-usability.spec.js       # Responsive layout, accessibility, and UI standards
│   └── update-contact.spec.js     # Profile editing, invalid phone/zip format validations
├── package.json                   # Project metadata, dependencies, and NPM scripts
├── playwright.config.js           # Global Playwright configuration, reporters, and browser specs
└── README.md                      # Comprehensive project documentation
```

---

## 🧪 Test Coverage & Banking Workflows

The test suite provides end-to-end coverage across the core banking domain:

| Module | Spec File | Primary Test Scenarios |
| :--- | :--- | :--- |
| **User Registration** | `registration.spec.js` | Successful onboarding, mandatory field validation, password mismatch, duplicate username handling. |
| **Authentication** | `login.spec.js` | Valid login, incorrect password, empty credentials, logout flow. |
| **Navigation** | `navigation.spec.js` | Top-bar menu links, sidebar customer links, footer navigation, and page title integrity. |
| **Accounts Overview** | `accounts-overview.spec.js` | Account numbers, available balances, total balance calculation, account details navigation. |
| **Open Account** | `open-account.spec.js` | Opening Checking & Savings accounts, initial deposit verification, new account ID generation. |
| **Transfer Funds** | `transfer-funds.spec.js` | Moving funds between accounts, zero/negative amount validation, confirmation messaging. |
| **Bill Pay** | `bill-pay.spec.js` | Complete payee payment dispatch, required payee field checks, phone/account mismatch. |
| **Find Transactions** | `find-transactions.spec.js` | Search by Transaction ID, search by Date, search by Date Range, search by Amount. |
| **Update Contact Info** | `update-contact.spec.js` | Modifying address, phone number, name; checking persistence across navigation. |
| **Request Loan** | `request-loan.spec.js` | Applying for loans, down payment validation, approval/denial decision status. |
| **Session Management** | `session.spec.js` | Session continuity across multiple pages/tabs, state retention after reload. |
| **Security & Edge Cases** | `security.spec.js` | Unauthorized access to internal URLs, SQL payload inputs, sanitization of special characters. |
| **UI Usability** | `ui-usability.spec.js` | Desktop & viewport rendering, tab key navigation, image loading, and styling integrity. |
| **Master Regression** | `regression.spec.js` | 60+ sequential tests executing all modules in a single, resilient browser session. |

---

## 💻 Prerequisites & Installation

### 1. Prerequisites
- **Node.js**: `v18.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or higher (bundled with Node.js)
- **Git**: Installed and configured on your machine

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd PlaywrightTesting

# Install project dependencies
npm install

# Install Playwright browser binaries
npx playwright install chromium
```

---

## ⚡ Running Tests

The framework includes pre-configured NPM scripts in `package.json` for running both modular and full regression suites:

### 1. Run the Full Regression Suite (Headless)
```bash
npm test
```

### 2. Run with Browser UI Visible (Headed Mode)
```bash
npm run test:headed
```

### 3. Run Specific Feature Modules
```bash
# Registration Suite
npm run test:registration

# Login & Authentication Suite
npm run test:login

# Accounts Overview
npm run test:accounts-overview

# Transfer Funds
npm run test:transfer-funds

# Bill Pay
npm run test:bill-pay

# Loan Requests
npm run test:request-loan

# Security & Edge Cases
npm run test:security
```

---

## 📊 Reporting & Test Execution Dashboard

The framework provides two distinct reporting solutions for test visualization:

### 1. Custom Executive HTML Test Execution Dashboard
A custom-built, interactive dashboard designed for QA leads and stakeholders:
- **KPI Metrics Cards**: Total Tests, Passed, Failed, Flaky, Duration, and Overall Pass Rate.
- **Module Category Breakdown**: Granular status per banking workflow.
- **Interactive Test Grid**: Live status filtering (All / Passed / Failed), search by keyword, and collapsible test step logs.
- **Execution Timeline**: Visual breakdown of execution time across test suites.

```bash
# Generate the custom executive HTML dashboard from the latest results
npm run report:html

# Open test-results/QA_REPORT.html in your browser
```

### 2. Standard Playwright HTML Report
Includes step-by-step traces, failure screenshots, and DOM snapshots:
```bash
# Open the standard Playwright report
npm run test:report
```

---

## 🔄 CI/CD Pipeline

Automated continuous integration is pre-configured via **GitHub Actions** (`.github/workflows/playwright.yml`):
- **Triggers**: Runs on every `push` and `pull_request` against `main`/`master`.
- **Environment**: Ubuntu Linux with Node LTS.
- **Artifacts**: Automatically uploads `playwright-report` artifacts on test failure or completion (retained for 30 days).

---

## 📤 GitHub Setup & Push Guide

To push this local repository to a new repository on your GitHub account, run the following commands in your terminal:

```bash
# 1. Initialize git repository in this folder
git init

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: complete ParaBank Playwright UI automation suite with POM and HTML reporting"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 👨‍💻 Author & Maintenance
- **Prepared by**: Ayyan Zia
- **Domain**: ParaBank Banking Automation
- **Framework**: Playwright / JavaScript (ES6+ / CommonJS)
- **Design Pattern**: Page Object Model (POM)
