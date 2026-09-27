/* ============================================
   AgenticCore Pakistan — owner / admin view (B11)
   Every write goes through a pk_admin_* security-definer RPC that
   checks is_admin() on the server; hiding this page is not the
   security boundary.
   ============================================ */

const Adm = { tasks: [], clients: [], clientsById: {} };

function $(sel, root) { return (root || document).querySelector(sel); }
function view() { return document.getElementById('view'); }
function setView(html) { const v = view(); v.innerHTML = html; return v; }
function money(n) { return Rs(n || 0); }
function clientName(id) { const c = Adm.clientsById[id]; return c ? (c.business_name || c.full_name) : id.slice(0, 8); }

async function loadCore() {
  const [tasks, clients] = await Promise.all([PkDB.admin.tasks(), PkDB.admin.clients()]);
  Adm.tasks = tasks; Adm.clients = clients; Adm.clientsById = {};
  clients.forEach(function (c) { Adm.clientsById[c.id] = c; });
}

function adminTaskRow(t) {
  const due = pkDueInfo(t);
  return '<a class="task-row" href="#task/' + escapeHtml(t.public_id) + '"><span class="id">' + escapeHtml(t.public_id) + '</span>' + pkStatusPill(t.status) +
    '<span class="t">' + escapeHtml(t.title) + (t.quantity > 1 ? ' × ' + t.quantity : '') + ' · <span class="muted">' + escapeHtml(clientName(t.client_id)) + '</span></span>' +
    '<span class="meta"><span>' + escapeHtml(pkSourceIcon(t.source)) + '</span><span class="' + due.cls + '">' + escapeHtml(due.text) + '</span>' + (t.assigned_to ? '<span>→ ' + escapeHtml(t.assigned_to) + '</span>' : '') + '</span></a>';
}

/* ---------- 1. Today ---------- */
async function viewToday() {
  await loadCore();
  const invoices = await PkDB.admin.invoices();
  const today = pkFmtDay.format(new Date());
  const open = Adm.tasks.filter(function (t) { return PK_CLOSED.indexOf(t.status) < 0; });
  const late = open.filter(function (t) { return t.due_at && new Date(t.due_at) < new Date() && t.status !== 'ready_for_review' && t.status !== 'waiting_on_you'; });
  const dueToday = open.filter(function (t) { return t.due_at && pkFmtDay.format(new Date(t.due_at)) === today && late.indexOf(t) < 0; })
    .sort(function (a, b) { return new Date(a.due_at) - new Date(b.due_at); });
  const waiting = open.filter(function (t) { return t.status === 'waiting_on_you'; });
  const changes = open.filter(function (t) { return t.status === 'changes_requested' || t.status === 'received'; });
  const toConfirm = invoices.filter(function (i) { return i.status === 'payment_submitted' || i.status === 'due'; });
  const list = function (arr) { return arr.length ? arr.map(adminTaskRow).join('') : '<p class="muted">None.</p>'; };
  setView('<h1>Today</h1><p class="page-sub">' + escapeHtml(pkFmtDate.format(new Date())) + ' · PKT</p>' +
    '<div class="stat-row"><div class="card stat"><div class="v late">' + late.length + '</div><div class="l">Late</div></div>' +
    '<div class="card stat"><div class="v">' + dueToday.length + '</div><div class="l">Due today</div></div>' +
    '<div class="card stat"><div class="v">' + waiting.length + '</div><div class="l">Waiting on client</div></div>' +
    '<div class="card stat"><div class="v">' + toConfirm.length + '</div><div class="l">Invoices open</div></div></div>' +
    '<h2 class="late">Late</h2>' + list(late) +
    '<h2>Due today, by due time</h2>' + list(dueToday) +
    '<h2>New or changes requested</h2>' + list(changes) +
    '<h2>Waiting on client</h2>' + list(waiting) +
    '<h2>Payments to confirm</h2>' + (toConfirm.length ? '<a class="link" href="#payments">' + toConfirm.length + ' open invoice(s) →</a>' : '<p class="muted">None.</p>'));
}

