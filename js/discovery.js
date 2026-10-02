/* ============================================
   AgenticCore Pakistan — Product 2.0 discovery layer
   'Who are you?' journeys, Property Marketing Pack, sample gallery
   and the service detail view (Catalogue V2). Everything here reads
   data/discovery.json + data/samples.json (which only POINT at
   service numbers / price-line ids) and takes every price from
   data/services.json via PkCatalogCore. No price is typed here.
   ============================================ */

async function pkLoadP2Data() {
  await pkLoadData();
  if (!window.PK_DATA.discovery) {
    const [d, s] = await Promise.all([
      fetch('data/discovery.json').then(function (r) { return r.json(); }),
      fetch('data/samples.json').then(function (r) { return r.json(); })
    ]);
    window.PK_DATA.discovery = d;
    window.PK_DATA.samples = s;
  }
  return window.PK_DATA;
}

function pkService(no) {
  return window.PK_DATA.services.services.find(function (s) { return s.no === no; }) || null;
}
function pkPackage(id) { return pkPackageById(id); }
function pkFirstLine(s) { return s.lines.find(function (l) { return !l.addon; }) || s.lines[0]; }

/* ---------- sample mock-ups (drawn when the real image isn't installed) ---------- */
function pkMockHtml(m) {
  const e = escapeHtml;
  const facts = (m.facts || []).map(function (f) { return '<span>' + e(f) + '</span>'; }).join('');
  const rows = (m.rows || []).map(function (r) { return '<div class="mk-row"><span>' + e(r[0]) + '</span><b>' + e(r[1]) + '</b></div>'; }).join('');
  switch (m.kind) {
    case 'flyer':
      return '<div class="mk mk-flyer"><div class="mk-photo"><span class="mk-tag">' + e(m.tag || '') + '</span></div><div class="mk-body"><b class="mk-title">' + e(m.title) + '</b><span class="mk-place">' + e(m.place) + '</span><span class="mk-price">' + e(m.price) + '</span><div class="mk-facts">' + facts + '</div></div></div>';
    case 'wacard':
      return '<div class="mk mk-wacard"><div class="mk-photo"></div><div class="mk-sheet"><b class="mk-title">' + e(m.title) + '</b><span class="mk-place">' + e(m.place) + '</span><div class="mk-facts">' + facts + '</div><div class="mk-cta"><span class="mk-price">' + e(m.price) + '</span><span class="mk-wa">WhatsApp</span></div></div></div>';
    case 'post':
      return '<div class="mk mk-post"><div class="mk-photo"></div><div class="mk-over"><b class="mk-title">' + e(m.title) + '</b><span class="mk-place">' + e(m.place) + '</span><div class="mk-facts">' + facts + '</div><span class="mk-price">' + e(m.price) + '</span></div></div>';
    case 'brochure':
      return '<div class="mk mk-brochure"><div class="mk-cover"><b>' + e(m.title) + '</b></div><div class="mk-page"><span class="mk-place">' + e(m.place) + '</span><div class="mk-thumbs"><i></i><i></i><i></i><i></i></div><div class="mk-facts">' + facts + '</div></div></div>';
    case 'plan':
      return '<div class="mk mk-plan"><b class="mk-title">' + e(m.title) + '</b>' + rows + '<div class="mk-bar"><i style="width:15%"></i><i style="width:60%"></i><i style="width:25%"></i></div></div>';
    case 'reel':
      return '<div class="mk mk-reel"><div class="mk-play" aria-hidden="true">▶</div><b class="mk-title">' + e(m.title) + '</b><span class="mk-place">' + e(m.place) + '</span></div>';
    case 'wachat':
      return '<div class="mk mk-wachat"><div class="mk-bubble"><div class="mk-img">' + e(m.title) + '</div><div>' + e(m.price) + '</div></div><div class="mk-bubble"><div class="mk-img alt"></div><div>' + e(m.place) + '</div></div></div>';
    case 'noc':
      return '<div class="mk mk-noc"><span class="mk-badge">✓ ' + e(m.title) + '</span>' + rows + '</div>';
    case 'qr':
      return '<div class="mk mk-qr"><div class="mk-qrbox" aria-hidden="true"></div><b class="mk-title">' + e(m.title) + '</b><span class="mk-place">' + e(m.place) + '</span></div>';
    default:
      return '<div class="mk"></div>';
  }
}

