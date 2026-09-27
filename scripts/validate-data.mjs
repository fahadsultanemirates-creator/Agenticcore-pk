// Checks data/services.json and data/packages.json against the pricing PDF's
// own totals, so a typo in a transcribed price can't silently change what
// the site shows. Run: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../js/catalog-core.js');

const services = JSON.parse(readFileSync(new URL('../data/services.json', import.meta.url))).services;
const packages = JSON.parse(readFileSync(new URL('../data/packages.json', import.meta.url))).packages;

const errors = [];
const lines = core.indexLines(services);

// 56 services, numbered 1..56 exactly once, each with at least one price line.
const nos = services.map((s) => s.no).sort((a, b) => a - b);
if (nos.length !== 56 || nos.some((n, i) => n !== i + 1)) errors.push('Service numbers must be exactly 1..56, got: ' + nos.join(','));
const ids = new Set();
for (const s of services) {
  if (!s.lines.length) errors.push(`Service ${s.no} has no price lines`);
  if (!(s.group >= 1 && s.group <= 8)) errors.push(`Service ${s.no} has bad group ${s.group}`);
  for (const l of s.lines) {
    if (ids.has(l.id)) errors.push('Duplicate line id ' + l.id);
    ids.add(l.id);
    if (!['dfy', 'setup', 'monthly'].includes(l.model)) errors.push(`Line ${l.id} bad model ${l.model}`);
    if (!(l.price > 0)) errors.push(`Line ${l.id} bad price`);
    if (!l.id.startsWith(s.no + '-')) errors.push(`Line ${l.id} not prefixed with service ${s.no}`);
  }
}

for (const p of packages) {
  const t = core.packageTotals(p, lines);
  const e = p.expected;
  const check = (label, got, want) => { if (want !== undefined && got !== want) errors.push(`${p.name}: ${label} = ${got}, PDF says ${want}`); };
  check('monthly bought separately', t.monthlySeparately, e.monthly_separately);
  check('set-up bought separately', t.setupSeparately, e.setup_separately);
  check('monthly saving', t.monthlySaving, e.monthly_saving);
  check('monthly saving %', t.monthlySavingPct, e.monthly_saving_pct);
  check('set-up saving', t.setupSaving, e.setup_saving);
  check('set-up saving %', t.setupSavingPct, e.setup_saving_pct);
  for (const it of [...(p.monthly_items || []), ...(p.setup_items || [])]) {
    if (it.service && lines[it.line] && lines[it.line].service.no !== it.service) errors.push(`${p.name}: item "${it.label}" line ${it.line} is not service ${it.service}`);
  }
}

if (errors.length) {
  console.error('Data validation FAILED:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log(`OK: ${services.length} services, ${ids.size} price lines, ${packages.length} packages; all package totals match the pricing PDF.`);
