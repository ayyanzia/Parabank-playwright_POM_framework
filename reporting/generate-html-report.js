#!/usr/bin/env node
/**
 * reporting/generate-html-report.js
 * ──────────────────────────────────
 * Reads test-results/results.json and produces test-results/QA_REPORT.html
 * with a fully self-contained, styled, interactive HTML report.
 *
 * Usage:  node reporting/generate-html-report.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const RESULTS_JSON = path.join(ROOT, 'test-results', 'results.json');
const REPORT_OUT   = path.join(ROOT, 'test-results', 'QA_REPORT.html');

if (!fs.existsSync(RESULTS_JSON)) { console.error('[ERROR] results.json not found. Run "npm test" first.'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));

// ── flatten helpers ──────────────────────────────────────────────────────────
function flattenSpecs(suites, file = '') {
  const out = [];
  for (const s of suites || []) {
    const f = s.file || file;
    for (const sp of s.specs || []) out.push({ ...sp, file: f, suite: s.title });
    out.push(...flattenSpecs(s.suites, f));
  }
  return out;
}
const specs   = flattenSpecs(data.suites);
const passed  = specs.filter(s => s.ok && s.tests.every(t => t.status !== 'skipped'));
const skipped = specs.filter(s => s.tests.some(t => t.status === 'skipped'));
const failed  = specs.filter(s => !s.ok && s.tests.some(t => t.status === 'unexpected' || t.status === 'failed'));
const total   = specs.length;

// group by file
const byFile = {};
for (const sp of specs) {
  const k = sp.file || 'unknown';
  if (!byFile[k]) byFile[k] = { passed: 0, failed: 0, skipped: 0, specs: [] };
  byFile[k].specs.push(sp);
  if (sp.ok && sp.tests.every(t => t.status !== 'skipped')) byFile[k].passed++;
  else if (sp.tests.some(t => t.status === 'skipped'))       byFile[k].skipped++;
  else                                                         byFile[k].failed++;
}

function moduleFromFile(f) {
  return path.basename(f, '.spec.js').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
function fmtMs(ms) { return ms == null ? '—' : ms < 1000 ? `${ms}ms` : ms < 60000 ? `${(ms/1000).toFixed(1)}s` : `${Math.floor(ms/60000)}m ${Math.round((ms%60000)/1000)}s`; }
function classifyBug(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('tocontaintext') || m.includes('tobevisible') || m.includes('locator')) return 'Functional — Assertion Failure';
  if (m.includes('timeout') || m.includes('exceeded')) return 'Performance — Timeout';
  if (m.includes('net::err') || m.includes('navigation')) return 'Network / Navigation Error';
  return 'Unknown — See Trace';
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// strip ANSI codes
function stripAnsi(s) { return (s||'').replace(/\x1b\[\d+m/g, ''); }

const runDate = new Date(data.stats.startTime).toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
const durS    = (data.stats.duration / 1000).toFixed(1);
const passRate = total > 0 ? ((passed.length / total) * 100).toFixed(1) : '0';

// ── build HTML ───────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ParaBank QA Automation — Test Report</title>
<style>
  :root{--bg:#0f172a;--card:#1e293b;--border:#334155;--text:#e2e8f0;--muted:#94a3b8;
        --pass:#22c55e;--fail:#ef4444;--skip:#f59e0b;--accent:#3b82f6;--accent2:#8b5cf6}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter','Segoe UI',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;padding:20px 40px}
  h1{font-size:28px;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
  h2{font-size:20px;font-weight:600;color:var(--accent);margin:32px 0 12px;border-bottom:1px solid var(--border);padding-bottom:6px}
  h3{font-size:16px;font-weight:600;color:var(--accent2);margin:20px 0 8px}
  .subtitle{color:var(--muted);font-size:13px;margin-bottom:24px}
  .cards{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;min-width:160px;flex:1}
  .card .value{font-size:32px;font-weight:700}
  .card .label{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-top:4px}
  .card.pass .value{color:var(--pass)} .card.fail .value{color:var(--fail)} .card.skip .value{color:var(--skip)}
  .bar{height:28px;border-radius:14px;overflow:hidden;display:flex;margin-bottom:24px;background:var(--card);border:1px solid var(--border)}
  .bar>div{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;transition:.3s}
  .bar .p{background:var(--pass)} .bar .f{background:var(--fail)} .bar .s{background:var(--skip)}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px}
  th{background:var(--card);color:var(--accent);text-align:left;padding:10px 12px;border-bottom:2px solid var(--border);position:sticky;top:0}
  td{padding:8px 12px;border-bottom:1px solid var(--border);vertical-align:top}
  tr:hover td{background:rgba(59,130,246,.06)}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase}
  .badge.pass{background:rgba(34,197,94,.15);color:var(--pass)} .badge.fail{background:rgba(239,68,68,.15);color:var(--fail)}
  .badge.skip{background:rgba(245,158,11,.15);color:var(--skip)} .badge.flaky{background:rgba(139,92,246,.15);color:var(--accent2)}
  .module-header{display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 0}
  .module-header:hover{opacity:.85}
  details summary{list-style:none;cursor:pointer} details summary::-webkit-details-marker{display:none}
  details summary::before{content:'▶ ';font-size:12px;color:var(--accent)} details[open] summary::before{content:'▼ '}
  .bug-card{background:var(--card);border-left:3px solid var(--fail);border-radius:0 8px 8px 0;padding:16px;margin-bottom:16px}
  .bug-card h4{color:var(--fail);margin-bottom:8px}
  .bug-card pre{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:10px;font-size:12px;overflow-x:auto;white-space:pre-wrap;color:var(--muted);max-height:200px}
  .meta-table td:first-child{font-weight:600;color:var(--muted);width:180px}
  .verdict{display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:700;margin-top:8px}
  .verdict.pass{background:rgba(34,197,94,.15);color:var(--pass)} .verdict.fail{background:rgba(239,68,68,.15);color:var(--fail)}
  .footer{text-align:center;color:var(--muted);font-size:11px;margin-top:40px;padding:16px;border-top:1px solid var(--border)}
  @media(max-width:768px){body{padding:12px} .cards{flex-direction:column}}
</style>
</head>
<body>

<h1>ParaBank QA Automation — Test Report</h1>
<p class="subtitle">
  Playwright ${esc(data.config?.version || '1.x')} &nbsp;|&nbsp; Chromium (Desktop) &nbsp;|&nbsp;
  ${esc(runDate)} (PKT) &nbsp;|&nbsp; Duration: ${durS}s &nbsp;|&nbsp; Workers: ${data.config?.workers ?? 1}
</p>

<!-- ── Executive Summary ────────────────────────────────────────────────── -->
<h2>📊 Executive Summary</h2>
<div class="cards">
  <div class="card"><div class="value">${total}</div><div class="label">Total Tests</div></div>
  <div class="card pass"><div class="value">${passed.length}</div><div class="label">Passed</div></div>
  <div class="card skip"><div class="value">${skipped.length}</div><div class="label">Skipped</div></div>
  <div class="card fail"><div class="value">${failed.length}</div><div class="label">Failed</div></div>
  <div class="card"><div class="value">${passRate}%</div><div class="label">Pass Rate</div></div>
</div>
<div class="bar">
  <div class="p" style="width:${passRate}%">${passed.length} passed</div>
  <div class="s" style="width:${total>0?((skipped.length/total)*100).toFixed(1):0}%">${skipped.length} skip</div>
  <div class="f" style="width:${total>0?((failed.length/total)*100).toFixed(1):0}%">${failed.length} fail</div>
</div>
<div class="verdict ${failed.length===0?'pass':'fail'}">
  ${failed.length===0 ? '✅ PASS — All executed tests passed.' : `❌ FAIL — ${failed.length} test(s) failed. See Bug Report below.`}
</div>

<!-- ── Module Breakdown ─────────────────────────────────────────────────── -->
<h2>📦 Module-Level Results</h2>
<table>
<thead><tr><th>#</th><th>Module</th><th>File</th><th>✅ Passed</th><th>⚠️ Skipped</th><th>❌ Failed</th><th>Verdict</th></tr></thead>
<tbody>
${Object.entries(byFile).map(([f,c],i) => {
  const mod = moduleFromFile(f);
  const v = c.failed>0?'fail':c.skipped>0?'skip':'pass';
  return `<tr><td>${i+1}</td><td>${esc(mod)}</td><td>${esc(f)}</td><td>${c.passed}</td><td>${c.skipped}</td><td>${c.failed}</td><td><span class="badge ${v}">${v==='pass'?'PASS':v==='skip'?'PARTIAL':'FAIL'}</span></td></tr>`;
}).join('\n')}
</tbody>
</table>

<!-- ── Detailed Results ─────────────────────────────────────────────────── -->
<h2>📋 Detailed Test Case Results</h2>
${Object.entries(byFile).map(([f,c]) => {
  const mod = moduleFromFile(f);
  return `<details><summary><strong>${esc(mod)}</strong> &nbsp; (${c.passed}✅ ${c.skipped}⚠️ ${c.failed}❌)</summary>
<table>
<thead><tr><th>Test Title</th><th>Status</th><th>Duration</th><th>Notes</th></tr></thead>
<tbody>
${c.specs.map(sp => {
  const t = sp.tests[0];
  const dur = fmtMs(t?.results?.[0]?.duration);
  let badge = 'pass', label = 'Passed', notes = '';
  if (t?.status === 'skipped') { badge = 'skip'; label = 'Skipped'; notes = esc(t.annotations?.[0]?.description ?? 'Skipped'); }
  else if (!sp.ok) { badge = 'fail'; label = 'Failed'; notes = esc(stripAnsi(t?.results?.[0]?.error?.message ?? '').split('\\n')[0].slice(0,120)); }
  return `<tr><td>${esc(sp.title)}</td><td><span class="badge ${badge}">${label}</span></td><td>${dur}</td><td>${notes}</td></tr>`;
}).join('\n')}
</tbody></table></details>`;
}).join('\n')}

<!-- ── Bug Report ───────────────────────────────────────────────────────── -->
<h2>🐛 Bug Report</h2>
${failed.length===0 ? '<p style="color:var(--pass)">✅ No bugs found in this run.</p>' :
  failed.map((sp,i) => {
    const t = sp.tests[0];
    const res = t?.results?.find(r => r.status==='failed' || r.status==='unexpected');
    const errMsg = stripAnsi(res?.error?.message ?? 'No error captured');
    const bugType = classifyBug(errMsg);
    const mod = moduleFromFile(sp.file);
    return `<div class="bug-card">
<h4>BUG-${String(i+1).padStart(3,'0')} — ${esc(sp.title)}</h4>
<table class="meta-table">
<tr><td>Module</td><td>${esc(mod)}</td></tr>
<tr><td>File</td><td>${esc(sp.file)}</td></tr>
<tr><td>Bug Type</td><td>${esc(bugType)}</td></tr>
<tr><td>Severity</td><td>Medium</td></tr>
<tr><td>Priority</td><td>P2</td></tr>
<tr><td>Status</td><td>Open</td></tr>
</table>
<pre>${esc(errMsg.slice(0,800))}</pre>
</div>`;
  }).join('\n')
}

<!-- ── Skipped Analysis ─────────────────────────────────────────────────── -->
<h2>⚠️ Skipped Test Analysis</h2>
${skipped.length===0 ? '<p>No tests were skipped.</p>' : `
<p style="color:var(--muted);margin-bottom:12px">Skipped tests are defensively skipped when the live ParaBank demo server returns error pages or missing UI elements.</p>
<table>
<thead><tr><th>Test Title</th><th>Skip Reason</th></tr></thead>
<tbody>
${skipped.map(sp => {
  const reason = sp.tests[0]?.annotations?.[0]?.description ?? 'Demo server error';
  return `<tr><td>${esc(sp.title)}</td><td>${esc(reason)}</td></tr>`;
}).join('\n')}
</tbody></table>`}

<!-- ── Environment ──────────────────────────────────────────────────────── -->
<h2>⚙️ Environment & Configuration</h2>
<table class="meta-table">
<tr><td>Application</td><td>ParaBank (parabank.parasoft.com)</td></tr>
<tr><td>Framework</td><td>Playwright ${esc(data.config?.version || '1.x')}</td></tr>
<tr><td>Language</td><td>JavaScript (CommonJS)</td></tr>
<tr><td>Browser</td><td>Chromium (Desktop Chrome)</td></tr>
<tr><td>Architecture</td><td>Single shared page per module (regression mode)</td></tr>
<tr><td>Test Data</td><td>Dynamic — @faker-js/faker</td></tr>
<tr><td>Workers</td><td>${data.config?.workers ?? 1} (serial)</td></tr>
<tr><td>Retries</td><td>0 (shared session)</td></tr>
<tr><td>Total Tests</td><td>${total}</td></tr>
</table>

<div class="footer">
  ParaBank QA Automation Report &nbsp;|&nbsp; Generated ${new Date().toISOString()} &nbsp;|&nbsp; Playwright Test Suite v2.0
</div>

</body></html>`;

fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
fs.writeFileSync(REPORT_OUT, html, 'utf-8');
console.log(`\\n✅  HTML Report: ${REPORT_OUT}`);
console.log(`    Total: ${total}  |  Passed: ${passed.length}  |  Skipped: ${skipped.length}  |  Failed: ${failed.length}`);
