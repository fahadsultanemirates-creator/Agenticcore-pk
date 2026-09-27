/* ============================================
   AgenticCore Pakistan — client dashboard
   Hash routes: #home #order #order/package/<id> #order/line/<line_id>
   #tasks #task/<ACPK-id> #deliveries #invoices #usage #points
   #listings #profile #support
   ============================================ */

const Dash = { user: null, settings: null, tasks: [], view: null };

// Service-specific brief fields (B3). Anything not listed gets a free-text brief.
const PK_BRIEF_FIELDS = {
  4: [['project', 'Project name'], ['plot_sizes', 'Plot / unit sizes'], ['down_payment', 'Down payment'], ['instalments', 'Instalments (number and amount)'], ['balloon', 'Balloon / possession payments']],
  5: [['project', 'Society / project name'], ['plots', 'Approximate number of plots']],
  6: [['project', 'Project name'], ['pages', 'Number of pages']],
  8: [['project', 'Project name'], ['approvals', 'Authorities and approval numbers (only approvals you can show us)']],
  11: [['rates', 'Current rates / offer']],
  13: [['project', 'Project name'], ['audience', 'Investor audience (overseas, institutional…)']],
  14: [['business', 'Business name'], ['pages', 'Pages you need'], ['domain', 'Domain (if you have one)']],
  15: [['project', 'Property / project name'], ['domain', 'Domain (if you have one)']],
  21: [['language', 'Language (English, Urdu or both)'], ['script', 'Key points or script']],
  22: [['language', 'Language (English or Urdu)'], ['message', 'Update or campaign message']],
  23: [['message', 'Message and offer'], ['music', 'Music style']],
  36: [['platforms', 'Platform(s): Meta, Google, TikTok'], ['budget', 'Monthly ad budget you will pay the platform']],
  37: [['project', 'Project facts to use']],
  56: [['agreement_type', 'Sale, purchase or rental'], ['parties', 'Party names (as on CNIC)'], ['property', 'Property details'], ['amount', 'Amount and payment terms']]
};

function $(sel, root) { return (root || document).querySelector(sel); }
function view() { return document.getElementById('view'); }
function setView(html) { const v = view(); v.innerHTML = html; pkTranslate(v); pkWireWhatsAppLinks(v); return v; }
function money(n) { return Rs(n || 0); }

function waTaskLink(t) {
  return '<a class="btn btn-wa btn-sm" data-wa="dashboard-task" data-wa-msg="About my task ' + escapeHtml(t.public_id) + ' (' + escapeHtml(t.title) + '):" href="#support">WhatsApp us about ' + escapeHtml(t.public_id) + '</a>';
}

async function refreshTasks() {
  const res = await PkDB.listTasks();
  Dash.tasks = res.tasks;
  const waiting = Dash.tasks.filter(function (t) { return t.status === 'waiting_on_you' || t.status === 'ready_for_review'; }).length;
  const badge = document.getElementById('navWaiting');
  badge.textContent = waiting;
  badge.classList.toggle('hidden', !waiting);
  return res;
}

/* ---------------- B2 Home ---------------- */
async function viewHome() {
  const [tasksRes, invoices, subs, kit] = await Promise.all([refreshTasks(), PkDB.listInvoices(), PkDB.listSubscriptions(), PkDB.getBrandKit(Dash.user.id)]);
  if (tasksRes.error) { setView(setupNotice(tasksRes.error)); return; }
  const tasks = Dash.tasks;
  const name = (Dash.settings && Dash.settings.business_name) || Dash.user.full_name;
  let logo = '<span class="avatar">' + escapeHtml((name || '?').charAt(0).toUpperCase()) + '</span>';
  const logoFile = kit && (kit.files || []).find(function (f) { return f.kind === 'logo_light' || f.kind === 'logo_dark'; });
  if (logoFile) {
    const url = await PkDB.signedUrl('pk-brand-kits', logoFile.path);
    if (url) logo = '<img src="' + escapeHtml(url) + '" alt="">';
  }

  const waiting = tasks.filter(function (t) { return t.status === 'waiting_on_you'; });
  const review = tasks.filter(function (t) { return t.status === 'ready_for_review'; });
  const due = invoices.filter(function (i) { return i.status === 'due' || i.status === 'part_paid'; });
  const actions = [];
  if (waiting.length) actions.push('<a class="action-card" href="#tasks/waiting">' + waiting.length + ' task' + (waiting.length > 1 ? 's' : '') + ' waiting on you <span>→</span></a>');
  if (review.length) actions.push('<a class="action-card" href="#deliveries">' + review.length + ' deliver' + (review.length > 1 ? 'ies' : 'y') + ' ready for review <span>→</span></a>');
  due.slice(0, 2).forEach(function (i) { actions.push('<a class="action-card" href="#invoices">Invoice ' + escapeHtml(i.number) + ' due · ' + money(i.amount - i.paid_amount) + ' <span>→</span></a>'); });
  if (!actions.length) actions.push('<div class="action-card ok">Nothing needs you right now.</div>');

  const active = tasks.filter(function (t) { return PK_CLOSED.indexOf(t.status) < 0; }).slice(0, 3);
  const activeSub = subs.find(function (s) { return s.status === 'active'; });
  let usageHtml = '<p class="muted">No active package. <a class="link" href="#order/packages">See packages</a></p>';
  if (activeSub) usageHtml = await usageSummaryHtml(activeSub, true);

  const empty = !tasks.length
    ? '<div class="card section-card"><h2 style="margin-top:0">Start your first order</h2><p class="muted">Pick a single service or a money-saving package. Every order gets a task ID and a delivery time.</p>' +
      '<div class="btn-row" style="margin-top:0.8rem"><a class="btn btn-primary" href="#order">Browse services</a><a class="btn btn-secondary" href="#order/packages">See packages</a></div></div>'
    : '';

  setView(
    '<div class="greet">' + logo + '<div><h1>Assalam-o-Alaikum, ' + escapeHtml(name) + '</h1><p class="muted" style="margin:0">' + escapeHtml(Dash.user.email || '') + '</p></div></div>' +
    '<div class="action-cards">' + actions.join('') + '</div>' +
    empty +
    '<h2>Active tasks</h2>' + (active.length ? active.map(function (t) { return pkTaskRowHtml(t, '#task/' + t.public_id); }).join('') + '<a class="link" href="#tasks">All tasks</a>' : '<p class="muted">No active tasks.</p>') +
    '<h2>Package usage</h2><div class="card">' + usageHtml + '</div>' +
    '<h2>Points</h2><div class="stat-row"><div class="card stat"><div class="v">' + (Dash.user.points || 0).toLocaleString('en-PK') + '</div><div class="l">AgenticCore Points (1 point = Rs 1)</div></div>' +
    '<a class="card stat" href="#points"><div class="v">10%</div><div class="l">of what your direct referrals spend →</div></a></div>' +
    '<div class="btn-row" style="margin-top:var(--space-md)"><a class="btn btn-primary" href="#order">New order</a>' +
    '<a class="btn btn-wa" data-wa="dashboard-home" data-wa-msg="I\'m ' + escapeHtml(Dash.user.full_name) + ', a client." href="#support">WhatsApp us</a>' +
    '<a class="btn btn-secondary" href="#profile">Upload brand kit</a></div>'
  );
}

function setupNotice(error) {
  return '<div class="notice setup-notice"><strong>The order system is not switched on yet.</strong> Your account works, but the ordering tables have not been installed on the database. (' + escapeHtml(error) + ')</div>' +
    '<p>You can still browse <a class="link" href="services.html">all services</a> and <a class="link" href="index.html#packages">packages</a>.</p>';
}

