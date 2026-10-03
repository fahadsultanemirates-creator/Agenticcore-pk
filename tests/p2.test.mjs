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
vm.runInContext(read('js/i18n-v2.js'), ctx);
const EN = ctx.PK_I18N.en, UR = ctx.PK_I18N.ur;
const both = (k) => assert.ok(EN[k] && UR[k], 'missing EN/UR string: ' + k);

test('discovery references only existing services, lines and packages', () => {
  for (const id of discovery.featured_packages) assert.ok(pkgIds.has(id), 'featured → unknown package ' + id);
  for (const a of discovery.audiences) {
    assert.ok(a.journeys.length >= 1, a.id + ' needs journeys');
    for (const j of a.journeys) {
      assert.ok(['#pack', '#packages', '#ai'].includes(j.target), j.id + ' bad target');
      for (const n of j.services) assert.ok(svcNos.has(n), 'journey ' + j.id + ' → unknown service ' + n);
      for (const p of j.packages) assert.ok(pkgIds.has(p), 'journey ' + j.id + ' → unknown package ' + p);
    }
  }
  for (const o of discovery.tiles) assert.ok(lineIds.has(o.line), 'tile ' + o.key + ' → unknown line ' + o.line);
  for (const o of discovery.pack.outputs) assert.ok(lineIds.has(o.line), 'pack output ' + o.key + ' → unknown line ' + o.line);
  for (const p of discovery.pack.monthly_hint_packages) assert.ok(pkgIds.has(p), 'pack hint → unknown package ' + p);
  for (const s of samples.samples) for (const n of s.services) assert.ok(svcNos.has(n), 'sample ' + s.id + ' → unknown service ' + n);
  assert.ok(!('intents' in discovery) && !('selector' in discovery), 'V2 replaced intents/selector with audiences');
});

test('discovery data holds no prices', () => {
  const raw = read('data/discovery.json');
  assert.ok(!/"(price|amount|monthly|one_off)"\s*:|Rs\.?\s?\d/i.test(raw));
});

