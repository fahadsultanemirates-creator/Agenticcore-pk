// Catalogue V2 checks for data/services.json and data/packages.json, so a typo
// in a price, a missing Urdu field or a broken reference can't reach the site
// (or the server-side price table generated from these files).
// Run: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../js/catalog-core.js');

const S = JSON.parse(readFileSync(new URL('../data/services.json', import.meta.url)));
const P = JSON.parse(readFileSync(new URL('../data/packages.json', import.meta.url)));
const services = S.services, packages = P.packages;
const errors = [];
const lines = core.indexLines(services);
const rs = (n) => 'Rs ' + n.toLocaleString('en-US');

// Services: numbered 1..N exactly once, in one of the 4 sections, EN + UR text everywhere.
const nos = services.map((s) => s.no).sort((a, b) => a - b);
if (nos.some((n, i) => n !== i + 1)) errors.push('Service numbers must be 1..' + nos.length + ' exactly once');
const groupNos = new Set(S.groups.map((g) => g.no));
const ids = new Set();
const retired = new Set(S.meta.retired_lines || []);
for (const s of services) {
  if (!groupNos.has(s.group)) errors.push(`Service ${s.no} has unknown group ${s.group}`);
  for (const f of ['name', 'name_ur', 'brief', 'brief_ur', 'delivery', 'delivery_ur']) if (!s[f]) errors.push(`Service ${s.no} is missing ${f}`);
  if (!s.lines.length) errors.push(`Service ${s.no} has no price lines`);
  for (const l of s.lines) {
    if (ids.has(l.id)) errors.push('Duplicate line id ' + l.id);
    ids.add(l.id);
    if (retired.has(l.id)) errors.push(`Line ${l.id} is listed as retired but still used`);
    if (!/^[a-z0-9-]+$/.test(l.id)) errors.push(`Line ${l.id} has a bad id`);
    if (!['dfy', 'setup', 'monthly'].includes(l.model)) errors.push(`Line ${l.id} bad model ${l.model}`);
    if (!(Number.isInteger(l.price) && l.price > 0)) errors.push(`Line ${l.id} bad price`);
    for (const f of ['unit', 'unit_ur', 'text', 'text_ur']) if (!l[f]) errors.push(`Line ${l.id} is missing ${f}`);
    // the visible text must carry the line's own price, so the two can never drift apart
    if (l.text && !l.text.includes(rs(l.price))) errors.push(`Line ${l.id} text does not show ${rs(l.price)}`);
    if (l.text_ur && !l.text_ur.includes(rs(l.price))) errors.push(`Line ${l.id} Urdu text does not show ${rs(l.price)}`);
    if (l.from && !/^From |سے/.test(l.text + ' ' + l.text_ur)) errors.push(`Line ${l.id} is a "from" price but its text doesn't say so`);
    if (!l.from && /^From /.test(l.text)) errors.push(`Line ${l.id} text says "From" but the line is not marked from`);
    if (l.included && !l.included_ur) errors.push(`Line ${l.id} included text has no Urdu`);
    if (l.runs && !l.runs_ur) errors.push(`Line ${l.id} running-cost text has no Urdu`);
    if (l.runs && /Rs\s?[0-9]|US\$|€/.test(l.runs)) errors.push(`Line ${l.id} hard-codes a third-party price`);
  }
}

// Packages: every referenced line exists; quote-only packages are never sold at a fixed set-up price;
// no "bought separately" savings maths is shown in V2.
const pkgIds = new Set();
for (const p of packages) {
  if (pkgIds.has(p.id)) errors.push('Duplicate package ' + p.id);
  pkgIds.add(p.id);
  for (const f of ['name', 'name_ur', 'for', 'for_ur', 'delivery', 'delivery_ur', 'delivery_short', 'delivery_short_ur', 'paid_separately', 'paid_separately_ur']) if (!p[f]) errors.push(`${p.id}: missing ${f}`);
  const hasMonthly = Number.isInteger(p.monthly), hasOneOff = Number.isInteger(p.one_off);
  if (hasMonthly === hasOneOff) errors.push(`${p.id}: needs exactly one of monthly / one_off`);
  if (hasMonthly && !(p.min_months > 0)) errors.push(`${p.id}: monthly packages need a minimum term`);
  if (p.quote_only && (p.setup || !p.setup_quoted)) errors.push(`${p.id}: quote-only packages must have a quoted (not fixed) set-up`);
  if (p.expected || (p.monthly_items || []).length) errors.push(`${p.id}: V2 packages are sold on output, not on calculated savings`);
  for (const it of p.includes || []) if (!it.label || !it.label_ur) errors.push(`${p.id}: include without EN/UR label`);
  for (const it of p.setup_items || []) if (it.line && !lines[it.line]) errors.push(`${p.id}: set-up item → unknown line ${it.line}`);
  for (const a of p.allowances || []) {
    if (!(a.qty > 0) || !a.label || !a.label_ur) errors.push(`${p.id}: bad allowance ${a.key}`);
    if (a.extra_line && !lines[a.extra_line]) errors.push(`${p.id}: allowance ${a.key} → unknown line ${a.extra_line}`);
  }
  if (p.variant && !packages.some((x) => x.id === p.variant && x.variant_of === p.id)) errors.push(`${p.id}: variant ${p.variant} missing`);
}

if (errors.length) {
  console.error('Data validation FAILED:\n - ' + errors.join('\n - '));
  process.exit(1);
}
const offers = new Set(packages.map((p) => p.no)).size;
console.log(`OK: ${services.length} services, ${ids.size} price lines, ${offers} package offers (${packages.length} orderable rows); all prices, references and Urdu fields check out.`);
