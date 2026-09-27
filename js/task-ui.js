/* Shared task display helpers (client dashboard + admin) */

const PK_STATUSES = ['received', 'waiting_on_you', 'confirmed', 'in_progress', 'ready_for_review', 'changes_requested', 'delivered', 'cancelled'];
const PK_CLOSED = ['delivered', 'cancelled'];

function pkStatusPill(status) {
  return '<span class="pill pill-' + status + '">' + escapeHtml(pkT('st_' + status)) + '</span>';
}

const pkFmtDateTime = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const pkFmtDate = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric' });
const pkFmtTime = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' });
const pkFmtDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }); // YYYY-MM-DD in PKT

function pkWhen(iso) { return iso ? pkFmtDateTime.format(new Date(iso)) + ' PKT' : ''; }
function pkDate(iso) { return iso ? pkFmtDate.format(new Date(iso)) : ''; }

// "today 9:00 pm PKT" / "tomorrow 9:00 pm PKT" / "30 Sep, 9:00 pm PKT"
function pkDueLabel(iso) {
  const d = new Date(iso);
  const day = pkFmtDay.format(d);
  const today = pkFmtDay.format(new Date());
  const tomorrow = pkFmtDay.format(new Date(Date.now() + 86400000));
  if (day === today) return 'today ' + pkFmtTime.format(d) + ' PKT';
  if (day === tomorrow) return 'tomorrow ' + pkFmtTime.format(d) + ' PKT';
  return pkWhen(iso);
}

function pkDuration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d) return d + ' d ' + h + ' h';
  if (h) return h + ' h ' + m + ' min';
  return m + ' min';
}

// Returns { text, cls } describing where the delivery clock stands.
// A missed deadline is always shown, never hidden.
function pkDueInfo(t) {
  if (t.status === 'delivered') return { text: 'Delivered', cls: '' };
  if (t.status === 'cancelled') return { text: 'Cancelled', cls: '' };
  if (t.status === 'waiting_on_you') {
    return { text: 'Clock paused' + (t.missing && t.missing.length ? ' · waiting on: ' + t.missing.join(', ') : ''), cls: 'paused' };
  }
  if (!t.due_at) {
    if (t.turnaround_days === null && t.confirmed_at) return { text: 'Runs on the agreed schedule', cls: '' };
    return { text: 'Due time is set once everything is in', cls: '' };
  }
  const left = new Date(t.due_at).getTime() - Date.now();
  if (left < 0 && t.status !== 'ready_for_review') {
    return { text: 'Running late — was due ' + pkDueLabel(t.due_at) + (t.late_reason ? '. ' + t.late_reason : ''), cls: 'late' };
  }
  if (t.status === 'ready_for_review') return { text: 'Ready for your review', cls: '' };
  return { text: 'Due in ' + pkDuration(left) + ' (' + pkDueLabel(t.due_at) + ')', cls: '' };
}

function pkSourceIcon(source) {
  return { web: '🌐 web', telegram: '✈ Telegram', whatsapp: '💬 WhatsApp', admin: '👤 team' }[source] || source;
}

function pkTaskRowHtml(t, href) {
  const due = pkDueInfo(t);
  return '<a class="task-row" href="' + href + '">' +
    '<span class="id">' + escapeHtml(t.public_id) + '</span>' + pkStatusPill(t.status) +
    '<span class="t">' + escapeHtml(t.title) + (t.quantity > 1 ? ' × ' + t.quantity : '') + '</span>' +
    '<span class="meta"><span>' + escapeHtml(pkSourceIcon(t.source)) + '</span><span class="' + due.cls + '">' + escapeHtml(due.text) + '</span></span>' +
  '</a>';
}

function pkTimelineHtml(events) {
  return '<ol class="timeline">' + events.map(function (e) {
    return '<li>' + pkStatusPill(e.status) + (e.note ? ' ' + escapeHtml(e.note) : '') +
      '<div class="when">' + escapeHtml(pkWhen(e.created_at)) + ' · ' + escapeHtml(e.actor_kind) + '</div></li>';
  }).join('') + '</ol>';
}

function pkDetailsHtml(details) {
  const keys = Object.keys(details || {});
  if (!keys.length) return '<p class="muted">No details yet.</p>';
  return '<dl class="kv">' + keys.map(function (k) {
    const v = details[k];
    return '<dt>' + escapeHtml(k.replace(/_/g, ' ')) + '</dt><dd>' + escapeHtml(typeof v === 'object' ? JSON.stringify(v) : v) + '</dd>';
  }).join('') + '</dl>';
}

function pkKindFromName(name) {
  const ext = (String(name).split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].indexOf(ext) >= 0) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'mov', 'webm', 'm4v'].indexOf(ext) >= 0) return 'video';
  return 'file';
}

function pkDialog(html) {
  // Swap in a fresh <dialog> each time so listeners from the previous
  // dialog (e.g. the order form's live price review) can't fire here.
  const old = document.getElementById('dlg');
  if (old.open) old.close();
  const dlg = old.cloneNode(false);
  old.replaceWith(dlg);
  dlg.innerHTML = html;
  pkTranslate(dlg);
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  return dlg;
}