/* ---------------- B3 Order ---------------- */
function viewOrder(sub) {
  const D = window.PK_DATA;
  if (sub && sub[0] === 'package' && sub[1]) { viewOrderPackages(sub[1]); return; }
  if (sub && sub[0] === 'packages') { viewOrderPackages(); return; }
  if (sub && sub[0] === 'line' && sub[1]) { setTimeout(function () { openOrderForm(sub[1]); }, 0); }

  setView(
    '<h1 data-i18n="d_order">New order</h1>' +
    '<div class="chips" role="tablist"><button class="chip" aria-pressed="true">Services</button><a class="chip" style="display:inline-flex;align-items:center" href="#order/packages">Packages</a></div>' +
    '<div class="toolbar"><input type="search" id="svcSearch" placeholder="Search services, e.g. brochure, bot, reel" aria-label="Search services">' +
    '<a class="btn btn-wa btn-sm" data-wa="dashboard-order" data-wa-msg="I\'d like to order:" href="#support">Order on WhatsApp instead</a></div>' +
    '<div id="svcPickList"></div>'
  );
  function render(q) {
    q = (q || '').toLowerCase();
    $('#svcPickList').innerHTML = D.services.groups.map(function (g) {
      const list = pkServicesInGroup(g.no).filter(function (s) { return !q || (s.name + ' ' + s.brief + ' ' + (s.name_ur || '')).toLowerCase().indexOf(q) >= 0; });
      if (!list.length) return '';
      return '<details class="acc"' + (q ? ' open' : '') + '><summary>' + escapeHtml(pkPick(g, 'need')) + ' <span class="tiny">' + list.length + '</span></summary><div class="acc-body">' +
        list.map(function (s) {
          return '<div class="svc-full"><h4><span class="no">(' + s.no + ')</span> ' + escapeHtml(pkPick(s, 'name')) + '</h4><p class="brief">' + escapeHtml(s.brief) + '</p>' +
            s.lines.filter(function (l) { return !l.addon; }).map(function (l) {
              return '<div class="svc-pick"><span><span class="model-tag">' + escapeHtml(pkModelName(l.model)) + '</span><br>' + escapeHtml(l.unit) + '</span>' +
                '<span><span class="p">' + (l.from ? 'from ' : '') + money(l.price) + '</span> <button class="btn btn-primary btn-sm" data-line="' + l.id + '">Choose</button></span></div>';
            }).join('') +
            '<p class="delivery">' + escapeHtml(s.delivery) + '</p>' + (s.caution ? pkCautionHtml() : '') + '</div>';
        }).join('') + '</div></details>';
    }).join('') || '<p class="muted">No services match.</p>';
  }
  render('');
  $('#svcSearch').addEventListener('input', function (e) { render(e.target.value); });
  $('#svcPickList').addEventListener('click', function (e) {
    const b = e.target.closest('[data-line]');
    if (b) openOrderForm(b.getAttribute('data-line'));
  });
}

function openOrderForm(lineId) {
  const hit = window.PK_DATA.lines[lineId];
  if (!hit) return;
  const s = hit.service, l = hit.line;
  const fields = (PK_BRIEF_FIELDS[s.no] || []).map(function (f) {
    return '<div class="field"><label for="bf_' + f[0] + '">' + escapeHtml(f[1]) + '</label><input id="bf_' + f[0] + '" data-brief="' + f[0] + '"></div>';
  }).join('');
  const extraLine = s.lines.find(function (x) { return x.addon; });
  const dlg = pkDialog(
    '<form id="orderForm" method="dialog">' +
    '<h3>(' + s.no + ') ' + escapeHtml(s.name) + '</h3>' +
    '<p class="tiny"><span class="model-tag">' + escapeHtml(pkModelName(l.model)) + '</span> ' + escapeHtml(l.text) + '</p>' +
    '<div class="field"><label for="ofQty">Quantity (' + escapeHtml(l.unit) + ')</label><input id="ofQty" type="number" min="1" max="100" value="1" inputmode="numeric"></div>' +
    (extraLine ? '<div class="field"><label for="ofExtra">' + escapeHtml(extraLine.text) + ' How many extra pages?</label><input id="ofExtra" type="number" min="0" max="100" value="0" inputmode="numeric"></div>' : '') +
    fields +
    '<div class="field"><label for="ofBrief">Anything else we should know</label><textarea id="ofBrief" placeholder="Text, offers, references, deadlines…"></textarea></div>' +
    '<div class="field"><label for="ofFiles">Attach files (logo, photos, plans)</label><input id="ofFiles" type="file" multiple></div>' +
    '<label class="check"><input type="checkbox" id="ofBrand" checked> Use my brand kit</label>' +
    (s.caution ? pkCautionHtml() : '') +
    '<div class="review-box" id="ofReview"></div>' +
    '<div class="form-msg" id="ofMsg"></div>' +
    '<div class="btn-row"><button class="btn btn-primary" type="submit" id="ofSubmit">Place order</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div>' +
    '</form>'
  );
  function review() {
    const qty = Math.max(1, parseInt($('#ofQty', dlg).value, 10) || 1);
    const extra = extraLine ? Math.max(0, parseInt($('#ofExtra', dlg).value, 10) || 0) : 0;
    const total = l.price * qty + (extraLine ? extraLine.price * extra : 0);
    const now = new Date();
    const hourPkt = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', hour12: false }).format(now), 10);
    const cutoff = window.PK_DATA.services.meta.cutoff_hour_pkt;
    $('#ofReview', dlg).innerHTML =
      '<div class="total">' + (l.from ? 'from ' : '') + money(total) + '</div>' +
      '<div>' + escapeHtml(s.delivery) + '</div>' +
      '<div class="tiny" style="margin-top:0.3rem">Same-day work counts from when your details, content and payment are all in, if that happens by ' + (cutoff > 12 ? cutoff - 12 + 'pm' : cutoff + 'am') + ' PKT. ' +
      (hourPkt >= cutoff ? 'It is past the cut-off now, so same-day work confirmed today will be delivered tomorrow.' : '') + '</div>' +
      (l.model === 'monthly' ? '<div class="tiny">Monthly fees are paid in advance.</div>' : '<div class="tiny">One-off work is usually paid half at the start and half on delivery.</div>');
  }
  review();
  dlg.addEventListener('input', review);
  $('#orderForm', dlg).addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = $('#ofSubmit', dlg); btn.disabled = true; btn.textContent = pkT('auth_wait');
    const details = {};
    dlg.querySelectorAll('[data-brief]').forEach(function (i) { if (i.value.trim()) details[i.getAttribute('data-brief')] = i.value.trim(); });
    if ($('#ofBrief', dlg).value.trim()) details.brief = $('#ofBrief', dlg).value.trim();
    const items = [{ line_id: l.id, quantity: parseInt($('#ofQty', dlg).value, 10) || 1, details: details, use_brand_kit: $('#ofBrand', dlg).checked }];
    const extra = extraLine ? parseInt($('#ofExtra', dlg).value, 10) || 0 : 0;
    if (extra > 0) items.push({ line_id: extraLine.id, quantity: extra, details: { for: 'extra pages' }, use_brand_kit: true });
    const res = await PkDB.placeOrder(items);
    if (res.error) {
      btn.disabled = false; btn.textContent = 'Place order';
      $('#ofMsg', dlg).textContent = res.error; $('#ofMsg', dlg).className = 'form-msg error';
      return;
    }
    const first = res.rows[0];
    const files = $('#ofFiles', dlg).files;
    if (files && files.length) {
      const task = { id: first.task_id, public_id: first.public_id };
      for (let i = 0; i < files.length; i++) await PkDB.uploadAttachment(Dash.user.id, task, files[i]);
    }
    pkTrack('first_order', 'dashboard');
    dlg.close();
    pkDialog('<h3>Order received</h3><p>Your task ID' + (res.rows.length > 1 ? 's are ' : ' is ') + '<strong class="mono gold">' + res.rows.map(function (r) { return escapeHtml(r.public_id); }).join(', ') + '</strong>.</p>' +
      '<p class="muted" style="margin:0.6rem 0">Invoice <strong>' + escapeHtml(first.invoice_number) + '</strong> is in your Invoices. Our team will confirm the payment details with you directly. Please only pay to an account our team confirms in writing.</p>' +
      '<p class="muted">The delivery clock starts once your details, content and payment are all in. You can add details and files on the task page.</p>' +
      '<div class="btn-row" style="margin-top:0.8rem"><a class="btn btn-primary" href="#task/' + escapeHtml(first.public_id) + '" data-close>Open ' + escapeHtml(first.public_id) + '</a><button class="btn btn-secondary" data-close>Close</button></div>');
  });
}