/* ---------- 2. All tasks ---------- */
async function viewTasks() {
  await loadCore();
  const services = window.PK_DATA.services.services;
  setView('<h1>All tasks</h1>' +
    '<div class="toolbar"><input type="search" id="aq" placeholder="Task ID, client or phone" aria-label="Search">' +
    '<select id="aStatus" aria-label="Status"><option value="">All statuses</option>' + PK_STATUSES.map(function (s) { return '<option value="' + s + '">' + pkT('st_' + s) + '</option>'; }).join('') + '</select>' +
    '<select id="aSource" aria-label="Source"><option value="">All sources</option><option>web</option><option>telegram</option><option>whatsapp</option><option>admin</option></select>' +
    '<select id="aService" aria-label="Service"><option value="">All services</option>' + services.map(function (s) { return '<option value="' + s.no + '">(' + s.no + ') ' + escapeHtml(s.name) + '</option>'; }).join('') + '</select>' +
    '<button class="btn btn-primary btn-sm" id="aNew">Log a task</button></div><div id="aList"></div>');
  function render() {
    const q = $('#aq').value.trim().toLowerCase(), st = $('#aStatus').value, src = $('#aSource').value, svc = $('#aService').value;
    const list = Adm.tasks.filter(function (t) {
      const c = Adm.clientsById[t.client_id] || {};
      if (q && [t.public_id, c.full_name, c.business_name, c.phone, c.email].join(' ').toLowerCase().indexOf(q) < 0) return false;
      if (st && t.status !== st) return false;
      if (src && t.source !== src) return false;
      if (svc && String(t.service_no) !== svc) return false;
      return true;
    });
    $('#aList').innerHTML = list.length ? list.map(adminTaskRow).join('') : '<p class="muted">No tasks.</p>';
  }
  render();
  ['#aq', '#aStatus', '#aSource', '#aService'].forEach(function (s) { $(s).addEventListener('input', render); });
  $('#aNew').addEventListener('click', logTaskDialog);
}

// For orders that arrive by Telegram, WhatsApp or phone.
function logTaskDialog() {
  const lines = window.PK_DATA.services.services.flatMap(function (s) { return s.lines.map(function (l) { return { id: l.id, label: '(' + s.no + ') ' + s.name + ' — ' + l.unit + ' — ' + Rs(l.price) }; }); });
  const dlg = pkDialog('<form id="logForm"><h3>Log a task for a client</h3>' +
    '<div class="field"><label for="lClient">Client</label><select id="lClient" required>' + Adm.clients.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml((c.business_name || c.full_name) + ' · ' + c.phone) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="lLine">Service option</label><select id="lLine" required>' + lines.map(function (l) { return '<option value="' + l.id + '">' + escapeHtml(l.label) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="lQty">Quantity</label><input id="lQty" type="number" min="1" value="1"></div>' +
    '<div class="field"><label for="lSource">Came in by</label><select id="lSource"><option>whatsapp</option><option>telegram</option><option>admin</option></select></div>' +
    '<div class="field"><label for="lBrief">Brief</label><textarea id="lBrief"></textarea></div>' +
    '<div class="form-msg" id="lMsg"></div><div class="btn-row"><button class="btn btn-primary" type="submit">Create task</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>');
  $('#logForm', dlg).addEventListener('submit', async function (e) {
    e.preventDefault();
    const brief = $('#lBrief', dlg).value.trim();
    const r = await PkDB.admin.createTask($('#lClient', dlg).value, $('#lLine', dlg).value, parseInt($('#lQty', dlg).value, 10) || 1, brief ? { brief: brief } : {}, $('#lSource', dlg).value);
    if (r.error) { $('#lMsg', dlg).textContent = r.error; $('#lMsg', dlg).className = 'form-msg error'; return; }
    dlg.close();
    location.hash = '#task/' + r.task.public_id;
  });
}