// Installed sample artwork: real pixel size in width/height (no layout shift), lazy by
// default, a smaller "thumb" in srcset for tiles, a visible on-image "Sample concept"
// badge, and alt text from the i18n files.
const PK_SMP_SIZES = '(min-width: 960px) 360px, (min-width: 600px) 46vw, 92vw';
function pkSampleVisualHtml(s, opts) {
  opts = opts || {};
  if (s.installed && s.image) {
    const style = [s.focus ? 'object-position:' + s.focus : '', s.fit ? 'object-fit:' + s.fit : ''].filter(Boolean).join(';');
    const srcset = s.thumb && s.thumbWidth ? ' srcset="' + escapeHtml(s.thumb) + ' ' + s.thumbWidth + 'w, ' + escapeHtml(s.image) + ' ' + s.width + 'w" sizes="' + (opts.sizes || PK_SMP_SIZES) + '"' : '';
    return '<div class="smp-img' + (s.light ? ' light' : '') + '">' +
      '<img src="' + escapeHtml(s.thumb || s.image) + '"' + srcset + ' alt="' + escapeHtml(pkT('alt_' + s.id)) + '" width="' + s.width + '" height="' + s.height + '"' +
        (opts.eager ? ' fetchpriority="low" decoding="async"' : ' loading="lazy" decoding="async"') + (style ? ' style="' + style + '"' : '') + '>' +
      '<span class="smp-badge">' + escapeHtml(pkT('proof_sample_label')) + '</span></div>';
  }
  return pkMockHtml(s.mock || {});
}

function pkSampleCardHtml(s) {
  const svc = (s.services || []).map(pkService).filter(Boolean)[0];
  return '<figure class="smp" data-cat="' + escapeHtml(s.category) + '">' +
    '<div class="smp-vis">' + pkSampleVisualHtml(s) + '</div>' +
    '<figcaption><span class="sample-tag">' + escapeHtml(pkT(s.live ? 'sample_live_tag' : 'proof_sample_label')) + '</span> ' + escapeHtml(pkT('sample_' + s.id)) +
      (s.live ? '' : '<span class="smp-note">' + escapeHtml(pkT('sample_illustrative')) + (s.note ? ' ' + escapeHtml(pkT(s.note)) : '') + '</span>') +
      (svc ? '<button type="button" class="smp-link" data-svc="' + svc.no + '">' + escapeHtml(pkT('p2_see_service')) + ' (' + svc.no + ') · ' + escapeHtml(pkServicePriceLabel(svc)) + '</button>' : '') +
      (s.installed && s.image && !s.live ? '<a class="smp-link" href="' + escapeHtml(s.image) + '" target="_blank" rel="noopener">' + escapeHtml(pkT('smp_full')) + ' ↗</a>' : '') +
      (s.live ? '<a class="smp-link" href="' + PK_CONFIG.estateUrl + '">' + escapeHtml(pkT('p2_on_estate')) + ' ↗</a>' : '') +
    '</figcaption></figure>';
}

/* ---------- service cards and 'Who are you?' journeys ---------- */
function pkServiceCardHtml(s) {
  const unit = pkServiceUnitLabel(s);
  return '<button type="button" class="svc-card" data-svc="' + s.no + '">' +
    '<span class="svc-card-no">(' + s.no + ')</span>' +
    '<span class="svc-card-name">' + escapeHtml(pkPick(s, 'name')) + '</span>' +
    '<span class="svc-card-brief">' + escapeHtml(pkPick(s, 'brief')) + '</span>' +
    '<span class="svc-card-foot"><b>' + escapeHtml(pkServicePriceLabel(s)) + (unit ? ' <span class="tiny">' + escapeHtml(unit) + '</span>' : '') + '</b><span>' + escapeHtml(pkDeliveryShort(s)) + '</span></span>' +
  '</button>';
}

function pkPackageMiniHtml(p) {
  return '<a class="pkg-mini" href="index.html#pkg-' + p.id + '"><b>' + escapeHtml(pkPick(p, 'name')) + '</b><span>' + escapeHtml(pkPackagePriceLabel(p)) + '</span>' +
    '<span class="tiny">' + escapeHtml(pkPackageTermsLabel(p)) + '</span><span class="tiny">' + escapeHtml(pkPick(p, 'for')) + '</span></a>';
}

function pkAudience(id) { return window.PK_DATA.discovery.audiences.find(function (a) { return a.id === id; }) || null; }
function pkJourney(id) {
  let hit = null;
  window.PK_DATA.discovery.audiences.forEach(function (a) { a.journeys.forEach(function (j) { if (j.id === id) hit = j; }); });
  return hit;
}

