/* ============================================
   AgenticCore Pakistan — catalogue renderers
   Every public price, service and package on the site is drawn
   from data/services.json + data/packages.json through these
   functions. Nothing here contains a hand-typed price.
   ============================================ */

const Rs = function (n) { return PkCatalogCore.formatRs(n); };

function pkModelName(model) {
  const m = window.PK_DATA.services.models[model];
  return m ? pkPick(m, 'name') : model;
}

// First clause of a delivery sentence, for compact rows ("Same day", "2–3 days").
function pkDeliveryShort(service) {
  return service.delivery.split(/[.;(]/)[0].replace(/^Delivery:\s*/, '').trim();
}

function pkPriceLineHtml(line) {
  let extra = '';
  if (line.included) extra += '<span class="extra"><strong>Included:</strong> ' + escapeHtml(line.included) + '</span>';
  if (line.runs) extra += '<span class="extra"><strong>You pay to run it:</strong> ' + escapeHtml(line.runs) + '</span>';
  if (line.support) extra += '<span class="extra"><strong>Optional support' + (line.support_text ? ' (' + escapeHtml(line.support_text) + ')' : '') + ':</strong> ' + Rs(line.support) + ' a month.</span>';
  return '<div class="price-line"><span class="model-tag">' + escapeHtml(pkModelName(line.model)) + '</span><div>' + escapeHtml(line.text) + '</div>' + extra + '</div>';
}

function pkCautionHtml() {
  const meta = window.PK_DATA.services.meta;
  return '<div class="caution" role="note">⚠ ' + escapeHtml(pkPick(meta, 'caution_56')) + '</div>';
}

function pkServiceFullHtml(s, opts) {
  opts = opts || {};
  const newTag = s.new ? ' <span class="pill pill-new">' + escapeHtml(pkT('svc_new')) + '</span>' : '';
  const orderBtn = opts.orderButton
    ? '<div class="btn-row" style="margin-top:0.6rem"><button type="button" class="btn btn-primary btn-sm" data-order-service="' + s.no + '">' + escapeHtml(pkT('order_online')) + '</button></div>'
    : '';
  return '<article class="svc-full" id="service-' + s.no + '">' +
    '<h4><span class="no">(' + s.no + ')</span> ' + escapeHtml(pkPick(s, 'name')) + newTag + '</h4>' +
    '<p class="brief">' + escapeHtml(s.brief) + '</p>' +
    s.lines.map(pkPriceLineHtml).join('') +
    '<p class="delivery">' + escapeHtml(s.delivery) + '</p>' +
    (s.caution ? pkCautionHtml() : '') +
    orderBtn +
  '</article>';
}

function pkServicesInGroup(groupNo) {
  return window.PK_DATA.services.services.filter(function (s) { return s.group === groupNo; });
}

function pkGroupCardHtml(g) {
  const list = pkServicesInGroup(g.no);
  const examples = list.slice(0, 4).map(function (s) {
    return '<div class="svc-mini"><span>' + escapeHtml(pkPick(s, 'name')) + '<span class="d">' + escapeHtml(pkDeliveryShort(s)) + '</span></span>' +
      '<span class="p">' + escapeHtml(pkT('svc_from')) + ' ' + Rs(PkCatalogCore.fromPrice(s)) + '</span></div>';
  }).join('');
  return '<div class="card group-card" id="group-' + g.slug + '">' +
    '<span class="group-type">' + escapeHtml(pkPick(g, 'type')) + '</span>' +
    '<h3>' + escapeHtml(pkPick(g, 'need')) + '</h3>' +
    '<p class="benefit">' + escapeHtml(pkPick(g, 'benefit')) + '</p>' +
    (g.note ? '<p class="group-note">' + escapeHtml(g.note) + '</p>' : '') +
    '<div>' + examples + '</div>' +
    '<details class="acc"><summary>' + escapeHtml(pkT('svc_see_all')) + ' · ' + list.length + ' ' + escapeHtml(pkT('svc_services')) + '</summary>' +
      '<div class="acc-body">' + (pkT('svc_english_note') ? '<p class="tiny">' + escapeHtml(pkT('svc_english_note')) + '</p>' : '') +
      list.map(function (s) { return pkServiceFullHtml(s); }).join('') + '</div></details>' +
    '<a class="card-link" data-wa="services-' + g.slug + '" data-wa-msg="I\'m interested in: ' + escapeHtml(g.need) + ' (' + escapeHtml(g.type) + ')." href="signup.html">' + escapeHtml(pkT('wa_about_this')) + '</a>' +
  '</div>';
}

function pkItemsListHtml(items) {
  const lines = window.PK_DATA.lines;
  return '<ul>' + (items || []).map(function (it) {
    const v = PkCatalogCore.itemValue(it, lines);
    return '<li>' + escapeHtml(it.label) + (it.service ? ' <span class="tiny">(' + it.service + ')</span>' : '') +
      ' <span class="tiny">' + (it.included ? '(' + escapeHtml(pkT('pkg_included')) + ')' : '(' + Rs(v) + ')') + '</span></li>';
  }).join('') + '</ul>';
}

function pkPackageCardHtml(p, opts) {
  opts = opts || {};
  const lines = window.PK_DATA.lines;
  const t = PkCatalogCore.packageTotals(p, lines);
  const featured = p.id === 'dealer-starter';
  let price, setup, save;
  if (typeof p.one_off === 'number') {
    price = Rs(p.one_off) + ' <small>' + escapeHtml(pkT('pkg_one_off')) + '</small>';
    setup = escapeHtml(pkT('pkg_no_monthly'));
    save = escapeHtml(pkT('pkg_bought_sep')) + ': ' + escapeHtml(pkT('pkg_at_least')) + ' ' + Rs(t.setupSeparately) + '<br>' +
      escapeHtml(pkT('pkg_you_save')) + ' <strong>' + Rs(t.setupSaving) + ' (' + t.setupSavingPct + '%)</strong>';
  } else {
    price = Rs(p.monthly) + ' <small>' + escapeHtml(pkT('pkg_a_month')) + '</small>';
    setup = (p.setup ? '+ ' + Rs(p.setup) + ' ' + escapeHtml(pkT('pkg_setup')) : escapeHtml(pkT('pkg_setup_free'))) +
      ' · ' + p.min_months + '-' + escapeHtml(pkT('pkg_months')) + ' ' + escapeHtml(pkT('pkg_min'));
    save = escapeHtml(pkT('pkg_bought_sep')) + ': ' + Rs(t.monthlySeparately) + ' ' + escapeHtml(pkT('pkg_a_month')) + ' + ' + Rs(t.setupSeparately) + ' ' + escapeHtml(pkT('pkg_setup')) + '<br>' +
      escapeHtml(pkT('pkg_you_save')) + ' <strong>' + Rs(t.monthlySaving) + ' ' + escapeHtml(pkT('pkg_a_month')) + ' (' + t.monthlySavingPct + '%)</strong>' +
      (t.setupSaving > 0 ? ' · <strong>' + Rs(t.setupSaving) + '</strong> ' + escapeHtml(pkT('pkg_on_setup')) : '');
  }
  const keyItems = (p.monthly_items || p.setup_items).slice(0, 5).map(function (it) { return '<li>' + escapeHtml(it.label) + '</li>'; }).join('');
  const details =
    (p.monthly_items ? '<p class="sep-label">' + escapeHtml(pkT('pkg_every_month')) + '</p>' + pkItemsListHtml(p.monthly_items) : '') +
    (p.setup_items ? '<p class="sep-label">' + escapeHtml(p.monthly_items ? pkT('pkg_one_off_setup') : pkT('pkg_what_you_get')) + '</p>' + pkItemsListHtml(p.setup_items) : '') +
    (p.optional_support_text ? '<p class="tiny" style="margin-top:0.5rem">' + escapeHtml(p.optional_support_text) + '</p>' : '') +
    '<p class="tiny" style="margin-top:0.5rem">' + escapeHtml(p.delivery) + '</p>';
  const orderHref = 'dashboard.html#order/package/' + p.id;
  const buttons = opts.dashboard
    ? '<button type="button" class="btn btn-primary" data-buy-package="' + p.id + '">' + escapeHtml(pkT('pkg_order')) + '</button>'
    : '<a class="btn btn-wa" data-wa="packages" data-wa-msg="I\'m interested in ' + escapeHtml(p.name) + '." href="signup.html">' + escapeHtml(pkT('pkg_start_wa')) + '</a>' +
      '<a class="btn btn-secondary" href="' + orderHref + '">' + escapeHtml(pkT('pkg_order')) + '</a>';

  return '<article class="card pkg' + (featured ? ' featured' : '') + '" id="pkg-' + p.id + '">' +
    (p.badge ? '<span class="badge">' + escapeHtml(pkPick(p, 'badge')) + '</span>' : '') +
    '<h3>' + escapeHtml(pkPick(p, 'name')) + '</h3>' +
    '<p class="for">' + escapeHtml(pkPick(p, 'for')) + '</p>' +
    '<div class="price">' + price + '</div>' +
    '<div class="setup">' + setup + '</div>' +
    '<div class="save">' + save + '</div>' +
    '<p class="delivery">' + escapeHtml(pkT('pkg_delivery')) + ': ' + escapeHtml(pkPick(p, 'delivery_short')) + '</p>' +
    '<ul>' + keyItems + '</ul>' +
    '<details class="acc"><summary>' + escapeHtml(pkT('pkg_see_everything')) + '</summary><div class="acc-body">' + details + '</div></details>' +
    '<p class="paid-sep"><strong>' + escapeHtml(pkT('pkg_paid_sep')) + ':</strong> ' + escapeHtml(p.paid_separately) + '</p>' +
    '<div class="btn-row">' + buttons + '</div>' +
  '</article>';
}