function viewOrderPackages(focusId) {
  const P = window.PK_DATA.packages;
  setView(
    '<h1 data-i18n="d_order">New order</h1>' +
    '<div class="chips"><a class="chip" style="display:inline-flex;align-items:center" href="#order">Services</a><button class="chip" aria-pressed="true">Packages</button></div>' +
    '<p class="page-sub">' + escapeHtml(pkPick(P.meta, 'monthly_includes')) + '</p>' +
    '<div class="grid grid-2">' + P.packages.map(function (p) { return pkPackageCardHtml(p, { dashboard: true }); }).join('') + '</div>'
  );
  view().addEventListener('click', function (e) {
    const b = e.target.closest('[data-buy-package]');
    if (b) buyPackageDialog(b.getAttribute('data-buy-package'));
  });
  if (focusId) {
    const el = document.getElementById('pkg-' + focusId);
    if (el) { el.scrollIntoView({ block: 'start' }); buyPackageDialog(focusId); }
  }
}

function buyPackageDialog(id) {
  const p = window.PK_DATA.packages.packages.find(function (x) { return x.id === id; });
  if (!p) return;
  const firstPay = typeof p.one_off === 'number' ? p.one_off : (p.setup || 0) + p.monthly;
  const terms = typeof p.one_off === 'number'
    ? escapeHtml(p.term_note || '')
    : p.min_months + '-month minimum. Monthly fees are paid in advance. The set-up discount applies when you stay for the minimum term.';
  const dlg = pkDialog(
    '<form id="pkgForm"><h3>' + escapeHtml(p.name) + '</h3>' +
    '<div class="review-box"><div class="total">' + money(firstPay) + '</div><div>' + (typeof p.one_off === 'number' ? 'One-off payment' : (p.setup ? 'Set-up ' + money(p.setup) : 'Set-up included free') + ' + first month ' + money(p.monthly)) + '</div>' +
    '<div class="tiny" style="margin-top:0.3rem">' + escapeHtml(p.delivery) + '</div></div>' +
    '<p class="tiny">' + terms + '</p><p class="tiny"><strong>Paid separately:</strong> ' + escapeHtml(p.paid_separately) + '</p>' +
    '<label class="check"><input type="checkbox" id="pkgTerms" required> I accept the package terms</label>' +
    '<div class="form-msg" id="pkgMsg"></div>' +
    '<div class="btn-row"><button class="btn btn-primary" type="submit">Order package</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>'
  );
  $('#pkgForm', dlg).addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!$('#pkgTerms', dlg).checked) return;
    const res = await PkDB.buyPackage(p.id);
    if (res.error) { $('#pkgMsg', dlg).textContent = res.error; $('#pkgMsg', dlg).className = 'form-msg error'; return; }
    dlg.close();
    pkDialog('<h3>Package ordered</h3><p>We created a set-up task for each item, each with its own task ID. Invoice <strong>' + escapeHtml(res.row.invoice_number) + '</strong> is in your Invoices; our team will confirm payment details with you directly.</p>' +
      '<div class="btn-row" style="margin-top:0.8rem"><a class="btn btn-primary" href="#tasks" data-close>See my tasks</a></div>');
  });
}

/* ---------------- B4 My tasks ---------------- */
async function viewTasks(sub) {
  const res = await refreshTasks();
  if (res.error) { setView(setupNotice(res.error)); return; }
  const filters = { active: 'chip_active', waiting: 'chip_waiting', delivered: 'chip_delivered', all: 'chip_all' };
  let current = (sub && sub[0]) || 'active';
  setView('<h1 data-i18n="d_tasks">My tasks</h1>' +
    '<div class="chips">' + Object.keys(filters).map(function (k) { return '<button class="chip" data-f="' + k + '" aria-pressed="' + (k === current) + '" data-i18n="' + filters[k] + '"></button>'; }).join('') + '</div>' +
    '<div class="toolbar"><input type="search" id="taskSearch" placeholder="Search by task ID, e.g. ACPK-0142" aria-label="Search by task ID"></div><div id="taskList"></div>');
  function render() {
    const q = $('#taskSearch').value.trim().toUpperCase();
    const list = Dash.tasks.filter(function (t) {
      if (q) return t.public_id.indexOf(q) >= 0 || t.title.toUpperCase().indexOf(q) >= 0;
      if (current === 'active') return PK_CLOSED.indexOf(t.status) < 0;
      if (current === 'waiting') return t.status === 'waiting_on_you';
      if (current === 'delivered') return t.status === 'delivered';
      return true;
    });
    $('#taskList').innerHTML = list.length ? list.map(function (t) { return pkTaskRowHtml(t, '#task/' + t.public_id); }).join('') : '<p class="muted">No tasks here.</p>';
  }
  render();
  view().querySelectorAll('[data-f]').forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.getAttribute('data-f');
      view().querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });
  $('#taskSearch').addEventListener('input', render);
}