function pkAudienceTabsHtml(current) {
  return window.PK_DATA.discovery.audiences.map(function (a) {
    return '<button type="button" role="tab" class="aud-tab" data-aud="' + a.id + '" aria-selected="' + (a.id === current) + '">' + escapeHtml(pkT('aud_' + a.id)) + '</button>';
  }).join('');
}

function pkJourneyCardsHtml(audId, currentJourney) {
  const a = pkAudience(audId);
  if (!a) return '';
  return a.journeys.map(function (j) {
    return '<button type="button" class="journey" data-journey="' + j.id + '" aria-pressed="' + (j.id === currentJourney) + '">' +
      '<b>' + escapeHtml(pkT('jr_' + j.id)) + '</b><span>' + escapeHtml(pkT('jr_' + j.id + '_sub')) + '</span></button>';
  }).join('');
}

function pkJourneyResultHtml(journeyId) {
  const j = pkJourney(journeyId);
  if (!j) return '';
  const pkgs = (j.packages || []).map(pkPackage).filter(Boolean);
  const cards = (j.services || []).map(pkService).filter(Boolean).map(pkServiceCardHtml).join('');
  const cta = j.target === '#pack' ? pkT('p2_build_pack') : j.target === '#ai' ? pkT('ai_see_all') : pkT('jr_see_packages');
  return '<div class="intent-result">' +
    '<p class="intent-lead">' + escapeHtml(pkT('jr_' + j.id + '_lead')) + '</p>' +
    (pkgs.length ? '<div class="pkg-minis">' + pkgs.map(pkPackageMiniHtml).join('') + '</div>' : '') +
    (cards ? '<div class="svc-cards">' + cards + '</div>' : '') +
    '<a class="btn btn-primary btn-sm" href="' + j.target + '">' + escapeHtml(cta) + '</a>' +
  '</div>';
}

/* ---------- Property Marketing Pack (selection → existing order workflow) ---------- */
function pkPackOutputs() {
  return window.PK_DATA.discovery.pack.outputs.map(function (o) {
    const hit = window.PK_DATA.lines[o.line];
    return hit ? { key: o.key, line: hit.line, service: hit.service, def: Boolean(o.default) } : null;
  }).filter(Boolean);
}

function pkPackChecklistHtml(selected) {
  return pkPackOutputs().map(function (o) {
    const on = selected ? selected.indexOf(o.line.id) >= 0 : o.def;
    return '<label class="pack-opt"><input type="checkbox" data-pack-line="' + escapeHtml(o.line.id) + '"' + (on ? ' checked' : '') + '>' +
      '<span class="pack-opt-name">' + escapeHtml(pkT('pack_out_' + o.key)) + '<span class="tiny"> · (' + o.service.no + ')</span></span>' +
      '<span class="pack-opt-price">' + Rs(o.line.price) + ' <span class="tiny">' + escapeHtml(pkPick(o.line, 'unit')) + '</span></span></label>';
  }).join('');
}

function pkPackTotal(root) {
  let total = 0; const lines = [];
  root.querySelectorAll('[data-pack-line]:checked').forEach(function (i) {
    const hit = window.PK_DATA.lines[i.getAttribute('data-pack-line')];
    if (hit) { total += hit.line.price; lines.push(hit.line.id); }
  });
  return { total: total, lines: lines };
}