test('every Product 2.0 label exists in English and Urdu', () => {
  discovery.tiles.forEach((o) => both('out_' + o.key));
  discovery.audiences.forEach((a) => { both('aud_' + a.id); a.journeys.forEach((j) => { both('jr_' + j.id); both('jr_' + j.id + '_sub'); both('jr_' + j.id + '_lead'); }); });
  discovery.pack.outputs.forEach((o) => both('pack_out_' + o.key));
  discovery.pack.you_send.forEach((k) => both('pack_send_' + k));
  samples.samples.forEach((s) => both('sample_' + s.id));
  ['all'].concat(samples.meta.categories).forEach((c) => both('smp_cat_' + c));
  // every data-i18n key used in the new/changed pages
  for (const page of ['index.html', 'create.html', 'dashboard.html', 'services.html']) {
    for (const m of read(page).matchAll(/data-i18n(?:-ph|-aria)?="([^"]+)"/g)) both(m[1]);
  }
  // every pkT('…') literal in the new scripts
  for (const f of ['js/discovery.js', 'js/dashboard-p2.js', 'js/create.js', 'js/landing.js', 'js/catalog-render.js', 'js/dashboard.js', 'services.html']) {
    for (const m of read(f).matchAll(/pkT\('([a-z0-9_-]+)'\)/gi)) both(m[1]);
  }
  for (const m of read('index.html').matchAll(/data-count-label="([^"]+)"/g)) { both(m[1]); assert.match(EN[m[1]], /\{n\}/); assert.match(UR[m[1]], /\{n\}/); }
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
  for (const f of ['index.html', 'services.html', 'legal.html', 'create.html', 'js/discovery.js', 'js/dashboard-p2.js', 'js/dashboard.js', 'js/catalog-render.js', 'js/create.js', 'js/landing.js', 'js/i18n.js', 'js/i18n-p2.js', 'js/i18n-v2.js', 'data/discovery.json']) {
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
  assert.match(out, /OK: 74 services, 77 price lines, 8 package offers \(10 orderable rows\)/);
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

// Catalogue V2 (owner specification, October 2026): every service name and price, line by line.
const V2 = {
  1: ['Property WhatsApp Card', { 'p-wa-card': 999 }], 2: ['Property Social Media Post', { 'p-social-post': 999 }], 3: ['Property Flyer', { 'p-flyer': 999 }],
  4: ['Property Photo Enhancement', { '28-dfy': 1299 }], 5: ['Property Captions — English + Roman Urdu', { 'p-captions': 999 }],
  6: ['Property Reel — AI Voiceover', { '22-dfy': 2499 }], 7: ['Property Promo Reel', { '23-dfy': 3999 }], 8: ['Property PDF / WhatsApp Catalogue', { '7-cat': 4499 }],
  9: ['QR Property Flyer', { '10-dfy': 1999 }], 10: ['3D Floor Plan', { '25-plan': 3499 }], 11: ['AI-Staged Interior', { '25-room': 999 }],
  12: ['Single Property Landing Page', { '15-dfy': 9999 }], 13: ['Agent Personal Branding Kit', { '3-dfy': 4499 }], 14: ['Agency Logo + Brand Kit', { '1-dfy': 6499 }],
  15: ['Social Media Pages Setup', { '30-dfy': 3499 }], 16: ['Agency Website', { '14-dfy': 32499 }], 17: ['Website + Easy Listing Editor', { '14-setup': 42499 }],
  18: ['Google Business Profile Management', { '51-mo': 3999 }], 19: ['Facebook Property Group Marketing', { '35-mo': 6499 }],
  20: ['Multi-Portal Listing Management', { '49-setup': 19499, '49-mo': 9999 }], 21: ['Paid Ads Management — One Platform', { '36-one': 9999 }],
  22: ['Paid Ads Management — Two Platforms', { '36-two': 16499 }], 23: ['Overseas Buyer Campaign', { 'ag-overseas-mo': 12999 }], 24: ['Retargeting', { '39-mo': 4999 }],
  25: ['Project Branding Kit', { '2-dfy': 19499 }], 26: ['Payment / Instalment Plan Design', { '4-dfy': 1599 }], 27: ['Project Brochure', { '6-dfy': 9999 }],
  28: ['Project WhatsApp One-Pager', { '7-one': 1999 }], 29: ['Project Rate / Offer Creative', { '11-dfy': 999 }], 30: ['NOC / Approval Presentation Kit', { '8-dfy': 3499 }],
  31: ['Master Plan / Society Map Digitisation', { '5-dfy': 12999 }], 32: ['Investor Presentation', { '13-dfy': 12999 }], 33: ['Project Landing Page', { 'proj-landing': 9999 }],
  34: ['Project / Developer Website', { 'proj-website': 32499 }], 35: ['Project Promo Video', { 'proj-promo-video': 3999 }],
  36: ['AI Presenter Project Video', { '21-one': 4999, '21-both': 6999 }], 37: ['Drone Footage Editing', { '24-dfy': 6499 }], 38: ['360° Virtual Tour', { '26-dfy': 12999 }],
  39: ['Site Progress Video Service', { '27-mo': 9999 }], 40: ['Project Launch Campaign', { '40-mo': 32499 }], 41: ['Overseas Project Campaign', { '38-mo': 12999 }],
  42: ['Overseas Investor Webinar / Virtual Visit', { '41-mo': 19499 }], 43: ['Interactive Plot Availability Map', { '17-setup': 38999 }],
  44: ['Online Booking + E-Receipts', { '20-setup': 32499 }], 45: ['Buyer Portal', { '18-setup': 64999 }], 46: ['Dealer Portal', { '19-setup': 64999 }],
  47: ['Instalment / Dues Reminder System', { '48-setup': 32499 }], 48: ['Project CRM + Sales Team Setup', { '47-setup': 22999 }],
  49: ['AI Listing Assistant', { 'ai-listing': 7999 }], 50: ['Website AI Assistant', { 'ai-website': 7999 }], 51: ['WhatsApp Enquiry / Qualification Bot', { 'ai-wa-bot': 9999 }],
  52: ['Automatic Property Posting System', { 'ai-autopost': 9999 }], 53: ['AI Property Content System', { 'ai-content': 9999 }], 54: ['Lead Routing Automation', { 'ai-lead-routing': 6499 }],
  55: ['AI Document & Proposal Assistant', { 'ai-docs': 12999 }], 56: ['AI Office Assistant', { 'ai-office': 14999 }], 57: ['AI Lead Follow-up System', { 'ai-followup': 14999 }],
  58: ['Custom AI Assistant', { 'ai-custom': 14999 }], 59: ['CRM + AI Workflow Setup', { 'ai-crm': 19999 }], 60: ['Agency Automation Framework', { 'ai-agency-fw': 24999 }],
  61: ['AI Voice Bot', { 'ai-voice': 29999 }], 62: ['Developer Automation Framework', { 'ai-dev-fw': 39999 }],
  63: ['Video Script', { '34-dfy': 649 }], 64: ['English + Roman Urdu Ad Copy', { '37-dfy': 1599 }], 65: ['Advertising Wording Check', { '42-dfy': 1299 }],
  66: ['Market / Area Guide', { '53-dfy': 6499 }], 67: ['Overseas Buyer Guide', { '54-dfy': 4999 }], 68: ['Blog + SEO Content', { '55-mo': 6499 }],
  69: ['Review & Reputation Management', { '52-mo': 4999 }], 70: ['Urdu Sale / Purchase / Rental Agreement — First Draft', { '56-dfy': 1299 }],
  71: ['Custom Agreement Drafting Assistant', { '56-setup': 22999 }], 72: ['Embeddable Property Calculator', { '16-one': 9999, '16-all': 19499 }],
  73: ['Balloting Results Page', { '29-setup': 32499 }], 74: ['Balloting Event Digital / Live Support', { 'balloting-event': 25999 }]
};

test('Catalogue V2: all 74 services, names and prices exactly as specified', () => {
  assert.equal(services.services.length, 74);
  for (const s of services.services) {
    const want = V2[s.no];
    assert.ok(want, 'unexpected service ' + s.no);
    assert.equal(s.name, want[0], 'service ' + s.no + ' name');
    assert.deepEqual(Object.fromEntries(s.lines.map((l) => [l.id, l.price])), want[1], 'service ' + s.no + ' prices');
  }
  assert.equal(lineIds.size, 77);
  const groups = Object.fromEntries(services.groups.map((g) => [g.slug, g.no]));
  const inGroup = (slug) => services.services.filter((s) => s.group === groups[slug]).map((s) => s.no);
  assert.deepEqual([inGroup('property-marketing').length, inGroup('project-marketing').length, inGroup('ai-automation').length, inGroup('specialist').length], [24, 24, 14, 12]);
  assert.ok(services.groups.find((g) => g.slug === 'specialist').secondary, 'specialist section stays secondary');
  for (const id of services.meta.retired_lines) assert.ok(!lineIds.has(id), 'retired line still orderable: ' + id);
});

test('Catalogue V2: package offers, terms and allowances', () => {
  const by = Object.fromEntries(packages.packages.map((p) => [p.id, p]));
  const want = {
    'agent-monthly': { monthly: 7999, setup: undefined }, 'agent-pro': { monthly: 14999, setup: undefined }, 'agency-growth': { monthly: 29999, setup: 9999 },
    'project-monthly': { monthly: 19999, setup: undefined }, 'project-growth': { monthly: 39999, setup: 9999 }, 'developer-partner': { monthly: 74999, setup: undefined }
  };
  for (const [id, w] of Object.entries(want)) {
    assert.equal(by[id].monthly, w.monthly, id + ' monthly');
    assert.equal(by[id].setup || undefined, w.setup, id + ' setup');
    assert.ok(by[id].min_months > 0, id + ' needs a minimum term');
  }
  assert.ok(by['developer-partner'].quote_only && by['developer-partner'].monthly_from && by['developer-partner'].setup_quoted);
  assert.equal(by['agency-launch'].one_off, 14999); assert.equal(by['agency-launch-web'].one_off, 39999); assert.ok(by['agency-launch-web'].one_off_from);
  assert.equal(by['project-launch'].one_off, 39999); assert.equal(by['project-launch-web'].one_off, 64999); assert.ok(by['project-launch-web'].one_off_from);
  const allow = (id) => Object.fromEntries(by[id].allowances.map((a) => [a.key, a.qty]));
  assert.deepEqual(allow('agent-monthly'), { property_sets: 10, reels: 2, rate_updates: 4 });
  assert.deepEqual(allow('agent-pro'), { property_sets: 25, reels: 4, rate_updates: 8 });
  for (const old of ['dealer-starter', 'agenticcore-package', 'growing-agent', 'agency-pro', 'project-partner']) assert.ok(!by[old], old + ' is retired');
  for (const p of packages.packages) assert.ok(!p.expected && !(p.monthly_items || []).length, p.id + ' must not carry savings maths');
});

test('no retired package names, old service counts or "savings" wording on public pages', () => {
  const pub = ['index.html', 'services.html', 'legal.html', 'create.html', 'dashboard.html', 'js/i18n.js', 'js/i18n-p2.js', 'js/i18n-v2.js', 'js/catalog-render.js', 'js/landing.js', 'js/discovery.js', 'js/dashboard.js', 'js/dashboard-p2.js', 'data/packages.json'];
  for (const f of pub) {
    const src = read(f);
    for (const bad of [/Dealer Starter/i, /Growing Agent/i, /Agency Pro\b/i, /Project Partner/i, /AgenticCore Package/i, /\b56 (services|خدمات|سروسز)/, /You save|Save more|money-saving|bought separately|set-up discount/i]) {
      assert.ok(!bad.test(src), f + ' still contains ' + bad);
    }
  }
  assert.ok(!/packageTotals|sumItems/.test(read('js/admin.js') + read('js/catalog-core.js')), 'savings helpers are gone');
});

test('the generated seed prices exactly what the site shows, and retires old lines and packages', () => {
  const sql = read('supabase/migrations/pk_0002_seed_catalog.sql');
  for (const s of services.services) for (const l of s.lines) {
    assert.ok(sql.includes(`('${l.id}', ${s.no}, `), 'seed is missing line ' + l.id);
    assert.match(sql, new RegExp(`\\('${l.id}', ${s.no}, '[^\\n]*?', '${l.model}', ${l.price}, `), 'seed price for ' + l.id);
  }
  assert.match(sql, /update public\.pk_catalog_lines set active = false\s+where line_id not in/);
  assert.match(sql, /update public\.pk_packages set active = false where id not in/);
  const mig = read('supabase/migrations/pk_0004_catalogue_v2.sql');
  assert.match(mig, /if pkg\.quote_only then raise exception/);
  assert.match(mig, /'proposal'/);
  assert.ok(!/drop table|delete from|disable row level security/i.test(mig), 'pk_0004 must be additive');
});

test('Developer Partner is a proposal request, never a purchase', () => {
  const dash = read('js/dashboard.js');
  assert.match(dash, /kind: 'proposal'/);
  assert.match(dash, /if \(p\.quote_only\) \{ proposalDialog\(id\); return; \}/);
  assert.match(read('js/catalog-render.js'), /if \(p\.quote_only\)[\s\S]{0,200}data-request-proposal/);
});

test('every "What we can create" tile shows an exact line price and installed sample artwork', () => {
  const src = read('js/landing.js');
  assert.match(src, /D\.discovery\.tiles\.map/);
  assert.match(src, /Rs\(hit\.line\.price\)/, 'tiles show the exact line price from services.json');
  for (const o of discovery.tiles) {
    const s = samples.samples.find((x) => x.id === o.sample);
    assert.ok(s && s.installed && s.thumb, 'tile ' + o.key + ' needs installed artwork with a thumbnail');
  }
  assert.ok(!samples.samples.some((s) => s.id === 'listing-support'), 'the listing-support sample stays removed');
  assert.ok(!fs.readdirSync(new URL('images/samples/', root)).some((f) => f.startsWith('listing-support')));
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

test('service 74 has its own V2 id; old 29-event is retired but kept for history', () => {
  const s74 = services.services.find((s) => s.no === 74);
  assert.deepEqual(s74.lines.map((l) => [l.id, l.model, l.price, !!l.from]), [['balloting-event', 'dfy', 25999, true]]);
  assert.match(s74.lines[0].text, /^From Rs 25,999 per balloting event/);
  assert.ok(services.meta.retired_lines.includes('29-event'));
  assert.ok(!lineIds.has('29-event'));
  const sql = read('supabase/migrations/pk_0002_seed_catalog.sql');
  assert.match(sql, /\('balloting-event', 74, /);
  assert.ok(!/\('29-event'/.test(sql), 'seed must not re-activate 29-event');
  assert.match(sql, /set active = false\s+where line_id not in/, 'retired lines are deactivated, never deleted');
  assert.match(read('docs/CATALOGUE_V2.md'), /`balloting-event` \| NEW line/);
});

test('service 18 is one monthly line with set-up included where required', () => {
  const s = services.services.find((x) => x.no === 18);
  assert.equal(s.name, 'Google Business Profile Management');
  assert.equal(s.lines.length, 1);
  assert.equal(s.lines[0].model, 'monthly');
  assert.match(s.brief + s.lines[0].included, /set-up[^.]*included where required|set-up or clean-up where required \(no separate fee\)/i);
  assert.ok(s.brief_ur && s.lines[0].included_ur);
});

test('7-day operation: pk_0005 counts every calendar day (no weekend or holiday exclusions)', () => {
  const m = read('supabase/migrations/pk_0005_seven_day_due.sql');
  assert.match(m, /create or replace function public\.pk_compute_due/);
  assert.match(m, /start_day \+ greatest\(p_days, 0\)/);
  assert.match(m, /cutoff_hour_pkt', 18/);
  assert.match(m, /due_hour_pkt', 21/);
  const code = m.replace(/^\s*--.*$/gm, '');
  assert.ok(!/isodow|holiday|working_dows|weekend|create trigger/i.test(code), 'no weekend/holiday machinery');
  assert.ok(!/drop table|delete from|disable row level security/i.test(code), 'pk_0005 must be additive');
  assert.ok(!fs.existsSync(new URL('supabase/migrations/pk_0005_working_day_due.sql', root)), 'old working-day migration removed');
  const t = read('tests/db/seven_day_due.test.sql');
  for (const c of ['Friday → Saturday', 'Saturday → Sunday', 'Sunday → Monday', 'before the 6pm cut-off', 'exactly 6pm', 'after 6pm', 'same-day service on Saturday', 'same-day service on Sunday', 'crosses the weekend', 'resume shortened the deadline'])
    assert.ok(t.includes(c), 'seven-day test missing: ' + c);
  both('ops_note');
  assert.equal(EN.ops_note, 'We work 7 days a week. Orders confirmed before 6pm PKT start the same day; orders confirmed at or after 6pm start the following day.');
});

test('no Mon–Fri, working-day, weekend-exclusion or holiday-exclusion wording anywhere customer- or team-facing', () => {
  const files = ['index.html', 'services.html', 'legal.html', 'create.html', 'dashboard.html', 'admin.html', 'signup.html', 'login.html',
    'js/i18n.js', 'js/i18n-p2.js', 'js/i18n-v2.js', 'js/landing.js', 'js/discovery.js', 'js/catalog-render.js', 'js/dashboard.js', 'js/dashboard-p2.js', 'js/admin.js',
    'data/services.json', 'data/packages.json', 'data/discovery.json', 'data/samples.json', 'docs/CATALOGUE_V2.md', 'docs/SAMPLE_ASSET_MANIFEST.md'];
  const bad = /working[- ]days?|mon(day)?\s*(–|-|to)\s*fri(day)?|پیر تا جمعہ|کاروباری دن|excluding (weekends|public holidays)|holiday calendar|skipping holidays/i;
  for (const f of files) {
    const hit = read(f).split('\n').find((l) => bad.test(l) && !/no weekend or holiday exclusions|including weekends and public holidays|There are no weekend|no holiday calendar/i.test(l));
    assert.ok(!hit, f + ': ' + (hit || '').trim().slice(0, 140));
  }
});

test('positioning, plan explanations, ecosystem and network wording (EN + UR)', () => {
  assert.match(EN.p2_eyebrow, /Built specifically for Pakistan real estate/);
  assert.equal(EN.p2_specialist, "Property marketing is not one of the industries we serve. It's the industry we are built for.");
  both('p2_specialist');
  for (const f of ['index.html', 'services.html']) assert.match(read(f), /data-i18n="p2_specialist"/, f + ' shows the specialist line');
  // no unsubstantiated "only" / "first" / "No. 1" claims
  const all = Object.values(EN).join(' ') + Object.values(UR).join(' ') + read('index.html') + read('services.html');
  assert.ok(!/\b(Pakistan's|the) only\b|only (company|agency) in Pakistan|first in Pakistan|No\.? ?1 in|number one/i.test(all), 'no "only/first/No. 1" claims');
  const sec = Object.fromEntries(packages.meta.sections.map((s) => [s.id, s]));
  assert.match(sec.agents.intro, /^Have several properties to market\? Don't pay separately for every small design\./);
  assert.match(sec.projects.intro, /^One project needs marketing every week, not one design once\./);
  assert.ok(sec.agents.intro_ur && sec.projects.intro_ur);
  for (const k of ['list', 'create', 'share', 'promote', 'automate']) { both('es_v_' + k); both('es_v_' + k + '_d'); }
  assert.match(EN.es_sub, /Estate is the property marketplace and listing side.*Pakistan is the marketing and technology side/);
  assert.match(EN.es_note, /never guarantee views, reach, enquiries or sales/);
  // posting = client-owned channels; AgenticCore featuring is separate, optional, not guaranteed
  for (const p of packages.packages) for (const it of p.includes || []) {
    if (/posting|social media management|channels/i.test(it.label) && !/AgenticCore's own|third-party/.test(it.label)) assert.match(it.label, /your own/, p.id + ': "' + it.label + '" must say client-owned');
    if (/AgenticCore's own channels/.test(it.label)) assert.match(it.label, /optional/i, p.id + ': AgenticCore featuring must be optional');
  }
  assert.match(packages.meta.network_note, /your own social channels/i);
  assert.match(packages.meta.network_note, /not guaranteed/);
  assert.match(read('index.html'), /es-flow[\s\S]*LIST[\s\S]*CREATE[\s\S]*SHARE[\s\S]*PROMOTE[\s\S]*AUTOMATE/);
  assert.ok(read('index.html').indexOf('id="estate"') < read('index.html').indexOf('id="packages"'), 'ecosystem journey sits above the packages');
});

test('landing-page sample matches V2 (Rs 9,999, 2–3 working days) and stays labelled', () => {
  assert.match(EN['alt_property-landing-page'], /^Sample concept/);
  assert.match(EN['alt_property-landing-page'], /2–3 day delivery/);
  assert.ok(!/same-day/i.test(EN['alt_property-landing-page']));
  const s = services.services.find((x) => x.no === 12);
  assert.equal(s.lines[0].price, 9999);
  assert.ok(!s.lines[0].from);
  assert.match(s.delivery, /^2–3 days/);
});

test('assistant buttons link to existing V2 services and sections', () => {
  const src = read('js/ac-assistant.js');
  const nos = new Set(services.services.map((s) => s.no));
  const slugs = new Set(services.groups.map((g) => g.slug));
  const anchors = [...src.matchAll(/services\.html#([a-z0-9-]+)/g)].map((m) => m[1]);
  assert.ok(anchors.length > 10);
  for (const a of anchors) {
    const n = /^service-(\d+)$/.exec(a);
    assert.ok(n ? nos.has(Number(n[1])) : slugs.has(a), a);
  }
  const name = (n) => services.services.find((s) => s.no === n).name;
  assert.match(name(14), /Logo/); assert.match(name(13), /Personal Branding/); assert.match(name(27), /Brochure/);
  assert.match(name(16), /Agency Website/); assert.match(name(4), /Photo Enhancement/); assert.match(name(40), /Launch Campaign/);
});