async function viewTask(sub) {
  const t = await PkDB.getTaskByPublicId(decodeURIComponent(sub[0] || ''));
  if (!t) { setView('<p>Task not found. <a class="link" href="#tasks">Back to my tasks</a></p>'); return; }
  const [events, messages, attachments, revisions, delivs] = await Promise.all([
    PkDB.taskEvents(t.id), PkDB.taskMessages(t.id), PkDB.taskAttachments(t.id), PkDB.taskRevisions(t.id),
    PkDB.listDeliverables().then(function (d) { return d.filter(function (x) { return x.task_id === t.id; }); })
  ]);
  const due = pkDueInfo(t);
  const canCancel = ['received', 'waiting_on_you', 'confirmed'].indexOf(t.status) >= 0;
  const missing = t.status === 'waiting_on_you' && t.missing && t.missing.length
    ? '<p style="margin-top:0.6rem"><strong>What we still need:</strong></p><ul class="missing-list">' + t.missing.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') + '</ul>' +
      (t.missing.indexOf('Payment') >= 0 ? '<p class="tiny" style="margin-top:0.4rem">Payment: see <a class="link" href="#invoices">Invoices</a>. Our team confirms payment details with you directly.</p>' : '')
    : '';

  const attachList = attachments.length
    ? '<div class="file-chips">' + attachments.map(function (a) { return '<button class="file-chip" data-att="' + escapeHtml(a.path) + '">📎 ' + escapeHtml(a.name || 'file') + '</button>'; }).join('') + '</div>' : '';

  const delivHtml = delivs.length ? delivs.map(delivRowHtml).join('') : '<p class="muted">No files delivered yet.</p>';
  const reviewBtns = t.status === 'ready_for_review'
    ? '<div class="btn-row" style="margin:0.6rem 0"><button class="btn btn-primary" id="tApprove">Approve</button><button class="btn btn-secondary" id="tChanges">Request changes (round ' + (t.revisions_used + 1) + ' of 2)</button></div>' : '';

  setView(
    '<p><a class="link" href="#tasks">← My tasks</a></p>' +
    '<h1><span class="mono gold">' + escapeHtml(t.public_id) + '</span></h1>' +
    '<p style="margin:0.2rem 0 0.4rem">' + escapeHtml(t.title) + (t.quantity > 1 ? ' × ' + t.quantity : '') + ' ' + pkStatusPill(t.status) + '</p>' +
    '<p class="countdown ' + due.cls + '">' + escapeHtml(due.text) + '</p>' + missing +
    '<div class="btn-row" style="margin:var(--space-sm) 0">' +
      (PK_CLOSED.indexOf(t.status) < 0 ? '<button class="btn btn-secondary btn-sm" id="tDetails">Add details</button><label class="btn btn-secondary btn-sm" style="cursor:pointer">Upload files<input type="file" id="tUpload" multiple hidden></label>' : '') +
      (canCancel ? '<button class="btn btn-danger btn-sm" id="tCancel">Cancel</button>' : '') +
      (t.status === 'delivered' && t.line_id ? '<a class="btn btn-primary btn-sm" href="#order/line/' + escapeHtml(t.line_id) + '">Reorder</a>' : '') +
      waTaskLink(t) +
    '</div>' +
    '<div class="grid grid-2">' +
      '<div class="card"><h2 style="margin-top:0">Deliveries</h2>' + reviewBtns + delivHtml +
        (t.revisions_used >= 2 && t.status === 'ready_for_review' ? '<p class="tiny">Both free rounds of changes are used. Further changes are quoted separately. <a class="link" data-wa="dashboard-quote" data-wa-msg="I need further changes on ' + escapeHtml(t.public_id) + '. Please send a quote." href="#support">Get a quote</a></p>' : '') +
        (revisions.length ? '<h2>Changes requested</h2>' + revisions.map(function (r) { return '<p class="tiny"><strong>Round ' + r.round + ' of 2:</strong> ' + escapeHtml(r.note) + '</p>'; }).join('') : '') +
      '</div>' +
      '<div class="card"><h2 style="margin-top:0">Status timeline</h2>' + pkTimelineHtml(events) + '</div>' +
    '</div>' +
    '<div class="grid grid-2" style="margin-top:var(--space-md)">' +
      '<div class="card"><h2 style="margin-top:0">Your brief</h2>' + pkDetailsHtml(t.details) + (t.use_brand_kit ? '<p class="tiny" style="margin-top:0.5rem">✓ Using your brand kit</p>' : '') + attachList + '</div>' +
      '<div class="card"><h2 style="margin-top:0">Messages</h2><div class="thread" id="thread">' +
        (messages.length ? messages.map(function (m) { return '<div class="msg ' + (m.from_team ? 'team' : 'me') + '">' + escapeHtml(m.body) + '<span class="when">' + (m.from_team ? 'AgenticCore team' : 'You') + ' · ' + escapeHtml(pkWhen(m.created_at)) + (m.via !== 'web' ? ' · via ' + m.via : '') + '</span></div>'; }).join('') : '<p class="muted">No messages yet.</p>') +
        '</div><form id="msgForm" class="copy-box"><input id="msgBody" placeholder="Write a message about ' + escapeHtml(t.public_id) + '" required maxlength="4000"><button class="btn btn-primary btn-sm" type="submit">Send</button></form></div>' +
    '</div>'
  );

  const v = view();
  v.querySelectorAll('[data-att]').forEach(function (b) {
    b.addEventListener('click', async function () { const url = await PkDB.signedUrl('pk-attachments', b.getAttribute('data-att')); if (url) window.open(url, '_blank', 'noopener'); });
  });
  wireDeliverables(v);
  $('#msgForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const body = $('#msgBody').value.trim();
    if (!body) return;
    const r = await PkDB.postMessage(t.id, body);
    if (r.error) { pkToast(r.error); return; }
    viewTask(sub);
  });
  const up = $('#tUpload');
  if (up) up.addEventListener('change', async function () {
    for (let i = 0; i < up.files.length; i++) {
      const r = await PkDB.uploadAttachment(Dash.user.id, t, up.files[i]);
      if (r.error) { pkToast(r.error); return; }
    }
    pkToast('Uploaded'); viewTask(sub);
  });
  const det = $('#tDetails');
  if (det) det.addEventListener('click', function () {
    const dlg = pkDialog('<form id="detForm"><h3>Add details to ' + escapeHtml(t.public_id) + '</h3><div class="field"><label for="detText">Details</label><textarea id="detText" required></textarea></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>');
    $('#detForm', dlg).addEventListener('submit', async function (e) {
      e.preventDefault();
      const text = $('#detText', dlg).value.trim();
      const r = await PkDB.addDetails(t.id, { ['note_' + new Date().toISOString().slice(0, 16)]: text }, text);
      if (r.error) { pkToast(r.error); return; }
      dlg.close(); viewTask(sub);
    });
  });
  const cancel = $('#tCancel');
  if (cancel) cancel.addEventListener('click', async function () {
    if (!confirm('Cancel ' + t.public_id + '?')) return;
    const r = await PkDB.cancelTask(t.id);
    if (r.error) { pkToast(r.error); return; }
    viewTask(sub);
  });
  const approve = $('#tApprove');
  if (approve) approve.addEventListener('click', function () { approveTask(t, function () { viewTask(sub); }); });
  const changes = $('#tChanges');
  if (changes) changes.addEventListener('click', function () { requestChangesDialog(t, function () { viewTask(sub); }); });
}

async function approveTask(t, done) {
  const r = await PkDB.approveDelivery(t.id);
  if (r.error) { pkToast(r.error); return; }
  pkToast(t.public_id + ' approved. Thank you!');
  done();
}

function requestChangesDialog(t, done) {
  if (t.revisions_used >= 2) {
    pkDialog('<h3>Further changes</h3><p>Both free rounds of changes on ' + escapeHtml(t.public_id) + ' are used. Further changes are quoted separately.</p>' +
      '<div class="btn-row" style="margin-top:0.8rem"><a class="btn btn-wa" data-wa="dashboard-quote" data-wa-msg="I need further changes on ' + escapeHtml(t.public_id) + '. Please send a quote." href="#support">Get a quote</a><button class="btn btn-secondary" data-close>Close</button></div>');
    pkWireWhatsAppLinks(document.getElementById('dlg'));
    return;
  }
  const dlg = pkDialog('<form id="chgForm"><h3>Request changes · round ' + (t.revisions_used + 1) + ' of 2</h3>' +
    '<div class="field"><label for="chgText">What should we change?</label><textarea id="chgText" required></textarea></div>' +
    '<div class="field"><label for="chgFile">Marked-up image (optional)</label><input type="file" id="chgFile" accept="image/*,application/pdf"></div>' +
    '<div class="form-msg" id="chgMsg"></div>' +
    '<div class="btn-row"><button class="btn btn-primary" type="submit">Send</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>');
  $('#chgForm', dlg).addEventListener('submit', async function (e) {
    e.preventDefault();
    let path = null;
    const f = $('#chgFile', dlg).files[0];
    if (f) { const up = await PkDB.uploadAttachment(Dash.user.id, t, f); if (up.error) { $('#chgMsg', dlg).textContent = up.error; $('#chgMsg', dlg).className = 'form-msg error'; return; } path = up.path; }
    const r = await PkDB.requestChanges(t.id, $('#chgText', dlg).value.trim(), path);
    if (r.error) { $('#chgMsg', dlg).textContent = r.error; $('#chgMsg', dlg).className = 'form-msg error'; return; }
    dlg.close(); done();
  });
}

