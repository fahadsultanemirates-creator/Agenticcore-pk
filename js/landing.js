/* AgenticCore Pakistan — landing page behaviour */

const PK_FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function pkRenderLandingData() {
  const D = window.PK_DATA;
  if (!D.services) return;

  document.getElementById('svcGroups').innerHTML = D.services.groups.map(pkGroupCardHtml).join('');
  document.getElementById('pkgList').innerHTML = D.packages.packages.map(function (p) { return pkPackageCardHtml(p); }).join('');
  document.getElementById('pkgIncludes').textContent = pkPick(D.packages.meta, 'monthly_includes');
  const chart = D.lines['4-dfy'];
  const fcp = document.getElementById('freeChartPrice');
  if (chart && fcp) fcp.textContent = Rs(chart.line.price);

  document.getElementById('faqList').innerHTML = PK_FAQ_KEYS.map(function (k) {
    return '<details class="acc"><summary>' + escapeHtml(pkT('faq_q' + k)) + '</summary><div class="acc-body"><p>' + escapeHtml(pkT('faq_a' + k)) + '</p></div></details>';
  }).join('');

  pkWireWhatsAppLinks(document.getElementById('services'));
  pkWireWhatsAppLinks(document.getElementById('packages'));
}

// Structured data generated from the same data files (FAQPage + Offer per package).
function pkInjectSchema() {
  const D = window.PK_DATA;
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: PK_FAQ_KEYS.map(function (k) {
      return { '@type': 'Question', name: PK_I18N.en['faq_q' + k], acceptedAnswer: { '@type': 'Answer', text: PK_I18N.en['faq_a' + k] } };
    })
  };
  const offers = {
    '@context': 'https://schema.org', '@type': 'Service', name: 'Real estate marketing packages', provider: { '@type': 'Organization', name: 'AgenticCore Pakistan' },
    areaServed: 'PK',
    offers: D.packages.packages.map(function (p) {
      return { '@type': 'Offer', name: p.name, description: p.for, priceCurrency: 'PKR', price: p.one_off || p.monthly, url: 'https://agenticcorepk.com/#pkg-' + p.id };
    })
  };
  [faq, offers].forEach(function (obj) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  });
}