/* ---------- task detail: status, deliver, message ---------- */
async function viewTask(sub) {
  if (!Adm.tasks.length) await loadCore();
  const t = await PkDB.getTaskByPublicId(decodeURIComponent(sub[0] || ''));
  if (!t) { setView('<p>Task not found. <a class="link" href="#tasks">Back</a></p>'); return; }
  const c = Adm.clientsById[t.client_id] || {};
  const [events, messages, attachments, delivs, kit] = await Promise.all([
    PkDB.taskEvents(t.id), PkDB.taskMessages(t.id), PkDB.taskAttachments(t.id),
    PkDB.listDeliverables().then(function (d) { return d.filter(function (x) { return x.task_id === t.id; }); }),
    PkDB.getBrandKit(t.client_id)
  ]);
  const due = pkDueInfo(t);
  const kitHtml = kit ? '<dl class="kv">' +
    '<dt>Colours</dt><dd>' + (kit.colors || []).map(function (c) { return '<span style="display:inline-block;width:18px;height:18px;border-radius:4px;vertical-align:middle;background:' + escapeHtml(c) + '"></span> ' + escapeHtml(c); }).join(' ') + '</dd>' +
    '<dt>Fonts</dt><dd>' + escapeHtml(kit.fonts || '—') + '</dd>' +
    '<dt>Contact</dt><dd>' + escapeHtml(Object.keys(kit.contact || {}).map(function (k) { return k + ': ' + kit.contact[k]; }).join(' · ') || '—') + '</dd>' +
    '<dt>Approvals</dt><dd>' + escapeHtml((kit.approvals || []).map(function (a) { return a.authority + ' ' + a.number; }).join(' · ') || '—') + '</dd>' +
    '<dt>Taglines</dt><dd>' + escapeHtml([(kit.taglines || {}).en, (kit.taglines || {}).ur].filter(Boolean).join(' / ') || '—') + '</dd>' +
    '<dt>Files</dt><dd>' + (kit.files || []).map(function (f) { return '<button class="file-chip" data-kit="' + escapeHtml(f.path) + '">' + escapeHtml(f.kind + ': ' + f.name) + '</button>'; }).join(' ') + '</dd></dl>'
    : '<p class="muted">No brand kit yet.</p>';

  setView('<p><a class="link" href="#tasks">← All tasks</a></p>' +
    '<h1><span class="mono gold">' + escapeHtml(t.public_id) + '</span> ' + pkStatusPill(t.status) + '</h1>' +
    '<p>' + escapeHtml(t.title) + (t.quantity > 1 ? ' × ' + t.quantity : '') + ' · ' + money(t.amount) + ' · ' + escapeHtml(pkSourceIcon(t.source)) + '</p>' +
    '<p>Client: <strong>' + escapeHtml(c.business_name || c.full_name || '') + '</strong> · ' + escapeHtml(c.phone || '') + ' · ' + escapeHtml(c.email || '') + '</p>' +
    '<p class="countdown ' + due.cls + '">' + escapeHtml(due.text) + '</p>' +

    '<form class="card section-card" id="stForm"><h2 style="margin-top:0">Change status</h2><div class="grid grid-2">' +
      '<div class="field"><label for="stStatus">New status</label><select id="stStatus">' + PK_STATUSES.map(function (s) { return '<option value="' + s + '"' + (s === t.status ? ' selected' : '') + '>' + pkT('st_' + s) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="stNote">Note to client (optional)</label><input id="stNote"></div>' +
      '<div class="field"><label for="stMissing">Waiting on (comma separated)</label><input id="stMissing" value="' + escapeHtml((t.missing || []).join(', ')) + '" placeholder="Logo file, Payment"></div>' +
      '<div class="field"><label for="stLate">Running late: reason</label><input id="stLate" value="' + escapeHtml(t.late_reason || '') + '"></div>' +
      '<div class="field"><label for="stDue">New due time (PKT, optional)</label><input id="stDue" type="datetime-local"></div>' +
    '</div><p class="tiny">"Confirmed" sets the due time from the 6pm PKT cut-off and the service\'s turnaround. "Waiting on you" pauses the clock; any other status resumes it and adds the pause back.</p>' +
    '<div class="form-msg" id="stMsg"></div><button class="btn btn-primary btn-sm" type="submit">Update status</button></form>' +

    '<form class="card section-card" id="dvForm"><h2 style="margin-top:0">Deliver</h2>' +
      '<div class="grid grid-2"><div class="field"><label for="dvFile">File</label><input type="file" id="dvFile"></div>' +
      '<div class="field"><label for="dvUrl">…or link</label><input id="dvUrl" type="url" placeholder="https://"></div>' +
      '<div class="field"><label for="dvLabel">Label</label><input id="dvLabel" placeholder="e.g. Payment plan chart, WhatsApp size"></div></div>' +
      '<p class="tiny">Uploading marks the task "Ready for review" as version v' + (t.revisions_used + 1) + '.</p>' +
      '<div class="form-msg" id="dvMsg"></div><button class="btn btn-primary btn-sm" type="submit">Upload and mark ready</button>' +
      (delivs.length ? '<h2>Delivered</h2>' + delivs.map(function (d) { return '<p class="tiny">v' + d.version + ' · ' + escapeHtml(d.label || d.kind) + ' · ' + escapeHtml(pkWhen(d.created_at)) + '</p>'; }).join('') : '') +
    '</form>' +

    '<div class="grid grid-2">' +
      '<div class="card"><h2 style="margin-top:0">Brief</h2>' + pkDetailsHtml(t.details) +
        (attachments.length ? '<div class="file-chips">' + attachments.map(function (a) { return '<button class="file-chip" data-att="' + escapeHtml(a.path) + '">📎 ' + escapeHtml(a.name || 'file') + '</button>'; }).join('') + '</div>' : '') +
        '<h2>Brand kit' + (t.use_brand_kit ? '' : ' (client switched it off for this order)') + '</h2>' + kitHtml + '</div>' +
      '<div class="card"><h2 style="margin-top:0">Timeline</h2>' + pkTimelineHtml(events) + '</div>' +
    '</div>' +
    '<div class="card" style="margin-top:var(--space-md)"><h2 style="margin-top:0">Messages</h2><div class="thread">' +
      messages.map(function (m) { return '<div class="msg ' + (m.from_team ? 'me' : 'team') + '">' + escapeHtml(m.body) + '<span class="when">' + (m.from_team ? 'Team' : 'Client') + ' · ' + escapeHtml(pkWhen(m.created_at)) + '</span></div>'; }).join('') +
      '</div><form id="amForm" class="copy-box"><input id="amBody" required placeholder="Reply to the client"><button class="btn btn-primary btn-sm" type="submit">Send</button></form></div>');

  const v = view();
  v.querySelectorAll('[data-att]').forEach(function (b) { b.addEventListener('click', async function () { const u = await PkDB.signedUrl('pk-attachments', b.getAttribute('data-att')); if (u) window.open(u, '_blank', 'noopener'); }); });
  v.querySelectorAll('[data-kit]').forEach(function (b) { b.addEventListener('click', async function () { const u = await PkDB.signedUrl('pk-brand-kits', b.getAttribute('data-kit')); if (u) window.open(u, '_blank', 'noopener'); }); });

  $('#stForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const missing = $('#stMissing').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    const dueLocal = $('#stDue').value; // interpreted as PKT (UTC+5, no DST)
    const newDue = dueLocal ? new Date(dueLocal + ':00+05:00').toISOString() : null;
    const r = await PkDB.admin.setStatus(t.id, $('#stStatus').value, $('#stNote').value.trim(), missing, $('#stLate').value.trim(), newDue);
    if (r.error) { $('#stMsg').textContent = r.error; $('#stMsg').className = 'form-msg error'; return; }
    viewTask(sub);
  });
  $('#dvForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = $('#dvFile').files[0], url = $('#dvUrl').value.trim();
    if (!f && !url) { $('#dvMsg').textContent = 'Choose a file or paste a link.'; $('#dvMsg').className = 'form-msg error'; return; }
    const kind = f ? pkKindFromName(f.name) : 'link';
    const r = await PkDB.admin.deliver(t, f, url, $('#dvLabel').value.trim(), kind);
    if (r.error) { $('#dvMsg').textContent = r.error; $('#dvMsg').className = 'form-msg error'; return; }
    viewTask(sub);
  });
  $('#amForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const r = await PkDB.postMessage(t.id, $('#amBody').value.trim());
    if (r.error) { pkToast(r.error); return; }
    viewTask(sub);
  });
}