/* ---------------- B5 Deliveries ---------------- */
function delivRowHtml(d) {
  const task = d.pk_tasks || {};
  const icon = { image: 'IMG', pdf: 'PDF', video: 'VIDEO', link: 'LINK', file: 'FILE' }[d.kind] || 'FILE';
  return '<div class="deliv" data-deliv="' + d.id + '">' +
    '<div class="thumb" data-thumb="' + (d.kind === 'image' && d.path ? escapeHtml(d.path) : '') + '">' + icon + '</div>' +
    '<div><div><span class="mono gold">' + escapeHtml(task.public_id || '') + '</span> · v' + d.version + '</div><div>' + escapeHtml(d.label || task.title || '') + '</div><div class="tiny">' + escapeHtml(pkWhen(d.created_at)) + '</div></div>' +
    '<div class="actions">' +
      (d.path ? '<button class="btn btn-secondary btn-sm" data-dl="' + escapeHtml(d.path) + '">Download</button><button class="btn btn-secondary btn-sm" data-share="' + escapeHtml(d.path) + '">Share to WhatsApp</button>' : '') +
      (d.url ? '<a class="btn btn-secondary btn-sm" href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener">Open link</a>' : '') +
      (task.status === 'ready_for_review' ? '<button class="btn btn-primary btn-sm" data-approve="' + d.task_id + '">Approve</button><button class="btn btn-secondary btn-sm" data-changes="' + d.task_id + '">Request changes</button>' : '') +
    '</div></div>';
}

function wireDeliverables(root) {
  root.querySelectorAll('[data-thumb]').forEach(async function (el) {
    const path = el.getAttribute('data-thumb');
    if (!path) return;
    const url = await PkDB.signedUrl('pk-deliverables', path);
    if (url) el.innerHTML = '<img src="' + escapeHtml(url) + '" alt="" loading="lazy">';
  });
  root.querySelectorAll('[data-dl]').forEach(function (b) {
    b.addEventListener('click', async function () { const url = await PkDB.signedUrl('pk-deliverables', b.getAttribute('data-dl'), true); if (url) location.href = url; });
  });
  root.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', async function () {
      const url = await PkDB.signedUrl('pk-deliverables', b.getAttribute('data-share'));
      if (url) window.open('https://wa.me/?text=' + encodeURIComponent('Here is the file (link works for 1 hour): ' + url), '_blank', 'noopener');
    });
  });
  function findTask(id) { return Dash.tasks.find(function (x) { return x.id === id; }); }
  root.querySelectorAll('[data-approve]').forEach(function (b) {
    b.addEventListener('click', async function () { await refreshTasks(); const t = findTask(b.getAttribute('data-approve')); if (t) approveTask(t, route); });
  });
  root.querySelectorAll('[data-changes]').forEach(function (b) {
    b.addEventListener('click', async function () { await refreshTasks(); const t = findTask(b.getAttribute('data-changes')); if (t) requestChangesDialog(t, route); });
  });
}

async function viewDeliveries() {
  await refreshTasks();
  const all = await PkDB.listDeliverables();
  setView('<h1 data-i18n="d_deliveries">Deliveries</h1><p class="page-sub">Every file across all your tasks, newest first.</p>' +
    '<div class="toolbar"><input type="search" id="dSearch" placeholder="Filter by task ID" aria-label="Filter by task ID">' +
    '<select id="dKind" aria-label="File type"><option value="">All types</option><option value="image">Images</option><option value="pdf">PDFs</option><option value="video">Videos</option><option value="link">Links</option><option value="file">Other files</option></select>' +
    '<button class="btn btn-secondary btn-sm" id="dZip">Download all (ZIP)</button></div><div id="dList"></div>');
  function filtered() {
    const q = $('#dSearch').value.trim().toUpperCase();
    const k = $('#dKind').value;
    return all.filter(function (d) { return (!q || ((d.pk_tasks || {}).public_id || '').indexOf(q) >= 0) && (!k || d.kind === k); });
  }
  function render() {
    const list = filtered();
    $('#dList').innerHTML = list.length ? list.map(delivRowHtml).join('') : '<p class="muted">No deliveries yet. Finished files for every task appear here.</p>';
    wireDeliverables($('#dList'));
  }
  render();
  $('#dSearch').addEventListener('input', render);
  $('#dKind').addEventListener('change', render);
  $('#dZip').addEventListener('click', async function () {
    const list = filtered().filter(function (d) { return d.path; });
    if (!list.length) { pkToast('No files to download'); return; }
    const btn = this; btn.disabled = true; btn.textContent = 'Preparing…';
    try {
      if (!window.JSZip) await new Promise(function (ok, fail) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
      const zip = new JSZip();
      for (const d of list) {
        const url = await PkDB.signedUrl('pk-deliverables', d.path);
        const blob = await fetch(url).then(function (r) { return r.blob(); });
        zip.file(((d.pk_tasks || {}).public_id || 'task') + '/v' + d.version + '-' + d.path.split('/').pop(), blob);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = 'agenticcore-deliveries.zip'; a.click();
    } catch (e) { pkToast('Could not build the ZIP. Please download files one by one.'); }
    btn.disabled = false; btn.textContent = 'Download all (ZIP)';
  });
}

/* ---------------- B6 Invoices ---------------- */
async function viewInvoices() {
  const inv = await PkDB.listInvoices();
  const labels = { due: 'Due', payment_submitted: 'Payment submitted', part_paid: 'Part-paid', paid: 'Paid', refunded: 'Refunded', cancelled: 'Cancelled' };
  setView('<h1 data-i18n="d_invoices">Invoices</h1>' +
    '<p class="page-sub">Monthly fees are paid in advance. One-off work is usually paid half at the start and half on delivery.</p>' +
    '<p class="notice" style="margin-bottom:var(--space-md)">Our team confirms payment details with you directly for each invoice. Please only pay to an account our team confirms in writing, and quote the invoice number.</p>' +
    (inv.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Invoice</th><th>For</th><th>Amount</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>' +
      inv.map(function (i) {
        return '<tr><td class="mono">' + escapeHtml(i.number) + '</td><td>' + escapeHtml(i.description) + '</td><td>' + money(i.amount) + (i.paid_amount && i.paid_amount < i.amount ? '<br><span class="tiny">paid ' + money(i.paid_amount) + '</span>' : '') + '</td>' +
          '<td>' + escapeHtml(labels[i.status] || i.status) + '</td><td>' + escapeHtml(i.due_date || '') + '</td><td><button class="btn btn-secondary btn-sm" data-print="' + i.id + '">PDF</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">No invoices yet.</p>'));
  view().querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { printInvoice(inv.find(function (x) { return x.id === b.getAttribute('data-print'); })); });
  });
}

// Printable invoice; the browser's "Save as PDF" makes the PDF.
function printInvoice(i) {
  const w = window.open('', '_blank');
  if (!w) return;
  const name = (Dash.settings && Dash.settings.business_name) || Dash.user.full_name;
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(i.number) + '</title><style>body{font-family:Inter,Arial,sans-serif;color:#111;max-width:720px;margin:40px auto;padding:0 20px}h1{margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}.r{text-align:right}.muted{color:#666;font-size:13px}</style></head><body>' +
    '<h1>AgenticCore Pakistan</h1><p class="muted">agenticcorepk.com · Marketing and technology provider</p>' +
    '<h2>Invoice ' + escapeHtml(i.number) + '</h2><p>Billed to: ' + escapeHtml(name) + '<br>Date: ' + escapeHtml(pkDate(i.created_at)) + '<br>Due: ' + escapeHtml(i.due_date || '') + '<br>Status: ' + escapeHtml(i.status) + '</p>' +
    '<table><tr><th>Description</th><th class="r">Amount</th></tr><tr><td>' + escapeHtml(i.description) + '</td><td class="r">' + money(i.amount) + '</td></tr>' +
    '<tr><td>Paid</td><td class="r">' + money(i.paid_amount) + '</td></tr><tr><th>Balance</th><th class="r">' + money(i.amount - i.paid_amount) + '</th></tr></table>' +
    '<p class="muted">All prices are in Pakistani rupees and exclude taxes where applicable. Monthly fees are paid in advance; one-off work is usually paid half at the start and half on delivery. Please quote ' + escapeHtml(i.number) + ' with your payment and only pay to an account our team confirms in writing.</p>' +
    '<script>window.print()<\/script></body></html>');
  w.document.close();
}