function pkInitTabs() {
  const tabs = Array.prototype.slice.call(document.querySelectorAll('#problems [role="tab"]'));
  function select(tab) {
    tabs.forEach(function (t) {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      const rtl = document.documentElement.dir === 'rtl';
      const next = tabs[(i + (rtl ? -dir : dir) + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
}

function pkShowMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'error');
}

function pkInitForms() {
  const cb = document.getElementById('callbackForm');
  cb.addEventListener('submit', async function (e) {
    e.preventDefault();
    const msg = document.getElementById('callbackMsg');
    const name = document.getElementById('cbName').value.trim();
    const phone = document.getElementById('cbPhone').value.trim();
    if (!name || !/^[0-9+\-\s]{7,}$/.test(phone)) { pkShowMsg(msg, 'Please enter your name and a valid phone number.', false); return; }
    const btn = cb.querySelector('button'); btn.disabled = true;
    const res = await PkDB.submitLead({ kind: 'callback', name: name, phone: phone, city: document.getElementById('cbCity').value.trim() || null, section: 'final-cta' });
    btn.disabled = false;
    if (res.error) { pkShowMsg(msg, pkT('cb_error'), false); return; }
    cb.reset();
    msg.innerHTML = '';
    pkShowMsg(msg, pkT('cb_thanks'), true);
    const a = document.createElement('a'); a.href = 'signup.html'; a.className = 'link'; a.style.marginInlineStart = '0.4rem'; a.textContent = pkT('nav_signup');
    msg.appendChild(a);
    pkTrack('form_submit', 'final-cta');
  });

  if (PK_CONFIG.leadMagnets) {
    document.getElementById('free').hidden = false;
    const mf = document.getElementById('magnetForm');
    mf.addEventListener('submit', async function (e) {
      e.preventDefault();
      const msg = document.getElementById('magnetMsg');
      const name = document.getElementById('mgName').value.trim();
      const num = document.getElementById('mgPhone').value.trim().replace(/^0/, '');
      if (!name || !/^[0-9\-\s]{6,}$/.test(num)) { pkShowMsg(msg, 'Please enter your name and a valid phone number.', false); return; }
      const res = await PkDB.submitLead({ kind: 'lead_magnet', name: name, phone: document.getElementById('mgCc').value + ' ' + num,
        role: document.getElementById('mgRole').value, city: document.getElementById('mgCity').value.trim() || null, section: 'free' });
      if (res.error) { pkShowMsg(msg, pkT('cb_error'), false); return; }
      mf.reset();
      pkShowMsg(msg, 'Thank you. Create your free account to track it.', true);
      pkTrack('form_submit', 'free');
    });
  }
}


/* ---------- Product 2.0 sections ---------- */
const PK_OUT_ICONS = { flyer: '▤', whatsapp: '✆', social: '◫', brochure: '▥', reel: '▶', project: '⌂', website: '⌘', listing: '✓' };
// "What we can create" tiles show the matching sample concept as a decorative thumbnail.
const PK_OUT_SAMPLE = { flyer: 'property-flyer', whatsapp: 'whatsapp-property-card', social: 'social-property-post', brochure: 'property-brochure', reel: 'reel-cover', project: 'project-payment-plan' };
const P2 = { intent: 'sell-property', what: null, goal: null, cat: 'all', pack: null };

function pkRenderP2() {
  const D = window.PK_DATA;
  if (!D.discovery) return;
  const byId = function (id) { return D.samples.samples.find(function (x) { return x.id === id; }); };

  // hero collage: four sample concepts
  // Hero collage prefers installed artwork; any sample not installed yet falls back to its mock-up.
  const heroIds = ['property-flyer', 'whatsapp-property-card', 'social-property-post', 'reel-cover'];
  document.getElementById('heroCollage').innerHTML = heroIds.map(byId).filter(Boolean).map(function (smp, i) {
    return '<figure class="col-tile col-' + i + '">' + pkSampleVisualHtml(smp, { eager: true, sizes: '(min-width: 960px) 240px, 46vw' }) + '<figcaption><span class="sample-tag">' + escapeHtml(pkT('proof_sample_label')) + '</span> ' + escapeHtml(pkT('sample_' + smp.id)) + '</figcaption></figure>';
  }).join('');

  // Pack: a compact preview of what the outputs look like (installed sample concepts only).
  const pv = document.getElementById('packPreview');
  if (pv) {
    // The pack's own outputs first: WhatsApp card, offer post, QR flyer, reel.
    const shots = ['whatsapp-property-card', 'social-property-post', 'property-flyer', 'reel-cover'].map(byId).filter(function (x) { return x && x.installed; });
    pv.hidden = !shots.length;
    pv.innerHTML = shots.map(function (smp) {
      return '<figure class="pv-tile">' + pkSampleVisualHtml(smp, { sizes: '(min-width: 960px) 200px, 46vw' }) + '<figcaption>' + escapeHtml(pkT('sample_' + smp.id)) + '</figcaption></figure>';
    }).join('');
    // The note sits below the strip, not inside it (on phones the strip scrolls sideways).
    let note = pv.nextElementSibling;
    if (!note || !note.classList.contains('pv-note')) { note = document.createElement('p'); note.className = 'tiny pv-note'; pv.after(note); }
    note.textContent = pkT('pack_preview_note');
    note.hidden = !shots.length;
  }

  // output strip
  document.getElementById('outStrip').innerHTML = D.discovery.outputs.map(function (o) {
    const svcs = o.services.map(pkService).filter(Boolean);
    const from = Math.min.apply(null, svcs.map(function (s) { return PkCatalogCore.fromPrice(s); }));
    const smp = byId(PK_OUT_SAMPLE[o.key]);
    const thumb = smp && smp.installed && smp.thumb
      ? '<img class="out-thumb" src="' + escapeHtml(smp.thumb) + '" alt="" width="' + smp.thumbWidth + '" height="' + Math.round(smp.thumbWidth * smp.height / smp.width) + '" loading="lazy" decoding="async"' + ' style="object-position:' + (smp.width > smp.height ? 'left center' : (smp.focus || 'center top')) + '"' + '>'
      : '';
    return '<a class="out-tile' + (thumb ? ' has-thumb' : '') + '" href="#need" data-intent-go="' + escapeHtml(o.intent) + '">' + thumb + '<span class="out-ic" aria-hidden="true">' + PK_OUT_ICONS[o.key] + '</span>' +
      '<span class="out-name">' + escapeHtml(pkT('out_' + o.key)) + '</span><span class="out-from">' + escapeHtml(pkT('svc_from')) + ' ' + Rs(from) + '</span></a>';
  }).join('');

  // intents
  document.getElementById('intentChips').innerHTML = D.discovery.intents.map(function (it) {
    return '<button type="button" role="tab" class="ichip" data-intent="' + it.id + '" aria-selected="' + (it.id === P2.intent) + '">' + escapeHtml(pkT('intent_' + it.id)) + '</button>';
  }).join('');
  document.getElementById('intentResult').innerHTML = pkIntentResultHtml(P2.intent);

  // guided selector
  const opt = function (group, list, cur) {
    return list.map(function (k) { return '<button type="button" class="ochip" data-' + group + '="' + k + '" aria-pressed="' + (k === cur) + '">' + escapeHtml(pkT('sel_' + group + '_' + k)) + '</button>'; }).join('');
  };
  document.getElementById('selWhat').innerHTML = opt('what', D.discovery.selector.what, P2.what);
  document.getElementById('selGoal').innerHTML = opt('goal', D.discovery.selector.goal, P2.goal);
  document.getElementById('selResult').innerHTML = P2.what && P2.goal ? pkSelectorResultHtml(P2.what, P2.goal) : '';

  // workflow outputs
  document.getElementById('wfOuts').innerHTML = ['wa-card', 'catalogue', 'offer-post', 'reel'].map(function (k) { return '<span class="wf-out">' + escapeHtml(pkT('pack_out_' + k)) + '</span>'; }).join('') +
    '<span class="wf-out estate">' + escapeHtml(pkT('wf_estate')) + '</span><span class="wf-out estate">' + escapeHtml(pkT('wf_qr')) + '</span>';

  // pack
  document.getElementById('packSend').innerHTML = D.discovery.pack.you_send.map(function (k) { return '<li>' + escapeHtml(pkT('pack_send_' + k)) + '</li>'; }).join('');
  document.getElementById('packOpts').innerHTML = pkPackChecklistHtml(P2.pack);
  pkUpdatePackTotal();

  // samples
  const cats = ['all'].concat(D.samples.meta.categories.filter(function (c) { return D.samples.samples.some(function (x) { return x.category === c; }); }));
  document.getElementById('smpFilter').innerHTML = cats.map(function (c) {
    return '<button type="button" class="chip" data-cat="' + c + '" aria-pressed="' + (c === P2.cat) + '">' + escapeHtml(pkT('smp_cat_' + c)) + '</button>';
  }).join('');
  document.getElementById('smpGrid').innerHTML = D.samples.samples.filter(function (x) { return P2.cat === 'all' || x.category === P2.cat; }).map(pkSampleCardHtml).join('');

  pkWireWhatsAppLinks(document.getElementById('need'));
}

function pkUpdatePackTotal() {
  const root = document.getElementById('packOpts');
  const t = pkPackTotal(root);
  P2.pack = t.lines;
  document.getElementById('packTotal').textContent = Rs(t.total);
  const go = document.getElementById('packGo');
  go.href = 'dashboard.html#pack/lines/' + t.lines.map(encodeURIComponent).join(',');
  go.classList.toggle('disabled', !t.lines.length);
  go.setAttribute('aria-disabled', t.lines.length ? 'false' : 'true');
}

function pkInitP2() {
  document.addEventListener('click', function (e) {
    const go = e.target.closest('[data-intent-go]');
    if (go) { P2.intent = go.getAttribute('data-intent-go'); pkRenderP2(); pkTrack('intent', P2.intent); return; }
    const chip = e.target.closest('[data-intent]');
    if (chip) { P2.intent = chip.getAttribute('data-intent'); pkRenderP2(); pkTrack('intent', P2.intent); chip.focus(); return; }
    const w = e.target.closest('[data-what]');
    if (w) { P2.what = w.getAttribute('data-what'); pkRenderP2(); return; }
    const g = e.target.closest('[data-goal]');
    if (g) { P2.goal = g.getAttribute('data-goal'); pkRenderP2(); if (P2.what) pkTrack('selector', P2.what + ':' + P2.goal); return; }
    const c = e.target.closest('[data-cat]');
    if (c && c.closest('#smpFilter')) { P2.cat = c.getAttribute('data-cat'); pkRenderP2(); return; }
    const pg = e.target.closest('#packGo');
    if (pg && pg.classList.contains('disabled')) { e.preventDefault(); return; }
    if (pg) pkTrack('pack_start', 'landing', { lines: P2.pack });
  });
  document.getElementById('packOpts').addEventListener('change', pkUpdatePackTotal);
}

// Estate → PK handoff: /?from=estate&listing=<uuid>&intent=promote
// Only the listing id is carried; ownership is checked after login in the dashboard.
function pkHandleEstateHandoff() {
  const q = new URLSearchParams(location.search);
  if (q.get('from') !== 'estate') return false;
  const id = q.get('listing') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { pkTrack('handoff_invalid', 'estate'); return false; }
  pkTrack('handoff', 'estate');
  location.replace('dashboard.html#pack/estate/' + id.toLowerCase());
  return true;
}

document.addEventListener('DOMContentLoaded', async function () {
  if (pkHandleEstateHandoff()) return;
  pkInitTabs();
  pkInitP2();
  pkInitForms();
  try {
    await pkLoadP2Data();
    pkRenderLandingData();
    pkRenderP2();
    pkInjectSchema();
    pkOnLanguageChange(pkRenderLandingData);
    pkOnLanguageChange(pkRenderP2);
    pkTrack('page_view', 'home');
  } catch (e) {
    console.error('Could not load catalogue data', e);
  }

  // Count package views once the section scrolls into sight.
  const pk = document.getElementById('packages');
  if ('IntersectionObserver' in window && pk) {
    const io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { pkTrack('package_view', 'packages'); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(pk);
  }
});
