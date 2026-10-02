// Run: node --test tests/*.test.mjs
// Product 2.0 guards: the discovery/sample layer may only POINT at the
// catalogue, every visible label must exist in English and Urdu, samples
// must stay labelled, the content tool may only repeat what was typed,
// and no new file may hard-code a price.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
const services = JSON.parse(read('data/services.json'));
const packages = JSON.parse(read('data/packages.json'));
const discovery = JSON.parse(read('data/discovery.json'));
const samples = JSON.parse(read('data/samples.json'));
const svcNos = new Set(services.services.map((s) => s.no));
const lineIds = new Set(services.services.flatMap((s) => s.lines.map((l) => l.id)));
const pkgIds = new Set(packages.packages.map((p) => p.id));

// Load the i18n dictionaries the way the browser does.
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(read('js/i18n.js').replace('const PK_I18N', 'var PK_I18N'), ctx);
vm.runInContext(read('js/i18n-p2.js'), ctx);
const EN = ctx.PK_I18N.en, UR = ctx.PK_I18N.ur;
const both = (k) => assert.ok(EN[k] && UR[k], 'missing EN/UR string: ' + k);

test('discovery references only existing services, lines and packages', () => {
  for (const o of discovery.outputs) for (const n of o.services) assert.ok(svcNos.has(n), 'output ' + o.key + ' → unknown service ' + n);
  for (const it of discovery.intents) {
    for (const n of it.services) assert.ok(svcNos.has(n), 'intent ' + it.id + ' → unknown service ' + n);
    for (const p of it.packages) assert.ok(pkgIds.has(p), 'intent ' + it.id + ' → unknown package ' + p);
  }
  for (const [what, goals] of Object.entries(discovery.selector.rules)) {
    assert.ok(discovery.selector.what.includes(what));
    for (const g of discovery.selector.goal) assert.ok(goals[g], what + ' has no rule for ' + g);
    for (const [g, rule] of Object.entries(goals)) {
      const list = Array.isArray(rule) ? rule : rule.services;
      for (const n of list) assert.ok(svcNos.has(n), what + '/' + g + ' → unknown service ' + n);
      if (!Array.isArray(rule) && rule.package) assert.ok(pkgIds.has(rule.package), what + '/' + g + ' → unknown package');
    }
  }
  for (const o of discovery.pack.outputs) assert.ok(lineIds.has(o.line), 'pack output ' + o.key + ' → unknown line ' + o.line);
  for (const s of samples.samples) for (const n of s.services) assert.ok(svcNos.has(n), 'sample ' + s.id + ' → unknown service ' + n);
});

test('discovery data holds no prices', () => {
  const raw = read('data/discovery.json');
  assert.ok(!/"(price|amount|monthly|one_off)"\s*:|Rs\.?\s?\d/i.test(raw));
});

test('every Product 2.0 label exists in English and Urdu', () => {
  discovery.outputs.forEach((o) => both('out_' + o.key));
  discovery.intents.forEach((it) => { both('intent_' + it.id); both('intent_' + it.id + '_lead'); });
  discovery.selector.what.forEach((k) => both('sel_what_' + k));
  discovery.selector.goal.forEach((k) => both('sel_goal_' + k));
  discovery.pack.outputs.forEach((o) => both('pack_out_' + o.key));
  discovery.pack.you_send.forEach((k) => both('pack_send_' + k));
  samples.samples.forEach((s) => both('sample_' + s.id));
  ['all'].concat(samples.meta.categories).forEach((c) => both('smp_cat_' + c));
  packages.packages.forEach((p) => { both('pkgx_' + p.id + '_solves'); both('pkgx_' + p.id + '_flow'); });
  // every data-i18n key used in the new/changed pages
  for (const page of ['index.html', 'create.html', 'dashboard.html']) {
    for (const m of read(page).matchAll(/data-i18n(?:-ph|-aria)?="([^"]+)"/g)) both(m[1]);
  }
  // every pkT('…') literal in the new scripts
  for (const f of ['js/discovery.js', 'js/dashboard-p2.js', 'js/create.js', 'js/landing.js']) {
    for (const m of read(f).matchAll(/pkT\('([a-z0-9_-]+)'\)/gi)) both(m[1]);
  }
  assert.equal(Object.keys(EN).filter((k) => !(k in UR)).length, 0, 'keys without Urdu: ' + Object.keys(EN).filter((k) => !(k in UR)).slice(0, 5));
});