/* ---------------- B7 Package usage ---------------- */
function monthStartPkt() { return pkFmtDay.format(new Date()).slice(0, 8) + '01'; }

async function usageSummaryHtml(sub, compact) {
  const pkg = window.PK_DATA.packages.packages.find(function (p) { return p.id === sub.package_id; });
  const [allow, usage] = await Promise.all([PkDB.listAllowances(sub.package_id), PkDB.listUsage(sub.id)]);
  const thisMonth = usage.filter(function (u) { return u.period_start === monthStartPkt(); });
  const meters = allow.map(function (a) {
    const used = thisMonth.filter(function (u) { return u.item_key === a.item_key; }).reduce(function (s, u) { return s + u.qty; }, 0);
    const pct = a.qty ? Math.min(100, Math.round(100 * used / a.qty)) : 0;
    let extra = '';
    if (!compact && used >= a.qty && a.extra_line_id && window.PK_DATA.lines[a.extra_line_id]) {
      const price = window.PK_DATA.lines[a.extra_line_id].line.price;
      extra = '<div class="tiny" style="margin-top:0.3rem">Allowance used up. <a class="link" href="#order/line/' + a.extra_line_id + '">Add more for ' + money(price) + ' each</a> or <a class="link" href="#order/packages">upgrade your package</a>.</div>';
    }
    return '<div class="meter' + (used >= a.qty ? ' full' : '') + '"><div class="top"><span>' + escapeHtml(a.label) + '</span><span>' + used + ' of ' + a.qty + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>' + extra + '</div>';
  }).join('');
  const head = '<p><strong>' + escapeHtml(pkg ? pkg.name : sub.package_id) + '</strong> · ' + escapeHtml(sub.status) +
    (sub.renews_at ? ' · renews ' + escapeHtml(pkDate(sub.renews_at)) : '') + (sub.min_term_end ? ' · minimum term ends ' + escapeHtml(pkDate(sub.min_term_end)) : '') + '</p>';
  if (compact) return head + (meters || '<p class="muted">This package has no monthly allowances.</p>');
  const history = usage.length ? '<h2>Delivered against this package</h2><div class="table-wrap"><table class="list"><thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Task</th></tr></thead><tbody>' +
    usage.map(function (u) { return '<tr><td>' + escapeHtml(pkDate(u.created_at)) + '</td><td>' + escapeHtml(u.item_key) + (u.note ? ' · ' + escapeHtml(u.note) : '') + '</td><td>' + u.qty + '</td><td>' + (u.pk_tasks ? '<a class="link mono" href="#task/' + escapeHtml(u.pk_tasks.public_id) + '">' + escapeHtml(u.pk_tasks.public_id) + '</a>' : '') + '</td></tr>'; }).join('') +
    '</tbody></table></div>' : '';
  return head + '<h2>This month</h2>' + (meters || '<p class="muted">This package has no monthly allowances.</p>') + history;
}

async function viewUsage() {
  const subs = await PkDB.listSubscriptions();
  if (!subs.length) { setView('<h1 data-i18n="d_usage">Package usage</h1><p class="muted">You have no package yet.</p><a class="btn btn-primary" href="#order/packages">See packages</a>'); return; }
  const blocks = [];
  for (const s of subs) blocks.push('<div class="card section-card">' + await usageSummaryHtml(s, false) + (s.status === 'pending' ? '<p class="tiny">Your package starts once the first payment is confirmed.</p>' : '') + '</div>');
  setView('<h1 data-i18n="d_usage">Package usage</h1>' + blocks.join(''));
}

/* ---------------- B8 Points & referrals ---------------- */
async function viewPoints() {
  const u = await PkDB.currentUser();
  Dash.user = u;
  const [refs, ledger] = await Promise.all([PkDB.getDirectReferrals(), PkDB.getPointsLedger(u.id)]);
  const link = location.origin + '/signup.html?ref=' + encodeURIComponent(u.referral_code);
  const activate = u.referral_joined ? '' :
    '<div class="notice" style="margin-bottom:var(--space-md)">Your referral link is not switched on yet. <button class="btn btn-primary btn-sm" id="refJoin" style="margin-inline-start:0.5rem">Activate my referral link</button></div>';
  setView('<h1 data-i18n="d_points">Points &amp; referrals</h1>' +
    '<p class="page-sub">One account and one points balance across agenticcore.estate and agenticcorepk.com. When someone you referred directly pays for anything on an AgenticCore site, you earn 10% of it as AgenticCore Points (1 point = Rs 1).</p>' +
    activate +
    '<div class="stat-row"><div class="card stat"><div class="v">' + (u.points || 0).toLocaleString('en-PK') + '</div><div class="l">Points balance</div></div>' +
    '<div class="card stat"><div class="v">' + refs.length + '</div><div class="l">Direct referrals</div></div></div>' +
    '<h2>Your referral link</h2><div class="copy-box"><input id="refLink" readonly value="' + escapeHtml(link) + '" aria-label="Referral link"><button class="btn btn-secondary btn-sm" id="refCopy">Copy</button>' +
    '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('Join AgenticCore with my link: ' + link) + '">Share to WhatsApp</a></div>' +
    '<p class="tiny" style="margin-top:0.4rem">Code: <span class="mono gold">' + escapeHtml(u.referral_code) + '</span></p>' +
    '<h2>Direct referrals</h2>' + (refs.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Name</th><th>Joined</th></tr></thead><tbody>' + refs.map(function (r) { return '<tr><td>' + escapeHtml(r.fullName) + '</td><td>' + escapeHtml(pkDate(r.joinedAt)) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No referrals yet.</p>') +
    '<h2>Points history</h2>' + (ledger.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Date</th><th>From</th><th>Spend</th><th>Points</th></tr></thead><tbody>' + ledger.map(function (l) { return '<tr><td>' + escapeHtml(pkDate(l.created_at)) + '</td><td class="mono">' + escapeHtml(l.transaction_reference || '') + '</td><td>' + money(l.transaction_value) + '</td><td>+' + Number(l.points_awarded).toLocaleString('en-PK') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No points earned yet.</p>') +
    '<p style="margin-top:var(--space-md)"><a class="link" href="legal.html#referrals">Referral terms</a></p>');
  $('#refCopy').addEventListener('click', function () { navigator.clipboard.writeText(link).then(function () { pkToast('Link copied'); }); });
  const join = $('#refJoin');
  if (join) join.addEventListener('click', async function () {
    await supabaseClient.from('profiles').update({ referral_joined: true, referral_joined_at: new Date().toISOString() }).eq('id', u.id);
    viewPoints();
  });
}