/* ---------- 4. Payments & packages ---------- */
async function viewPayments() {
  await loadCore();
  const [inv, subs] = await Promise.all([PkDB.admin.invoices(), PkDB.admin.subscriptions()]);
  const statuses = ['due', 'payment_submitted', 'part_paid', 'paid', 'refunded', 'cancelled'];
  setView('<h1>Payments &amp; packages</h1>' +
    '<p class="notice" style="margin-bottom:var(--space-md)">Marking an invoice <strong>paid</strong> credits the client\'s direct referrer with 10% as AgenticCore Points (once per invoice). Payment methods and account details are intentionally not shown anywhere on the site until confirmed.</p>' +
    '<div class="btn-row" style="margin-bottom:var(--space-sm)"><button class="btn btn-primary btn-sm" id="newInv">Issue an invoice</button></div>' +
    '<h2>Invoices</h2><div class="table-wrap"><table class="list"><thead><tr><th>Invoice</th><th>Client</th><th>For</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>' +
    inv.map(function (i) {
      return '<tr><td class="mono">' + escapeHtml(i.number) + '</td><td>' + escapeHtml(clientName(i.client_id)) + '</td><td>' + escapeHtml(i.description) + '</td><td>' + money(i.amount) + (i.paid_amount ? '<br><span class="tiny">paid ' + money(i.paid_amount) + '</span>' : '') + '</td>' +
        '<td><select data-inv="' + i.id + '" aria-label="Invoice status">' + statuses.map(function (s) { return '<option' + (s === i.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
        '<td>' + (i.referral_credited ? '<span class="tiny">✓ referral credited</span>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<h2>Package subscriptions</h2><div class="table-wrap"><table class="list"><thead><tr><th>Client</th><th>Package</th><th>Status</th><th>Renews</th><th>Min. term ends</th><th></th></tr></thead><tbody>' +
    subs.map(function (s) {
      return '<tr><td>' + escapeHtml(clientName(s.client_id)) + '</td><td>' + escapeHtml(s.package_id) + '</td><td>' +
        '<select data-sub="' + s.id + '" aria-label="Subscription status">' + ['pending', 'active', 'cancelled', 'ended'].map(function (x) { return '<option' + (x === s.status ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></td>' +
        '<td>' + escapeHtml(pkDate(s.renews_at)) + '</td><td>' + escapeHtml(pkDate(s.min_term_end)) + '</td><td><button class="btn btn-secondary btn-sm" data-usage="' + s.id + '" data-pkg="' + escapeHtml(s.package_id) + '">Record usage</button></td></tr>';
    }).join('') + '</tbody></table></div>');

  view().querySelectorAll('[data-inv]').forEach(function (sel) {
    sel.addEventListener('change', async function () {
      let paid = null;
      if (sel.value === 'part_paid') { paid = parseInt(prompt('Amount received so far (Rs)?') || '', 10); if (!paid) { viewPayments(); return; } }
      const r = await PkDB.admin.setInvoiceStatus(sel.getAttribute('data-inv'), sel.value, paid);
      pkToast(r.error || 'Invoice updated'); viewPayments();
    });
  });
  view().querySelectorAll('[data-sub]').forEach(function (sel) {
    sel.addEventListener('change', async function () {
      const r = await PkDB.admin.setSubscriptionStatus(sel.getAttribute('data-sub'), sel.value);
      pkToast(r.error || 'Subscription updated'); viewPayments();
    });
  });
  view().querySelectorAll('[data-usage]').forEach(function (b) {
    b.addEventListener('click', async function () {
      const allow = await PkDB.listAllowances(b.getAttribute('data-pkg'));
      const dlg = pkDialog('<form id="uForm"><h3>Record usage</h3><div class="field"><label for="uItem">Allowance</label><select id="uItem">' + allow.map(function (a) { return '<option value="' + escapeHtml(a.item_key) + '">' + escapeHtml(a.label) + ' (' + a.qty + '/month)</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="uQty">Quantity</label><input id="uQty" type="number" min="1" value="1"></div>' +
        '<div class="field"><label for="uTask">Task ID (optional)</label><input id="uTask" placeholder="ACPK-0000"></div>' +
        '<div class="form-msg" id="uMsg"></div><div class="btn-row"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>');
      $('#uForm', dlg).addEventListener('submit', async function (e) {
        e.preventDefault();
        const pid = $('#uTask', dlg).value.trim().toUpperCase();
        const task = pid ? Adm.tasks.find(function (t) { return t.public_id === pid; }) : null;
        const r = await PkDB.admin.recordUsage(b.getAttribute('data-usage'), $('#uItem', dlg).value, parseInt($('#uQty', dlg).value, 10) || 1, task ? task.id : null, null);
        if (r.error) { $('#uMsg', dlg).textContent = r.error; $('#uMsg', dlg).className = 'form-msg error'; return; }
        dlg.close(); pkToast('Usage recorded');
      });
    });
  });
  $('#newInv').addEventListener('click', function () {
    const dlg = pkDialog('<form id="iForm"><h3>Issue an invoice</h3>' +
      '<div class="field"><label for="iClient">Client</label><select id="iClient">' + Adm.clients.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml((c.business_name || c.full_name) + ' · ' + c.phone) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="iDesc">Description</label><input id="iDesc" required placeholder="e.g. Dealer Starter — October"></div>' +
      '<div class="field"><label for="iAmt">Amount (Rs)</label><input id="iAmt" type="number" min="0" required></div>' +
      '<div class="form-msg" id="iMsg"></div><div class="btn-row"><button class="btn btn-primary" type="submit">Issue</button><button class="btn btn-secondary" type="button" data-close>Cancel</button></div></form>');
    $('#iForm', dlg).addEventListener('submit', async function (e) {
      e.preventDefault();
      const r = await PkDB.admin.createInvoice($('#iClient', dlg).value, $('#iDesc', dlg).value.trim(), parseInt($('#iAmt', dlg).value, 10));
      if (r.error) { $('#iMsg', dlg).textContent = r.error; $('#iMsg', dlg).className = 'form-msg error'; return; }
      dlg.close(); viewPayments();
    });
  });
}

/* ---------- 5. Clients ---------- */
async function viewClients() {
  await loadCore();
  setView('<h1>Clients</h1><div class="toolbar"><input type="search" id="cq" placeholder="Name, business, phone or email" aria-label="Search clients"></div><div class="table-wrap"><table class="list"><thead><tr><th>Client</th><th>Contact</th><th>Role</th><th>Open tasks</th><th>Points</th><th>Joined</th></tr></thead><tbody id="cRows"></tbody></table></div>');
  function render() {
    const q = $('#cq').value.trim().toLowerCase();
    $('#cRows').innerHTML = Adm.clients.filter(function (c) { return !q || [c.full_name, c.business_name, c.phone, c.email, c.city].join(' ').toLowerCase().indexOf(q) >= 0; }).map(function (c) {
      return '<tr><td>' + escapeHtml(c.full_name) + (c.business_name ? '<br><span class="tiny">' + escapeHtml(c.business_name) + '</span>' : '') + '</td><td>' + escapeHtml(c.phone) + '<br><span class="tiny">' + escapeHtml(c.email || '') + '</span></td>' +
        '<td>' + escapeHtml(c.role) + '</td><td>' + c.open_tasks + '</td><td>' + (c.points || 0) + '</td><td>' + escapeHtml(pkDate(c.joined_at)) + '</td></tr>';
    }).join('');
  }
  render();
  $('#cq').addEventListener('input', render);
}

/* ---------- 7. Visits & leads ---------- */
async function viewLeads() {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [events, leads] = await Promise.all([PkDB.admin.events(since), PkDB.admin.leads()]);
  const count = function (filter) { return events.filter(filter).length; };
  const waBySection = {};
  events.filter(function (e) { return e.event === 'wa_click'; }).forEach(function (e) { waBySection[e.section || '—'] = (waBySection[e.section || '—'] || 0) + 1; });
  const statuses = ['new', 'contacted', 'converted', 'closed'];
  setView('<h1>Visits &amp; leads</h1><p class="page-sub">Last 30 days.</p>' +
    '<div class="stat-row"><div class="card stat"><div class="v">' + count(function (e) { return e.event === 'page_view'; }) + '</div><div class="l">Page views</div></div>' +
    '<div class="card stat"><div class="v">' + count(function (e) { return e.event === 'wa_click'; }) + '</div><div class="l">WhatsApp clicks</div></div>' +
    '<div class="card stat"><div class="v">' + count(function (e) { return e.event === 'sign_up'; }) + '</div><div class="l">Sign-ups</div></div>' +
    '<div class="card stat"><div class="v">' + count(function (e) { return e.event === 'first_order'; }) + '</div><div class="l">Online orders</div></div></div>' +
    '<h2>WhatsApp clicks by section</h2>' + (Object.keys(waBySection).length ? '<table class="list"><tbody>' + Object.keys(waBySection).sort(function (a, b) { return waBySection[b] - waBySection[a]; }).map(function (k) { return '<tr><td>' + escapeHtml(k) + '</td><td>' + waBySection[k] + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">None yet.</p>') +
    '<h2>Form leads</h2>' + (leads.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>When</th><th>Name</th><th>Phone</th><th>City</th><th>From</th><th>Status</th></tr></thead><tbody>' +
      leads.map(function (l) {
        return '<tr><td>' + escapeHtml(pkWhen(l.created_at)) + '</td><td>' + escapeHtml(l.name) + (l.role ? '<br><span class="tiny">' + escapeHtml(l.role) + '</span>' : '') + '</td><td>' + escapeHtml(l.phone) + '</td><td>' + escapeHtml(l.city || '') + '</td><td>' + escapeHtml(l.kind + (l.section ? ' · ' + l.section : '')) + '</td>' +
          '<td><select data-lead="' + l.id + '" aria-label="Lead status">' + statuses.map(function (s) { return '<option' + (s === l.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">No leads yet.</p>'));
  view().querySelectorAll('[data-lead]').forEach(function (sel) {
    sel.addEventListener('change', async function () { const r = await PkDB.admin.setLeadStatus(sel.getAttribute('data-lead'), sel.value); pkToast(r.error || 'Saved'); });
  });
}

/* ---------- 6. Packages & prices ---------- */
function viewCatalogue() {
  const P = window.PK_DATA.packages.packages;
  const lines = window.PK_DATA.lines;
  setView('<h1>Packages &amp; prices</h1>' +
    '<p class="notice" style="margin-bottom:var(--space-md)">Prices, packages and monthly allowances all come from <span class="mono">data/services.json</span> and <span class="mono">data/packages.json</span>. To change one: edit the JSON, run <span class="mono">node scripts/validate-data.mjs</span> and <span class="mono">node scripts/gen-seed-sql.mjs</span>, then apply the regenerated seed so the database prices orders the same way the site shows them.</p>' +
    P.map(function (p) {
      const t = PkCatalogCore.packageTotals(p, lines);
      return '<div class="card section-card"><h2 style="margin-top:0">' + escapeHtml(p.name) + '</h2><p>' +
        (p.one_off ? money(p.one_off) + ' one-off · bought separately ' + money(t.setupSeparately) : money(p.monthly) + '/month + ' + money(p.setup || 0) + ' set-up · ' + p.min_months + '-month minimum · bought separately ' + money(t.monthlySeparately) + '/month') + '</p>' +
        (p.allowances ? '<table class="list"><tbody>' + p.allowances.map(function (a) { return '<tr><td>' + escapeHtml(a.label) + '</td><td>' + a.qty + ' / month</td></tr>'; }).join('') + '</tbody></table>' : '') + '</div>';
    }).join(''));
}

/* ---------- 8. Settings ---------- */
async function viewSettings() {
  const rows = await PkDB.admin.settings();
  const get = function (k, d) { const r = rows.find(function (x) { return x.key === k; }); return r ? r.value : d; };
  setView('<h1>Settings</h1><form class="card" id="setForm">' +
    '<div class="grid grid-2"><div class="field"><label for="sCut">Same-day cut-off hour (PKT, 24h)</label><input id="sCut" type="number" min="0" max="23" value="' + escapeHtml(get('cutoff_hour_pkt', 18)) + '"></div>' +
    '<div class="field"><label for="sDue">Due time of day (PKT, 24h)</label><input id="sDue" type="number" min="0" max="23" value="' + escapeHtml(get('due_hour_pkt', 21)) + '"></div>' +
    '<div class="field"><label for="sRev">Free rounds of changes</label><input id="sRev" type="number" min="0" max="2" value="' + escapeHtml(get('max_free_revisions', 2)) + '"></div></div>' +
    '<p class="tiny">WhatsApp number, phone, email and working hours are set in <span class="mono">js/config.js</span>. Payment details are deliberately not configurable here until they are confirmed.</p>' +
    '<button class="btn btn-primary btn-sm" type="submit">Save</button></form>');
  $('#setForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const pairs = [['cutoff_hour_pkt', '#sCut'], ['due_hour_pkt', '#sDue'], ['max_free_revisions', '#sRev']];
    for (const p of pairs) { const r = await PkDB.admin.saveSetting(p[0], parseInt($(p[1]).value, 10)); if (r.error) { pkToast(r.error); return; } }
    pkToast('Settings saved');
  });
}

const ROUTES = { today: viewToday, tasks: viewTasks, task: viewTask, payments: viewPayments, clients: viewClients, leads: viewLeads, catalogue: viewCatalogue, settings: viewSettings };

async function route() {
  const parts = (location.hash.replace(/^#/, '') || 'today').split('/');
  const name = ROUTES[parts[0]] ? parts[0] : 'today';
  document.querySelectorAll('#dashNav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-route') === (name === 'task' ? 'tasks' : name)); });
  const v = view(); const fresh = v.cloneNode(false); v.parentNode.replaceChild(fresh, v);
  fresh.innerHTML = '<p class="loading">Loading…</p>';
  try { await ROUTES[name](parts.slice(1)); } catch (e) { console.error(e); setView('<p class="form-msg error" style="display:block">Could not load: ' + escapeHtml(e.message || e) + '</p>'); }
}

document.addEventListener('DOMContentLoaded', async function () {
  const user = await pkRequireAuth(true);
  if (!user) return;
  await pkLoadData();
  window.addEventListener('hashchange', route);
  route();
});