/* ---------- service detail (modal) ---------- */
function pkServiceDetailHtml(no) {
  const s = pkService(no);
  if (!s) return '';
  const D = window.PK_DATA;
  const group = D.services.groups.find(function (g) { return g.no === s.group; });
  const briefs = (typeof PK_BRIEF_FIELDS !== 'undefined' && PK_BRIEF_FIELDS[no]) ? PK_BRIEF_FIELDS[no].map(pkBriefLabel) : [];
  const needs = briefs.concat([pkT('sd_need_brand'), pkT('sd_need_content')]);
  const related = D.services.services.filter(function (x) { return x.group === s.group && x.no !== no; }).slice(0, 3);
  const pkgs = D.packages.packages.filter(function (p) {
    return !p.variant_of && (p.setup_items || []).some(function (it) { return it.line && s.lines.some(function (l) { return l.id === it.line; }); });
  });
  const samples = (D.samples ? D.samples.samples : []).filter(function (x) { return x.gallery !== false && (x.services || []).indexOf(no) >= 0; }).slice(0, 2);
  const orderable = s.lines.filter(function (l) { return !l.addon; });
  return '<div class="sd">' +
    '<div class="sd-head"><span class="svc-card-no">(' + s.no + ')</span><h3 id="sdTitle">' + escapeHtml(pkPick(s, 'name')) + '</h3>' +
      '<button type="button" class="sd-close" data-sd-close aria-label="' + escapeHtml(pkT('sd_close')) + '">×</button></div>' +
    '<p class="brief">' + escapeHtml(pkPick(s, 'brief')) + '</p>' +
    '<div class="sd-grid">' +
      '<div><h4>' + escapeHtml(pkT('sd_you_get')) + '</h4>' + s.lines.map(pkPriceLineHtml).join('') + '</div>' +
      '<div>' +
        '<h4>' + escapeHtml(pkT('sd_for')) + '</h4><p>' + escapeHtml(group ? pkPick(group, 'type') : '') + '</p>' +
        '<h4>' + escapeHtml(pkT('sd_we_need')) + '</h4><ul class="sd-list">' + needs.map(function (n) { return '<li>' + escapeHtml(n) + '</li>'; }).join('') + '</ul>' +
        '<h4>' + escapeHtml(pkT('sd_delivery')) + '</h4><p>' + escapeHtml(pkPick(s, 'delivery')) + '</p>' +
      '</div>' +
    '</div>' +
    (s.caution ? pkCautionHtml() : '') +
    (samples.length ? '<h4>' + escapeHtml(pkT('sd_example')) + '</h4><div class="sd-samples">' + samples.map(pkSampleCardHtml).join('') + '</div>' : '') +
    (pkgs.length ? '<h4>' + escapeHtml(pkT('sd_in_package')) + '</h4><div class="pkg-minis">' + pkgs.map(pkPackageMiniHtml).join('') + '</div>' : '') +
    (related.length ? '<h4>' + escapeHtml(pkT('sd_related')) + '</h4><div class="sd-related">' + related.map(function (r) {
      return '<button type="button" class="smp-link" data-svc="' + r.no + '">(' + r.no + ') ' + escapeHtml(pkPick(r, 'name')) + ' · ' + escapeHtml(pkServicePriceLabel(r)) + '</button>';
    }).join('') + '</div>' : '') +
    '<div class="btn-row sd-cta">' + orderable.map(function (l) {
      return '<a class="btn btn-primary" href="dashboard.html#order/line/' + escapeHtml(l.id) + '">' + escapeHtml(pkT('order_online')) +
        (orderable.length > 1 ? ' · ' + escapeHtml(pkPick(l, 'unit')) : '') + '</a>';
    }).join('') +
      '<a class="btn btn-wa" data-wa="service-' + s.no + '" data-wa-msg="I\'m interested in (' + s.no + ') ' + escapeHtml(s.name) + '." href="signup.html">' + escapeHtml(pkT('wa_about_this')) + '</a></div>' +
  '</div>';
}

let pkSdReturnFocus = null;
function pkOpenServiceDetail(no) {
  let dlg = document.getElementById('pkSd');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'pkSd'; dlg.className = 'sd-dialog';
    dlg.setAttribute('aria-labelledby', 'sdTitle');
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-sd-close]')) { dlg.close(); return; }
      const other = e.target.closest('[data-svc]');
      if (other) { e.preventDefault(); pkFillServiceDetail(dlg, Number(other.getAttribute('data-svc'))); }
    });
    dlg.addEventListener('close', function () { if (pkSdReturnFocus) pkSdReturnFocus.focus(); });
  }
  pkSdReturnFocus = document.activeElement;
  pkFillServiceDetail(dlg, no);
  if (!dlg.open) dlg.showModal();
  pkTrack('service_detail', 'service-' + no);
}
function pkFillServiceDetail(dlg, no) {
  dlg.innerHTML = pkServiceDetailHtml(no);
  pkWireWhatsAppLinks(dlg);
  dlg.scrollTop = 0;
  const h = dlg.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
}

// One delegated listener: any [data-svc] outside the dialog opens the detail view.
document.addEventListener('click', function (e) {
  const b = e.target.closest('[data-svc]');
  if (!b || b.closest('#pkSd')) return;
  if (!window.PK_DATA || !window.PK_DATA.services) return;
  e.preventDefault();
  pkOpenServiceDetail(Number(b.getAttribute('data-svc')));
});