test('samples are labelled demonstrations and never claim missing files', () => {
  assert.match(samples.meta.about, /DEMONSTRATION/);
  for (const s of samples.samples) {
    assert.ok(s.mock && s.mock.kind, s.id + ' needs a mock-up fallback');
    if (s.installed) assert.ok(s.image && fs.existsSync(new URL(s.image, root)), s.id + ' is marked installed but ' + s.image + ' is missing');
    const text = JSON.stringify(s).toLowerCase();
    assert.ok(!/client|testimonial|sold in|leads generated|%\s*more/.test(text), s.id + ' must not look like client results');
  }
  assert.match(EN.proof_sample_label, /Sample/);
  assert.match(read('js/discovery.js'), /proof_sample_label/);
});

test('new pages and scripts hard-code no prices', () => {
  for (const f of ['index.html', 'create.html', 'js/discovery.js', 'js/dashboard-p2.js', 'js/create.js', 'js/landing.js', 'js/i18n-p2.js', 'data/discovery.json']) {
    const hits = read(f).match(/Rs\.?\s?[0-9][0-9,]{2,}/g) || [];
    assert.deepEqual(hits, [], f + ' contains a hand-typed price: ' + hits.join(', '));
  }
});

test('content tool repeats only what was typed', () => {
  const { pkCtOutputs, pkCtPrice } = require('../js/create.js');
  assert.equal(pkCtPrice('52000000'), 'Rs 5.2 crore');
  assert.equal(pkCtPrice('7500000'), 'Rs 75 lakh');
  assert.equal(pkCtPrice('85,000'), 'Rs 85,000');
  assert.equal(pkCtPrice(''), '');
  const empty = pkCtOutputs({ purpose: 'sale', type: 'house' });
  for (const t of [empty.wa, empty.en, empty.ru, empty.sheet]) assert.ok(!/\d/.test(t.replace(/Rs|#\w+/g, '')), 'no numbers should appear from nothing: ' + t);
  const f = { purpose: 'rent', type: 'flat', city: 'Islamabad', area: 'G-13', price: '75000', size: '950 sq ft', beds: '2', baths: '2', notes: 'Near park', name: 'Ali', phone: '0300 1234567' };
  const o = pkCtOutputs(f);
  const allowed = new Set(['75', '000', '950', '2', '13', '0300', '1234567', '75,000']);
  for (const t of [o.wa, o.en, o.ru, o.sheet]) {
    for (const n of (t.match(/\d[\d,]*/g) || []).map((x) => x.replace(/,$/, ''))) assert.ok(allowed.has(n), 'unexpected number ' + n + ' in: ' + t);
  }
  assert.match(o.ru, /Kiraye ke liye/);
  assert.match(o.en, /for Rent/);
  assert.ok(!/luxur|best|guarant|premium/i.test(o.wa + o.en + o.ru), 'no invented superlatives');
});

test('Estate handoff accepts only UUIDs', () => {
  const src = read('js/landing.js');
  const re = new RegExp(src.match(/if \(!\/(\^\[0-9a-f\]\{8\}[^/]+)\/i\.test\(id\)\)/)[1], 'i');
  assert.ok(re.test('11111111-1111-1111-1111-111111111111'));
  for (const bad of ['', '../../etc', "1' or '1'='1", '11111111-1111-1111-1111-11111111111', 'javascript:alert(1)']) assert.ok(!re.test(bad), bad);
  assert.match(read('js/db-client.js'), /\.eq\('id', id\)\.eq\('owner_id', userId\)/, 'owned-listing query must filter by owner');
});

test('orders still go through pk_place_order with line ids only (server prices them)', () => {
  const src = read('js/dashboard-p2.js');
  assert.match(src, /PkDB\.placeOrder\(items\)/);
  const item = src.match(/return \{ line_id: id, quantity: 1, details: details, use_brand_kit: useKit \}/);
  assert.ok(item, 'pack items must carry only line_id/quantity/details/use_brand_kit');
  assert.ok(!/unit_price|amount:/.test(src), 'the browser must not send prices');
});

test('catalogue totals still validate', () => {
  const out = require('child_process').execFileSync(process.execPath, ['scripts/validate-data.mjs'], { cwd: new URL('.', root).pathname }).toString();
  assert.match(out, /OK: 56 services, 73 price lines, 5 packages/);
});

// ---------- visual asset pass ----------
function imageSize(file) {
  const b = fs.readFileSync(new URL(file, root));
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') { const n = b.readUInt32LE(21); return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  throw new Error('unknown image format: ' + file);
}

test('installed samples: file exists, width/height are its REAL pixel size, alt text in EN+UR, light weight', () => {
  const installed = samples.samples.filter((s) => s.installed);
  assert.ok(installed.length >= 1, 'expected at least one installed sample');
  for (const s of installed) {
    assert.ok(/^images\/samples\/[a-z0-9-]+\.webp$/.test(s.image), s.id + ' must be a WebP under images/samples/');
    const size = imageSize(s.image);
    assert.deepEqual(size, { w: s.width, h: s.height }, s.id + ' width/height must match the file');
    assert.ok(fs.statSync(new URL(s.image, root)).size <= 200 * 1024, s.id + ' should be ≤ 200 KB');
    both('alt_' + s.id);
    assert.match(EN['alt_' + s.id], /^Sample concept/, s.id + ' alt text must disclose it is a sample');
    if (s.thumb) {
      // the thumbnail is a smaller copy of the same artwork: same aspect ratio, never larger
      assert.ok(/^images\/samples\/[a-z0-9-]+\.webp$/.test(s.thumb), s.id + ' thumb must be a WebP under images/samples/');
      const t = imageSize(s.thumb);
      assert.equal(t.w, s.thumbWidth, s.id + ' thumbWidth must match the thumb file');
      assert.ok(t.w < s.width, s.id + ' thumb must be smaller than the full image');
      assert.ok(Math.abs(t.w / t.h - s.width / s.height) < 0.01, s.id + ' thumb must keep the aspect ratio (no stretching)');
      assert.ok(fs.statSync(new URL(s.thumb, root)).size <= 120 * 1024, s.id + ' thumb should be ≤ 120 KB');
    }
    if (s.note) both(s.note);
  }
  both('sample_illustrative');
  // every installed file is referenced, and nothing unreferenced was shipped
  const shipped = fs.readdirSync(new URL('images/samples/', root)).map((f) => 'images/samples/' + f);
  for (const f of shipped) assert.ok(installed.some((s) => s.image === f || s.thumb === f), f + ' is not referenced by an installed sample');
});

test('rendered samples always carry the sample label', () => {
  const src = read('js/discovery.js');
  assert.match(src, /smp-badge[^\n]+proof_sample_label/, 'installed images need the on-image badge');
  assert.match(read('js/discovery.js'), /<figcaption><span class="sample-tag">/, 'gallery captions carry the sample tag');
  assert.match(read('js/landing.js'), /col-tile[^\n]+sample-tag/, 'hero tiles carry the sample tag');
  assert.match(src, /sample_illustrative/);
  // the payment plan's figures and the reel's play button carry their own extra disclosure
  const byId = Object.fromEntries(samples.samples.map((s) => [s.id, s]));
  assert.equal(byId['project-payment-plan'].note, 'sample_note_plan');
  assert.match(EN.sample_note_plan, /illustrative/i);
  assert.equal(byId['reel-cover'].note, 'sample_note_reel');
  assert.match(EN.sample_note_reel, /no video/i);
});

test('OG / Twitter share image exists at 1200x630 and every public page points to it', () => {
  const size = imageSize('images/og-share.jpg');
  assert.deepEqual(size, { w: 1200, h: 630 });
  assert.ok(fs.statSync(new URL('images/og-share.jpg', root)).size <= 200 * 1024);
  for (const page of ['index.html', 'services.html', 'create.html']) {
    const html = read(page);
    assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+\/images\/og-share\.jpg">/, page + ' og:image');
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, page + ' twitter:card');
    assert.match(html, /<meta name="twitter:image" content="https:\/\/[^"]+\/images\/og-share\.jpg">/, page + ' twitter:image');
    assert.match(html, /og:image:width" content="1200"[\s\S]*og:image:height" content="630"/, page + ' og:image size');
    assert.ok(!/og:image" content="https:\/\/agenticcore\.estate/.test(html), page + ' must not use the Estate icon as its share image');
  }
});

test('approved entry-service prices (owner-approved 1 Oct 2026) stay in the catalogue', () => {
  const svc = JSON.parse(read('data/services.json'));
  const price = Object.fromEntries(svc.services.flatMap((s) => s.lines.map((l) => [l.id, l.price])));
  const approved = { '11-dfy': 999, '28-dfy': 1299, '37-dfy': 1599, '7-one': 1999, '10-dfy': 1999, '22-dfy': 2499, '25-plan': 3499, '23-dfy': 3999, '7-cat': 4499, '15-dfy': 9999 };
  for (const [id, p] of Object.entries(approved)) assert.equal(price[id], p, id + ' should be Rs ' + p);
  // "Listing support" tile = services 28 / 49 / 33, shown "from" the cheapest line (Rs 1,299)
  const from = Math.min(...[28, 49, 33].flatMap((n) => svc.services.find((s) => s.no === n).lines.map((l) => l.price)));
  assert.equal(from, 1299);
});

test('every "What we can create" tile has installed sample artwork; tile-only art stays out of the gallery', () => {
  const src = read('js/landing.js');
  const map = Object.fromEntries([...src.match(/PK_OUT_SAMPLE = \{([^}]+)\}/)[1].matchAll(/(\w+): '([a-z0-9-]+)'/g)].map((m) => [m[1], m[2]]));
  const disc = JSON.parse(read('data/discovery.json'));
  for (const o of disc.outputs) {
    const s = samples.samples.find((x) => x.id === map[o.key]);
    assert.ok(s && s.installed && s.thumb, 'tile ' + o.key + ' needs installed artwork with a thumbnail');
  }
  for (const s of samples.samples.filter((x) => x.gallery === false)) assert.deepEqual(s.services, [], s.id + ' is tile-only, so no service examples');
  assert.match(src, /x\.gallery !== false && \(P2\.cat/);
  assert.match(read('js/discovery.js'), /x\.gallery !== false && \(x\.services/);
  for (const c of samples.meta.categories) both('smp_cat_' + c);
});

test('estate-link: only allow-listed context is read, never personal data', () => {
  const ctx = { URLSearchParams, window: { PK_CONFIG: { estateUrl: 'https://agenticcore.estate' } }, location: { search: '' } };
  ctx.PK_CONFIG = ctx.window.PK_CONFIG;
  vm.createContext(ctx);
  vm.runInContext(read('js/estate-link.js') + '\nthis.pkEstateContext = pkEstateContext; this.pkEstateUrl = pkEstateUrl; this.pkEstateEntityUrl = pkEstateEntityUrl;', ctx);
  const id = '11111111-2222-3333-4444-555555555555';
  assert.equal(ctx.pkEstateContext('?intent=brand'), null);
  const ok = ctx.pkEstateContext(`?from=estate&intent=brand&entity_type=agency&entity_id=${id}&phone=0300&name=x`);
  assert.deepEqual({ ...ok }, { intent: 'brand', entityType: 'agency', entityId: id });
  const bad = ctx.pkEstateContext('?from=estate&intent=steal&entity_type=users&entity_id=1 or 1=1');
  assert.deepEqual({ ...bad }, { intent: null, entityType: null, entityId: null });
  assert.equal(ctx.pkEstateContext(`?from=estate&entity_type=agency&entity_id=nope`).entityType, null);
  assert.equal(ctx.pkEstateUrl('signup.html', 'agency'), 'https://agenticcore.estate/signup.html?from=pk&intent=agency');
  assert.equal(ctx.pkEstateUrl('', 'evil'), 'https://agenticcore.estate/?from=pk');
  assert.equal(ctx.pkEstateEntityUrl(ok), `https://agenticcore.estate/agency.html?id=${id}`);
});

test('estate-link i18n keys exist in English and Urdu, and the #estate audience links stay allow-listed', () => {
  const src = read('js/estate-link.js') + read('index.html');
  const keys = [...new Set([...src.matchAll(/(?:pkT\('|data-i18n=")(ex_[a-z_]*[a-z])(?=['"])/g)].map((m) => m[1]))];
  for (const t of ['property', 'project', 'professional', 'agency', 'builder']) keys.push('ex_back_' + t);
  const i18n = read('js/i18n-p2.js');
  for (const k of keys) assert.ok((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length >= 2, k);
  const links = [...read('index.html').matchAll(/agenticcore\.estate\/[^"]*from=pk[^"]*/g)].map((m) => m[0]);
  assert.ok(links.length >= 5);
  for (const l of links) assert.match(l, /intent=(browse|list|profile|agency|builder|project|view)$/);
});
