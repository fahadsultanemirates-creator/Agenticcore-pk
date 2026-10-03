/* ============================================
   AgenticCore Pakistan — catalogue renderers (Catalogue V2)
   Every public price, service and package on the site is drawn
   from data/services.json + data/packages.json through these
   functions. Nothing here contains a hand-typed price.
   ============================================ */

const Rs = function (n) { return PkCatalogCore.formatRs(n); };
// "from <price>" in English, "<price> سے شروع" in Urdu.
function pkFromPrice(n) { return pkT('svc_from_fmt').replace('{p}', Rs(n)); }

function pkModelName(model) {
  const m = window.PK_DATA.services.models[model];
  return m ? pkPick(m, 'name') : model;
}

// First clause of a delivery sentence, for compact rows ("Same day", "2–3 days").
function pkDeliveryShort(service) {
  return pkPick(service, 'delivery').split(/[.;(،۔]/)[0].replace(/^Delivery:\s*/, '').trim();
}

function pkPriceLineHtml(line) {
  let extra = '';
  if (line.included) extra += '<span class="extra"><strong>' + escapeHtml(pkT('svc_included')) + ':</strong> ' + escapeHtml(pkPick(line, 'included')) + '</span>';
  if (line.runs) extra += '<span class="extra"><strong>' + escapeHtml(pkT('svc_runs')) + ':</strong> ' + escapeHtml(pkPick(line, 'runs')) + '</span>';
  if (line.support) extra += '<span class="extra"><strong>' + escapeHtml(pkT('svc_support')) + ':</strong> ' + Rs(line.support) + ' ' + escapeHtml(pkT('pkg_a_month')) + '</span>';
  return '<div class="price-line"><span class="model-tag">' + escapeHtml(pkModelName(line.model)) + '</span><div>' + escapeHtml(pkPick(line, 'text')) + '</div>' + extra + '</div>';
}

function pkCautionHtml() {
  const meta = window.PK_DATA.services.meta;
  return '<div class="caution" role="note">⚠ ' + escapeHtml(pkPick(meta, 'caution_legal')) + '</div>';
}

function pkServiceFullHtml(s, opts) {
  opts = opts || {};
  const orderBtn = opts.orderButton
    ? '<div class="btn-row" style="margin-top:0.6rem"><button type="button" class="btn btn-primary btn-sm" data-order-service="' + s.no + '">' + escapeHtml(pkT('order_online')) + '</button></div>'
    : '';
  return '<article class="svc-full" id="service-' + s.no + '">' +
    '<h4><span class="no">(' + s.no + ')</span> ' + escapeHtml(pkPick(s, 'name')) + '</h4>' +
    '<p class="brief">' + escapeHtml(pkPick(s, 'brief')) + '</p>' +
    s.lines.map(pkPriceLineHtml).join('') +
    '<p class="delivery">' + escapeHtml(pkPick(s, 'delivery')) + '</p>' +
    (s.caution ? pkCautionHtml() : '') +
    (typeof pkOpenServiceDetail === 'function' ? '<button type="button" class="link svc-details-btn" data-svc="' + s.no + '">' + escapeHtml(pkT('svc_details')) + '</button>' : '') +
    orderBtn +
  '</article>';
}

function pkServicesInGroup(groupNo) {
  return window.PK_DATA.services.services.filter(function (s) { return s.group === groupNo; });
}

// The exact price for one fixed line; a "from" price when the line is a "from" price
// or the service has more than one orderable option.
function pkServicePriceLabel(s) {
  const orderable = s.lines.filter(function (l) { return !l.addon; });
  const p = PkCatalogCore.fromPrice(s);
  const isFrom = orderable.length > 1 || orderable.some(function (l) { return l.from && l.price === p; });
  return isFrom ? pkFromPrice(p) : Rs(p);
}
function pkServiceUnitLabel(s) {
  const orderable = s.lines.filter(function (l) { return !l.addon; });
  return orderable.length === 1 ? pkPick(orderable[0], 'unit') : '';
}

// Compact, clickable row: name · price · unit · delivery. Opens the service detail.
function pkServiceRowHtml(s) {
  const unit = pkServiceUnitLabel(s);
  return '<button type="button" class="svc-row" data-svc="' + s.no + '">' +
    '<span class="svc-row-name">' + escapeHtml(pkPick(s, 'name')) + '<span class="d">' + escapeHtml(pkDeliveryShort(s)) + '</span></span>' +
    '<span class="svc-row-price">' + escapeHtml(pkServicePriceLabel(s)) + (unit ? '<span class="u">' + escapeHtml(unit) + '</span>' : '') + '</span>' +
  '</button>';
}

function pkGroupCardHtml(g) {
  const list = pkServicesInGroup(g.no);
  const rows = '<div class="svc-rows">' + list.map(pkServiceRowHtml).join('') + '</div>';
  return '<div class="card group-card' + (g.secondary ? ' secondary' : '') + '" id="group-' + g.slug + '">' +
    '<span class="group-type">' + escapeHtml(pkPick(g, 'type')) + ' · ' + list.length + ' ' + escapeHtml(pkT('svc_services')) + '</span>' +
    '<h3>' + escapeHtml(pkPick(g, 'need')) + '</h3>' +
    '<p class="benefit">' + escapeHtml(pkPick(g, 'benefit')) + '</p>' +
    (g.secondary
      ? '<details class="acc"><summary>' + escapeHtml(pkT('svc_show_specialist')) + '</summary><div class="acc-body">' + rows + '</div></details>'
      : rows) +
    '<a class="card-link" data-wa="services-' + g.slug + '" data-wa-msg="I\'m interested in: ' + escapeHtml(g.type) + '." href="signup.html">' + escapeHtml(pkT('wa_about_this')) + '</a>' +
  '</div>';
}

/* ---------- packages (V2: sold on monthly output, never on calculated "savings") ---------- */
function pkPackageById(id) {
  return window.PK_DATA.packages.packages.find(function (p) { return p.id === id; }) || null;
}

function pkPackagePriceLabel(p) {
  if (typeof p.one_off === 'number') return (p.one_off_from ? pkFromPrice(p.one_off) : Rs(p.one_off)) + ' ' + pkT('pkg_one_off');
  return (p.monthly_from ? pkFromPrice(p.monthly) : Rs(p.monthly)) + ' ' + pkT('pkg_a_month');
}

function pkPackageTermsLabel(p) {
  if (typeof p.one_off === 'number') return pkPick(p, 'term_note') || pkT('pkg_no_monthly');
  const setup = p.setup_quoted ? pkT('pkg_setup_quoted')
    : (p.setup ? '+ ' + Rs(p.setup) + ' ' + pkT('pkg_setup_once') : pkT('pkg_no_setup'));
  return setup + ' · ' + pkT('pkg_min_term').replace('{n}', p.min_months);
}

function pkPackageCardHtml(p, opts) {
  opts = opts || {};
  const variant = p.variant ? pkPackageById(p.variant) : null;
  const includes = (p.includes || []).map(function (it) { return '<li>' + escapeHtml(pkPick(it, 'label')) + '</li>'; }).join('');
  const variantHtml = variant
    ? '<div class="pkg-variant"><b>' + escapeHtml(pkPick(variant, 'name')) + '</b> · ' + escapeHtml(pkPackagePriceLabel(variant)) +
      '<span class="tiny">' + escapeHtml(pkPick(variant, 'term_note')) + ' ' + escapeHtml(pkT('pkg_delivery')) + ': ' + escapeHtml(pkPick(variant, 'delivery_short')) + '</span></div>'
    : '';
  let buttons;
  if (p.quote_only) {
    buttons = opts.dashboard
      ? '<button type="button" class="btn btn-primary" data-request-proposal="' + p.id + '">' + escapeHtml(pkT('pkg_request_proposal')) + '</button>'
      : '<a class="btn btn-primary" data-wa="packages" data-wa-msg="I\'d like a proposal for ' + escapeHtml(p.name) + '." href="signup.html?intent=proposal-' + p.id + '">' + escapeHtml(pkT('pkg_request_proposal')) + '</a>';
  } else if (opts.dashboard) {
    buttons = '<button type="button" class="btn btn-primary" data-buy-package="' + p.id + '">' + escapeHtml(pkT('pkg_order')) + '</button>' +
      (variant ? '<button type="button" class="btn btn-secondary" data-buy-package="' + variant.id + '">' + escapeHtml(pkT('pkg_order_with_web')) + '</button>' : '');
  } else {
    buttons = '<a class="btn btn-primary" href="dashboard.html#order/package/' + p.id + '">' + escapeHtml(pkT('pkg_order')) + '</a>' +
      (variant ? '<a class="btn btn-secondary" href="dashboard.html#order/package/' + variant.id + '">' + escapeHtml(pkT('pkg_order_with_web')) + '</a>' : '') +
      '<a class="btn btn-wa" data-wa="packages" data-wa-msg="I\'m interested in ' + escapeHtml(p.name) + '." href="signup.html">' + escapeHtml(pkT('pkg_start_wa')) + '</a>';
  }
  return '<article class="card pkg' + (p.featured ? ' featured' : '') + '" id="pkg-' + p.id + '">' +
    (p.badge ? '<span class="badge">' + escapeHtml(pkPick(p, 'badge')) + '</span>' : '') +
    '<h3>' + escapeHtml(pkPick(p, 'name')) + '</h3>' +
    '<p class="for">' + escapeHtml(pkPick(p, 'for')) + '</p>' +
    '<div class="price">' + escapeHtml(pkPackagePriceLabel(p)) + '</div>' +
    '<div class="setup">' + escapeHtml(pkPackageTermsLabel(p)) + '</div>' +
    '<p class="delivery">' + escapeHtml(pkT('pkg_delivery')) + ': ' + escapeHtml(pkPick(p, 'delivery_short')) + '</p>' +
    '<p class="sep-label">' + escapeHtml(typeof p.one_off === 'number' ? pkT('pkg_what_you_get') : pkT('pkg_every_month')) + '</p>' +
    '<ul class="pkg-includes">' + includes + '</ul>' +
    variantHtml +
    '<details class="acc"><summary>' + escapeHtml(pkT('pkg_terms_details')) + '</summary><div class="acc-body">' +
      '<p class="tiny">' + escapeHtml(pkPick(p, 'delivery')) + '</p>' +
      '<p class="tiny"><strong>' + escapeHtml(pkT('pkg_paid_sep')) + ':</strong> ' + escapeHtml(pkPick(p, 'paid_separately')) + '</p></div></details>' +
    '<div class="btn-row">' + buttons + '</div>' +
  '</article>';
}

// Featured offer (hero): name, monthly price, minimum term, one line on who it's for.
function pkFeaturedOfferHtml(p) {
  return '<a class="feat-offer" href="#pkg-' + p.id + '">' +
    '<span class="feat-name">' + escapeHtml(pkPick(p, 'name')) + '</span>' +
    '<span class="feat-price">' + escapeHtml(pkPackagePriceLabel(p)) + '</span>' +
    '<span class="feat-term">' + escapeHtml(pkPackageTermsLabel(p)) + '</span>' +
    '<span class="feat-for">' + escapeHtml(pkPick(p, 'for')) + '</span></a>';
}