/* ---------------- B9 Estate listings ---------------- */
async function viewListings() {
  const u = Dash.user;
  const res = await PkDB.getMyEstateListings(u.id);
  const org = u.role === 'agency' && u.agency_name ? '<div class="greet">' + (u.agency_logo_path ? '<img src="' + escapeHtml(u.agency_logo_path) + '" alt="">' : '') + '<div><strong>' + escapeHtml(u.agency_name) + '</strong><div class="tiny">Your agency profile on agenticcore.estate</div></div></div>'
    : u.role === 'builder' && u.builder_company_name ? '<div class="greet">' + (u.builder_logo_path ? '<img src="' + escapeHtml(u.builder_logo_path) + '" alt="">' : '') + '<div><strong>' + escapeHtml(u.builder_company_name) + '</strong><div class="tiny">Your builder profile on agenticcore.estate</div></div></div>' : '';
  setView('<h1 data-i18n="d_listings">Estate listings</h1><p class="page-sub">Your listings on agenticcore.estate, with the same login.</p>' + org +
    '<div class="stat-row"><div class="card stat"><div class="v">' + res.count + '</div><div class="l">Listings on agenticcore.estate</div></div></div>' +
    '<h2>Latest</h2>' + (res.listings.length ? res.listings.map(function (l) {
      return '<a class="task-row" href="' + PK_CONFIG.estateUrl + '/listing.html?id=' + encodeURIComponent(l.id) + '"><span>' + escapeHtml(l.title) + '</span><span class="tiny">' + escapeHtml(l.type) + '</span><span class="meta">' + escapeHtml(l.area + ', ' + l.city) + ' · ' + money(l.price) + '</span></a>';
    }).join('') : '<p class="muted">No listings yet.</p>') +
    '<div class="btn-row" style="margin-top:var(--space-md)"><a class="btn btn-primary" href="' + PK_CONFIG.estateUrl + '/sell.html">Add listing</a><a class="btn btn-secondary" href="' + PK_CONFIG.estateUrl + '/dashboard.html">Manage on agenticcore.estate</a></div>' +
    '<p class="tiny" style="margin-top:0.6rem">agenticcore.estate asks you to log in there separately; use the same phone/email and password.</p>');
}

/* ---------------- B9 Support & notifications ---------------- */
async function viewSupport() {
  const notes = await PkDB.listNotifications();
  const s = Dash.settings || {};
  const n = s.notify || { email: true, telegram: false, whatsapp: false };
  setView('<h1 data-i18n="d_support">Support</h1>' +
    '<div class="btn-row" style="margin-bottom:var(--space-md)"><a class="btn btn-wa" data-wa="dashboard-support" data-wa-msg="I\'m ' + escapeHtml(Dash.user.full_name) + ', a client. I need help with:" href="#tasks">WhatsApp us</a><a class="btn btn-secondary" href="#tasks">Message us on a task</a></div>' +
    (PK_CONFIG.whatsappNumber ? '' : '<p class="notice" style="margin-bottom:var(--space-md)">Our WhatsApp line is being set up. Until then, please use the message thread on any task page and our team will reply there.</p>') +
    '<h2 data-i18n="d_notifications">Notifications</h2>' +
    '<form class="card section-card" id="notifyForm"><p class="tiny">Choose how we tell you about new tasks, items waiting on you, deliveries ready for review, invoices and payments. Everything also appears below.</p>' +
    '<label class="check"><input type="checkbox" name="email"' + (n.email ? ' checked' : '') + '> Email</label>' +
    '<label class="check"><input type="checkbox" name="telegram"' + (n.telegram ? ' checked' : '') + '> Telegram</label>' +
    '<label class="check"><input type="checkbox" name="whatsapp"' + (n.whatsapp ? ' checked' : '') + '> WhatsApp</label>' +
    '<p class="tiny">WhatsApp Business messages carry a per-message fee from Meta, so email and Telegram are the default.</p>' +
    '<button class="btn btn-primary btn-sm" type="submit">Save</button></form>' +
    '<h2>Recent updates</h2>' + (notes.length ? notes.map(function (x) { return '<div class="task-row"><span>' + escapeHtml(x.body) + '</span><span class="tiny">' + escapeHtml(pkWhen(x.created_at)) + '</span></div>'; }).join('') : '<p class="muted">Nothing yet.</p>'));
  $('#notifyForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    const notify = { email: f.email.checked, telegram: f.telegram.checked, whatsapp: f.whatsapp.checked };
    const r = await PkDB.saveSettings(Dash.user.id, { notify: notify });
    if (r.error) { pkToast(r.error); return; }
    Dash.settings = Object.assign({}, Dash.settings, { notify: notify });
    pkToast('Saved');
  });
}

