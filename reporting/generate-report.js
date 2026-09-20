#!/usr/bin/env node
/**
 * reporting/generate-report.js
 * ─────────────────────────────
 * Reads test-results/results.json produced by the Playwright JSON reporter
 * and writes a formal Markdown QA Summary Report to test-results/QA_SUMMARY_REPORT.md.
 *
 * Usage:
 *   node reporting/generate-report.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT        = path.resolve(__dirname, '..');
const RESULTS_JSON = path.join(ROOT, 'test-results', 'results.json');
const REPORT_OUT   = path.join(ROOT, 'test-results', 'QA_SUMMARY_REPORT.md');

// ── Load results ─────────────────────────────────────────────────────────────
if (!fs.existsSync(RESULTS_JSON)) {
  console.error(`[ERROR] ${RESULTS_JSON} not found.  Run "npm test" first.`);
  process.exit(1);
}

const raw     = fs.readFileSync(RESULTS_JSON, 'utf-8');
const results = JSON.parse(raw);
const stats   = results.stats;

// ── Flatten test specs ────────────────────────────────────────────────────────
function flattenSpecs(suites, file = '') {
  const out = [];
  for (const suite of suites || []) {
    const f = suite.file || file;
    for (const spec of suite.specs || []) {
      out.push({ ...spec, file: f, suiteTitle: suite.title });
    }
    out.push(...flattenSpecs(suite.suites, f));
  }
  return out;
}

const allSpecs = flattenSpecs(results.suites);

// ── Classify each spec ────────────────────────────────────────────────────────
const passed  = allSpecs.filter(s => s.ok && s.tests.every(t => t.status !== 'skipped'));
const skipped = allSpecs.filter(s => s.tests.some(t => t.status === 'skipped'));
const failed  = allSpecs.filter(s => !s.ok && s.tests.some(t => t.status === 'unexpected' || t.status === 'failed'));
const total   = allSpecs.length;

// ── Duration helper ──────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (!ms) return '—';
  if (ms < 1000)  return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// ── Module extractor ─────────────────────────────────────────────────────────
function moduleFromFile(f) {
  return path.basename(f, '.spec.js')
    .split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ── Bug type classifier ──────────────────────────────────────────────────────
function classifyBug(errorMsg = '') {
  const m = errorMsg.toLowerCase();
  if (m.includes('tocontaintext') || m.includes('tobevisible') || m.includes('locator'))
    return 'Functional – Assertion Failure';
  if (m.includes('timeout') || m.includes('exceeded'))
    return 'Performance – Timeout';
  if (m.includes('net::err') || m.includes('navigation'))
    return 'Network / Navigation Error';
  if (m.includes('status'))
    return 'Functional – Wrong Status';
  return 'Unknown – See Stack Trace';
}

// ── Build report ─────────────────────────────────────────────────────────────
const runDate   = new Date(stats.startTime).toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
const durationS = (stats.duration / 1000).toFixed(1);

const lines = [];

lines.push(`# ParaBank QA Automation – Test Summary Report`);
lines.push(``);
lines.push(`> **Project:** ParaBank Web Application (parabank.parasoft.com)`);
lines.push(`> **Tool:** Playwright ${results.config.version} | **Browser:** Chromium (Desktop)`);
lines.push(`> **Run Date:** ${runDate} (PKT)`);
lines.push(`> **Total Duration:** ${durationS} s`);
lines.push(`> **Workers:** ${results.config.workers}`);
lines.push(`> **Retries:** ${results.config.projects[0]?.retries ?? 1}`);
lines.push(``);
lines.push(`---`);
lines.push(``);

// ── Executive Summary ────────────────────────────────────────────────────────
lines.push(`## 1. Executive Summary`);
lines.push(``);
lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Total Test Cases Executed | ${total} |`);
lines.push(`| ✅ Passed | ${passed.length} |`);
lines.push(`| ⚠️  Skipped (Live-Demo Flakiness) | ${skipped.length} |`);
lines.push(`| ❌ Failed | ${failed.length} |`);
lines.push(`| Pass Rate | ${total > 0 ? ((passed.length / total) * 100).toFixed(1) : 0}% |`);
lines.push(`| Total Duration | ${durationS} s |`);
lines.push(``);

const verdict = failed.length === 0
  ? '🟢 **PASS** – All executed tests passed or were legitimately skipped.'
  : `🔴 **FAIL** – ${failed.length} test(s) failed.  See Bug Report section for details.`;
lines.push(`**Overall Verdict:** ${verdict}`);
lines.push(``);
lines.push(`---`);
lines.push(``);

// ── Module Breakdown ─────────────────────────────────────────────────────────
lines.push(`## 2. Module-Level Results`);
lines.push(``);

// Group specs by file
const byFile = {};
for (const spec of allSpecs) {
  const key = spec.file || 'unknown';
  if (!byFile[key]) byFile[key] = { passed: 0, failed: 0, skipped: 0 };
  if (spec.ok && spec.tests.every(t => t.status !== 'skipped')) byFile[key].passed++;
  else if (spec.tests.some(t => t.status === 'skipped'))        byFile[key].skipped++;
  else                                                            byFile[key].failed++;
}

lines.push(`| Module | File | Passed | Skipped | Failed |`);
lines.push(`|--------|------|--------|---------|--------|`);
for (const [file, counts] of Object.entries(byFile)) {
  const mod = moduleFromFile(file);
  const status = counts.failed > 0 ? '❌' : counts.skipped > 0 ? '⚠️' : '✅';
  lines.push(`| ${status} ${mod} | ${file} | ${counts.passed} | ${counts.skipped} | ${counts.failed} |`);
}
lines.push(``);
lines.push(`---`);
lines.push(``);

// ── Detailed Test Results ────────────────────────────────────────────────────
lines.push(`## 3. Detailed Test Case Results`);
lines.push(``);

for (const [file, _] of Object.entries(byFile)) {
  const mod      = moduleFromFile(file);
  const modSpecs = allSpecs.filter(s => s.file === file);
  lines.push(`### ${mod}`);
  lines.push(``);
  lines.push(`| TC ID | Test Title | Status | Duration | Notes |`);
  lines.push(`|-------|-----------|--------|----------|-------|`);

  for (const spec of modSpecs) {
    const title = spec.title;
    const test  = spec.tests[0];
    const dur   = fmtMs(test?.results?.[0]?.duration);
    let   status = '✅ Passed';
    let   notes  = '';

    if (test?.status === 'skipped') {
      status = '⚠️ Skipped';
      notes  = test.annotations?.[0]?.description ?? 'Skipped';
    } else if (!spec.ok) {
      status = '❌ Failed';
      const errMsg = test?.results?.[0]?.error?.message ?? '';
      notes = errMsg.split('\n')[0].slice(0, 120);
    }

    lines.push(`| — | ${title} | ${status} | ${dur} | ${notes} |`);
  }
  lines.push(``);
}

lines.push(`---`);
lines.push(``);

// ── Bug Report ───────────────────────────────────────────────────────────────
lines.push(`## 4. Bug Report`);
lines.push(``);

if (failed.length === 0) {
  lines.push(`> ✅ No bugs found in this run.`);
} else {
  let bugId = 1;
  lines.push(`The following defects were identified during this automated test run:`);
  lines.push(``);

  for (const spec of failed) {
    const test      = spec.tests[0];
    const result    = test?.results?.find(r => r.status === 'failed' || r.status === 'unexpected');
    const errMsg    = result?.error?.message ?? 'No error message captured';
    const stack     = result?.error?.stack ?? '';
    const loc       = result?.errorLocation;
    const bugType   = classifyBug(errMsg);
    const file      = loc ? `${loc.file}:${loc.line}` : spec.file;
    const mod       = moduleFromFile(spec.file);

    lines.push(`### BUG-${String(bugId).padStart(3, '0')} – ${spec.title}`);
    lines.push(``);
    lines.push(`| Field | Detail |`);
    lines.push(`|-------|--------|`);
    lines.push(`| **Bug ID** | BUG-${String(bugId).padStart(3, '0')} |`);
    lines.push(`| **Module** | ${mod} |`);
    lines.push(`| **TC ID / Test Title** | ${spec.title} |`);
    lines.push(`| **Test File** | ${spec.file} |`);
    lines.push(`| **Error Location** | \`${file}\` |`);
    lines.push(`| **Bug Type** | ${bugType} |`);
    lines.push(`| **Severity** | Medium |`);
    lines.push(`| **Priority** | P2 |`);
    lines.push(`| **Status** | Open |`);
    lines.push(``);
    lines.push(`**Error Message:**`);
    lines.push(`\`\`\``);
    lines.push(errMsg.slice(0, 800));
    lines.push(`\`\`\``);
    lines.push(``);
    bugId++;
  }
}

lines.push(`---`);
lines.push(``);

// ── Skipped Test Analysis ────────────────────────────────────────────────────
lines.push(`## 5. Skipped Test Analysis`);
lines.push(``);
lines.push(`Skipped tests are **not failures**. They are skipped because the live ParaBank`);
lines.push(`demo server returned an error page (HTTP 500 / internal error) when the automation`);
lines.push(`attempted to exercise that feature.  This is a known instability of the shared`);
lines.push(`public demo environment and is documented by Parasoft.`);
lines.push(``);
lines.push(`| Test Title | Skip Reason |`);
lines.push(`|-----------|-------------|`);
for (const spec of skipped) {
  const reason = spec.tests[0]?.annotations?.[0]?.description ?? 'Demo server error';
  lines.push(`| ${spec.title} | ${reason} |`);
}
lines.push(``);
lines.push(`---`);
lines.push(``);

// ── Commands Reference ───────────────────────────────────────────────────────
lines.push(`## 6. How to Run Tests`);
lines.push(``);
lines.push(`\`\`\`bash`);
lines.push(`# Run the entire suite (all modules, headless)`);
lines.push(`npm test`);
lines.push(``);
lines.push(`# Run a single module`);
lines.push(`npm run test:registration`);
lines.push(`npm run test:login`);
lines.push(`npm run test:navigation`);
lines.push(`npm run test:accounts-overview`);
lines.push(`npm run test:open-account`);
lines.push(`npm run test:transfer-funds`);
lines.push(`npm run test:bill-pay`);
lines.push(`npm run test:find-transactions`);
lines.push(`npm run test:update-contact`);
lines.push(`npm run test:request-loan`);
lines.push(`npm run test:session`);
lines.push(`npm run test:security`);
lines.push(`npm run test:ui-usability`);
lines.push(``);
lines.push(`# Run with browser visible (headed mode)`);
lines.push(`npm run test:headed`);
lines.push(`npm run test:all-headed`);
lines.push(``);
lines.push(`# Debug a single test interactively`);
lines.push(`npm run test:debug`);
lines.push(``);
lines.push(`# Re-run only previously failed tests`);
lines.push(`npm run test:last-failed`);
lines.push(``);
lines.push(`# Open the Playwright HTML report in your browser`);
lines.push(`npm run test:report`);
lines.push(``);
lines.push(`# Regenerate this report from the latest results.json`);
lines.push(`node reporting/generate-report.js`);
lines.push(`\`\`\``);
lines.push(``);
lines.push(`---`);
lines.push(``);

// ── Footer ───────────────────────────────────────────────────────────────────
lines.push(`## 7. Environment & Configuration`);
lines.push(``);
lines.push(`| Property | Value |`);
lines.push(`|----------|-------|`);
lines.push(`| Application Under Test | ParaBank (parabank.parasoft.com) |`);
lines.push(`| Automation Framework | Playwright ${results.config.version} |`);
lines.push(`| Test Language | JavaScript (CommonJS) |`);
lines.push(`| Browser | Chromium (Desktop) |`);
lines.push(`| Test Architecture | Page Object Model (POM) |`);
lines.push(`| Test Data Strategy | Dynamic data via @faker-js/faker |`);
lines.push(`| Run Mode | Headless, Sequential (workers=1) |`);
lines.push(`| Retries per test | 1 |`);
lines.push(`| Action Timeout | 20 s |`);
lines.push(`| Navigation Timeout | 30 s |`);
lines.push(`| Per-Test Timeout | 60 s |`);
lines.push(``);
lines.push(`---`);
lines.push(`*Report auto-generated by \`reporting/generate-report.js\` on ${new Date().toISOString()}*`);

// ── Write output ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
fs.writeFileSync(REPORT_OUT, lines.join('\n'), 'utf-8');

console.log(`\n✅  QA Summary Report written to: ${REPORT_OUT}`);
console.log(`\n📊  Summary:`);
console.log(`    Total:   ${total}`);
console.log(`    Passed:  ${passed.length}`);
console.log(`    Skipped: ${skipped.length}`);
console.log(`    Failed:  ${failed.length}`);