/* ---------------- B10 Profile & brand kit ---------------- */
async function viewProfile() {
  const u = Dash.user;
  const s = Dash.settings || {};
  const kit = (await PkDB.getBrandKit(u.id)) || { colors: [], contact: {}, taglines: {}, approvals: [], files: [] };
  const colors = (kit.colors && kit.colors.length ? kit.colors : ['#0C3324', '#D4AF37']).slice(0, 4);
  while (colors.length < 4) colors.push('#FFFFFF');
  const c = kit.contact || {};
  const approvals = (kit.approvals && kit.approvals.length) ? kit.approvals : [{ authority: '', number: '' }];
  const fileChips = function (kind) {
    return (kit.files || []).filter(function (f) { return f.kind === kind; }).map(function (f) { return '<span class="file-chip">' + escapeHtml(f.name) + '</span>'; }).join('');
  };
  setView('<h1 data-i18n="d_profile">Profile &amp; brand kit</h1>' +
    '<form class="card section-card" id="profileForm"><h2 style="margin-top:0">Profile</h2>' +
      '<div class="grid grid-2"><div class="field"><label for="pfName">Name</label><input id="pfName" value="' + escapeHtml(u.full_name) + '" required></div>' +
      '<div class="field"><label for="pfBiz">Business name</label><input id="pfBiz" value="' + escapeHtml(s.business_name || u.agency_name || u.builder_company_name || '') + '"></div>' +
      '<div class="field"><label for="pfCity">City</label><input id="pfCity" value="' + escapeHtml(s.city || '') + '"></div>' +
      '<div class="field"><label for="pfWa">WhatsApp number</label><input id="pfWa" inputmode="tel" value="' + escapeHtml(s.whatsapp || u.phone || '') + '"></div>' +
      '<div class="field"><label for="pfLang">Preferred language</label><select id="pfLang"><option value="en">English</option><option value="ur"' + (s.preferred_lang === 'ur' ? ' selected' : '') + '>اردو</option></select></div>' +
      '<div class="field"><span class="label">Role · phone · email</span><span>' + escapeHtml(u.role) + ' · ' + escapeHtml(u.phone) + ' · ' + escapeHtml(u.email || '') + '</span><span class="hint">Phone and email are your shared AgenticCore login.</span></div></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">Save profile</button></form>' +

    '<form class="card section-card" id="kitForm"><h2 style="margin-top:0">Brand kit</h2><p class="tiny">Every order uses your brand kit by default, and our team sees it next to your brief.</p>' +
      '<div class="grid grid-2">' +
        '<div class="field"><label for="kLogoLight">Logo (light background)</label><input type="file" id="kLogoLight" accept="image/*,.svg"><div class="file-chips">' + fileChips('logo_light') + '</div></div>' +
        '<div class="field"><label for="kLogoDark">Logo (dark background)</label><input type="file" id="kLogoDark" accept="image/*,.svg"><div class="file-chips">' + fileChips('logo_dark') + '</div></div>' +
        '<div class="field"><label for="kPhoto">Agent photo(s)</label><input type="file" id="kPhoto" accept="image/*" multiple><div class="file-chips">' + fileChips('photo') + '</div></div>' +
        '<div class="field"><label for="kFonts">Fonts (if any)</label><input id="kFonts" value="' + escapeHtml(kit.fonts || '') + '"></div>' +
      '</div>' +
      '<div class="field"><span class="label">Brand colours</span><div class="color-row">' + colors.map(function (col, i) { return '<label>Colour ' + (i + 1) + '<input type="color" data-color value="' + escapeHtml(col) + '"></label>'; }).join('') + '</div></div>' +
      '<h2>Contact block for designs</h2><div class="grid grid-2">' +
        [['phone', 'Phone'], ['whatsapp', 'WhatsApp'], ['address', 'Office address'], ['website', 'Website'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']].map(function (f) {
          return '<div class="field"><label for="kc_' + f[0] + '">' + f[1] + '</label><input id="kc_' + f[0] + '" data-contact="' + f[0] + '" value="' + escapeHtml(c[f[0]] || '') + '"></div>';
        }).join('') + '</div>' +
      '<h2>NOC and approval numbers</h2><p class="tiny">Only approvals you can show us will be used (services 4, 6 and 8).</p><div id="apprRows">' +
        approvals.map(approvalRowHtml).join('') + '</div><button type="button" class="btn btn-secondary btn-sm" id="apprAdd">Add approval</button>' +
      '<h2>Default taglines</h2><div class="grid grid-2"><div class="field"><label for="kTagEn">English</label><input id="kTagEn" value="' + escapeHtml((kit.taglines || {}).en || '') + '"></div>' +
        '<div class="field"><label for="kTagUr">اردو</label><input id="kTagUr" dir="rtl" lang="ur" value="' + escapeHtml((kit.taglines || {}).ur || '') + '"></div></div>' +
      '<div class="form-msg" id="kitMsg"></div><button class="btn btn-primary" type="submit">Save brand kit</button></form>');

  $('#apprAdd').addEventListener('click', function () { $('#apprRows').insertAdjacentHTML('beforeend', approvalRowHtml({ authority: '', number: '' })); });
  $('#apprRows').addEventListener('click', function (e) { if (e.target.matches('[data-remove]')) e.target.closest('.approval-row').remove(); });

  $('#profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const r1 = await PkDB.updateProfileName(u.id, $('#pfName').value.trim());
    const patch = { business_name: $('#pfBiz').value.trim() || null, city: $('#pfCity').value.trim() || null, whatsapp: $('#pfWa').value.trim() || null, preferred_lang: $('#pfLang').value };
    const r2 = await PkDB.saveSettings(u.id, patch);
    if (r1.error || r2.error) { pkToast(r1.error || r2.error); return; }
    Dash.settings = Object.assign({}, Dash.settings, patch);
    Dash.user.full_name = $('#pfName').value.trim();
    if (patch.preferred_lang !== pkLang) pkApplyLanguage(patch.preferred_lang);
    pkToast('Profile saved');
  });

  $('#kitForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const msg = $('#kitMsg');
    const files = (kit.files || []).slice();
    const uploads = [['kLogoLight', 'logo_light'], ['kLogoDark', 'logo_dark'], ['kPhoto', 'photo']];
    for (const pair of uploads) {
      const input = document.getElementById(pair[0]);
      for (let i = 0; i < input.files.length; i++) {
        const up = await PkDB.uploadBrandFile(u.id, input.files[i]);
        if (up.error) { msg.textContent = up.error; msg.className = 'form-msg error'; return; }
        if (pair[1] !== 'photo') for (let j = files.length - 1; j >= 0; j--) if (files[j].kind === pair[1]) files.splice(j, 1);
        files.push({ path: up.path, name: input.files[i].name, kind: pair[1] });
      }
    }
    const contact = {};
    view().querySelectorAll('[data-contact]').forEach(function (i) { if (i.value.trim()) contact[i.getAttribute('data-contact')] = i.value.trim(); });
    const approvalsOut = [];
    view().querySelectorAll('.approval-row').forEach(function (row) {
      const a = row.querySelector('[data-a="authority"]').value.trim(), n = row.querySelector('[data-a="number"]').value.trim();
      if (a || n) approvalsOut.push({ authority: a, number: n });
    });
    const r = await PkDB.saveBrandKit(u.id, {
      colors: Array.prototype.map.call(view().querySelectorAll('[data-color]'), function (i) { return i.value; }),
      fonts: $('#kFonts').value.trim() || null, contact: contact, approvals: approvalsOut,
      taglines: { en: $('#kTagEn').value.trim(), ur: $('#kTagUr').value.trim() }, files: files
    });
    if (r.error) { msg.textContent = r.error; msg.className = 'form-msg error'; return; }
    pkToast('Brand kit saved');
    viewProfile();
  });
}

function approvalRowHtml(a) {
  return '<div class="approval-row"><input data-a="authority" placeholder="Authority (e.g. RDA)" value="' + escapeHtml(a.authority || '') + '" aria-label="Authority">' +
    '<input data-a="number" placeholder="Approval / NOC number" value="' + escapeHtml(a.number || '') + '" aria-label="Approval number">' +
    '<button type="button" class="btn btn-secondary btn-sm" data-remove aria-label="Remove">×</button></div>';
}

/* ---------------- router ---------------- */
const ROUTES = { home: viewHome, order: viewOrder, tasks: viewTasks, task: viewTask, deliveries: viewDeliveries, invoices: viewInvoices, usage: viewUsage, points: viewPoints, listings: viewListings, support: viewSupport, profile: viewProfile };

async function route() {
  const parts = (location.hash.replace(/^#/, '') || 'home').split('/');
  const name = ROUTES[parts[0]] ? parts[0] : 'home';
  const navName = name === 'task' ? 'tasks' : name;
  document.querySelectorAll('#dashNav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-route') === navName); });
  const v = view();
  v.innerHTML = '<p class="loading">Loading…</p>';
  // replace the node so listeners from the previous view don't pile up
  const fresh = v.cloneNode(false); v.parentNode.replaceChild(fresh, v);
  try { await ROUTES[name](parts.slice(1)); } catch (e) { console.error(e); setView('<p class="form-msg error" style="display:block">Something went wrong loading this page. Please refresh.</p>'); }
  window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', async function () {
  const user = await pkRequireAuth(false);
  if (!user) return;
  Dash.user = user;
  await pkLoadData();
  Dash.settings = await PkDB.getSettings(user.id).catch(function () { return null; });
  let savedLang = null;
  try { savedLang = localStorage.getItem('acLang'); } catch (e) { /* storage blocked */ }
  if (Dash.settings && Dash.settings.preferred_lang && !savedLang) pkApplyLanguage(Dash.settings.preferred_lang);
  window.addEventListener('hashchange', route);
  pkOnLanguageChange(function () { route(); });
  route();
});
