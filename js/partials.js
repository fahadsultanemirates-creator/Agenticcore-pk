/* ============================================
   AgenticCore Pakistan — shared header / footer / WhatsApp
   Injected into <div id="site-header"> and <div id="site-footer">.
   <body data-page="home|services|legal|..."> marks the active page.
   ============================================ */

const PK_ICONS = {
  telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.6c.3-1.1-.8-2-1.9-1.6L2.6 9.9c-1.1.4-1.1 2 0 2.4l4.7 1.5 1.8 5.7c.3.9 1.5 1.1 2.1.3l2.5-3.2 4.9 3.6c.9.6 2.1.1 2.3-1l3-14.6zM9.6 14.1l-.4 4.1-1.4-4.6 10.9-7.2-9.1 7.7z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm5.8 14.03c-.25.69-1.43 1.33-1.97 1.38-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36h.55c.17 0 .41-.06.64.49.25.59.83 2.02.9 2.17.08.14.12.31.03.5-.1.19-.14.31-.29.48l-.43.5c-.14.14-.29.3-.13.59.17.29.74 1.22 1.59 1.97 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.62-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.67.79 1.96.93.29.14.48.22.55.34.07.12.07.69-.18 1.38z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  whatsapp_channel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.4 6.3V8.6a8.1 8.1 0 0 0 4.7 1.5V6.7A4.7 4.7 0 0 1 16.6 2z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.6c-4 0-4.9 3-4.9 4.9v2H6.4v4h2.7V22H14v-9.5h3.3l.4-4H14z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
};

function pkIsHome() { return document.body.getAttribute('data-page') === 'home'; }
function pkHomeAnchor(id) { return (pkIsHome() ? '' : 'index.html') + '#' + id; }

/* ---------- WhatsApp links ----------
   Every WhatsApp button is a plain <a> whose HTML href already points to
   a working fallback (online order), so it works without JavaScript.
   With a confirmed number in PK_CONFIG it becomes a wa.me link whose
   pre-filled message is tagged [LP-section] so leads are traceable
   without cookies. */
function pkWaHref(message, section) {
  const text = 'Assalam-o-Alaikum, ' + (message || "I'd like to know more about AgenticCore Pakistan.") + (section ? ' [LP-' + section + ']' : '');
  return 'https://wa.me/' + PK_CONFIG.whatsappNumber + '?text=' + encodeURIComponent(text);
}

// Where WhatsApp buttons point while no number is configured.
function pkWaFallback() { return document.body.getAttribute('data-wa-fallback') || 'signup.html'; }

function pkWireWhatsAppLinks(scope) {
  (scope || document).querySelectorAll('a[data-wa]').forEach(function (a) {
    if (PK_CONFIG.whatsappNumber) {
      a.href = pkWaHref(a.getAttribute('data-wa-msg'), a.getAttribute('data-wa'));
      a.target = '_blank'; a.rel = 'noopener';
    } else if (a.getAttribute('href') === 'signup.html') {
      a.href = pkWaFallback() + (pkWaFallback() === 'signup.html' ? '?intent=' + encodeURIComponent(a.getAttribute('data-wa')) : '');
    }
    if (!a.dataset.waTracked) {
      a.dataset.waTracked = '1';
      a.addEventListener('click', function () { pkTrack('wa_click', a.getAttribute('data-wa')); });
    }
  });
}

/* ---------- lightweight analytics ----------
   Writes to pk_events (insert-only for the public). Failures are
   ignored so analytics can never break a page. */
function pkTrack(event, section, meta) {
  if (typeof pkGaEvent === 'function') pkGaEvent(event, section);   // Google Analytics (js/ac-analytics.js)
  try {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    supabaseClient.from('pk_events').insert({ event: event, section: section || null, path: location.pathname, meta: meta || null }).then(function () {}, function () {});
  } catch (e) { /* ignore */ }
}

async function pkRenderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const user = (typeof PkDB !== 'undefined') ? await PkDB.currentUser().catch(function () { return null; }) : null;

  const cta = user
    ? '<a href="' + (user.role === 'admin' ? 'admin.html' : 'dashboard.html') + '" class="btn btn-secondary btn-sm" data-i18n="' + (user.role === 'admin' ? 'nav_admin' : 'nav_dashboard') + '"></a>' +
      '<button class="btn btn-primary btn-sm" id="pkLogoutBtn" type="button" data-i18n="nav_logout"></button>'
    : '<a href="login.html" class="btn btn-secondary btn-sm" data-i18n="nav_login"></a>' +
      '<a href="signup.html" class="btn btn-primary btn-sm" data-i18n="nav_signup"></a>';

  el.innerHTML =
    '<nav class="nav" id="nav" aria-label="Main">' +
      '<div class="container nav-inner">' +
        '<a href="index.html" class="nav-logo nav-logo-slogan"><img src="images/agenticcore-logo-light.png" alt="AgenticCore.estate" class="nav-logo-img" width="187" height="40"><span class="nav-slogan" data-i18n="h2_slogan">Khwabon se ghar tak</span></a>' +
        '<div class="nav-mobile-actions">' +
          '<a class="icon-btn wa" data-wa="header" href="signup.html" data-i18n-aria="wa_us">' + PK_ICONS.wa + '</a>' +
          '<button class="icon-btn" id="pkMenuBtn" type="button" aria-expanded="false" aria-controls="navRight" data-i18n-aria="nav_menu">' + PK_ICONS.menu + '</button>' +
        '</div>' +
        '<div class="nav-right" id="navRight">' +
          '<div class="nav-links">' +
            '<a href="services.html" data-i18n="nav_services"' + (document.body.dataset.page === 'services' ? ' class="active"' : '') + '></a>' +
            '<a href="' + pkHomeAnchor('packages') + '" data-i18n="nav_packages"></a>' +
            '<a href="' + pkHomeAnchor('how') + '" data-i18n="nav_how"></a>' +
            '<a href="' + pkHomeAnchor('referrals') + '" data-i18n="nav_referral"></a>' +
            (PK_I18N.en.ct_nav ? '<a href="create.html" data-i18n="ct_nav"' + (document.body.dataset.page === 'create' ? ' class="active"' : '') + '></a>' : '') +
          '</div>' +
          '<div class="nav-cta">' +
            '<button class="lang-toggle" id="pkLangToggle" type="button"></button>' + cta +
          '</div>' +
        '</div>' +
      '</div>' +
    '</nav>';

  document.getElementById('pkLangToggle').addEventListener('click', pkToggleLanguage);
  const menuBtn = document.getElementById('pkMenuBtn');
  const navRight = document.getElementById('navRight');
  menuBtn.addEventListener('click', function () {
    const open = navRight.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navRight.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { navRight.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });
  const logout = document.getElementById('pkLogoutBtn');
  if (logout) logout.addEventListener('click', async function () { await PkDB.logOut(); window.location.href = 'index.html'; });
}

function pkRenderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  const groups = (window.PK_DATA && window.PK_DATA.services) ? window.PK_DATA.services.groups : null;
  const serviceLinks = groups
    ? groups.map(function (g) { return '<li><a href="services.html#' + g.slug + '">' + escapeHtml(pkPick(g, 'type')) + '</a></li>'; }).join('')
    : '<li><a href="services.html" data-i18n="nav_services"></a></li>';

  const contact = [];
  if (PK_CONFIG.whatsappNumber) contact.push('<li><a class="pk-contact-link" data-wa="footer" href="signup.html">' + PK_ICONS.wa + '<span data-i18n="contact_wa_chat"></span> <span dir="ltr">' + escapeHtml(PK_CONFIG.whatsappDisplay || '+' + PK_CONFIG.whatsappNumber) + '</span></a></li>');
  if (PK_CONFIG.telegram) contact.push('<li><a class="pk-contact-link" href="' + PK_CONFIG.telegram + '?start=pk" target="_blank" rel="noopener" data-pk-telegram="footer">' + PK_ICONS.telegram + '<span data-i18n="contact_telegram"></span> <span dir="ltr">@AgenticcoreEstatebot</span></a></li>');
  if (PK_CONFIG.phoneNumber) contact.push('<li><a href="tel:+' + PK_CONFIG.phoneNumber + '">+' + PK_CONFIG.phoneNumber + '</a></li>');
  if (PK_CONFIG.email) contact.push('<li><a class="pk-contact-link" href="mailto:' + PK_CONFIG.email + '?subject=' + encodeURIComponent('AgenticCore Pakistan enquiry') + '" data-pk-email="footer">' + PK_ICONS.email + '<span dir="ltr">' + escapeHtml(PK_CONFIG.email) + '</span></a></li>');
  contact.push('<li><span class="muted">' + PK_CONFIG.hours + '</span></li>');

  el.innerHTML =
    '<footer class="footer">' +
      '<div class="container">' +
        '<div class="footer-top">' +
          '<div>' +
            '<a href="index.html" class="nav-logo"><img src="images/agenticcore-logo-light.png" alt="AgenticCore.estate" class="nav-logo-img" width="187" height="40"></a>' +
            '<p class="muted" style="margin-top:0.8rem" data-i18n="footer_tagline"></p>' +
          '</div>' +
          '<div><h5 data-i18n="footer_services"></h5><ul id="pkFooterServices">' + serviceLinks + '</ul></div>' +
          '<div><h5 data-i18n="footer_company"></h5><ul>' +
            '<li><a href="' + pkHomeAnchor('packages') + '" data-i18n="nav_packages"></a></li>' +
            '<li><a href="' + pkHomeAnchor('how') + '" data-i18n="nav_how"></a></li>' +
            '<li><a href="legal.html#referrals" data-i18n="footer_ref_terms"></a></li>' +
            '<li><a href="legal.html#privacy" data-i18n="footer_privacy"></a></li>' +
            '<li><a href="legal.html#terms" data-i18n="footer_terms"></a></li>' +
            '<li><a href="legal.html#refunds" data-i18n="footer_refunds"></a></li>' +
            '<li><a href="login.html" data-i18n="nav_login"></a></li>' +
            '<li><a href="' + PK_CONFIG.estateUrl + '/?from=pk&intent=browse" data-pk-estate="footer">agenticcore.estate</a></li>' +
          '</ul></div>' +
          '<div><h5 data-i18n="footer_contact"></h5><ul>' + contact.join('') + '</ul></div>' +
        '</div>' +
        ((PK_CONFIG.social || []).length ? '<div class="pk-follow"><h5 data-i18n="footer_follow_h"></h5><ul class="pk-social" role="list">' + PK_CONFIG.social.map(function (x) {
          return '<li><a href="' + escapeHtml(x.url) + '" target="_blank" rel="noopener noreferrer" data-i18n-aria="social_' + x.key + '_aria" aria-label="' + x.key + '" data-pk-social="' + x.key + '">' + (PK_ICONS[x.key] || '') + '<span data-i18n="social_' + x.key + '"></span></a></li>';
        }).join('') + '</ul></div>' : '') +
        '<div class="footer-small">' +
          '<span data-i18n="footer_small"></span>' +
          '<span>© 2026 AgenticCore Pakistan. <span data-i18n="footer_rights"></span></span>' +
        '</div>' +
      '</div>' +
    '</footer>';
}

// Desktop: round WhatsApp button. Mobile: sticky WhatsApp | Call | Packages bar.
function pkRenderFloating() {
  if (document.body.hasAttribute('data-no-float')) return;
  const wrap = document.createElement('div');
  const callHref = PK_CONFIG.phoneNumber ? 'tel:+' + PK_CONFIG.phoneNumber : pkHomeAnchor('contact');
  wrap.innerHTML =
    '<a class="wa-float" data-wa="float" href="signup.html" data-i18n-aria="wa_us">' + PK_ICONS.wa + '</a>' +
    '<nav class="mobile-bar" aria-label="Quick actions">' +
      '<a class="wa" data-wa="mobile-bar" href="signup.html">' + PK_ICONS.wa + '<span>WhatsApp</span></a>' +
      '<a href="' + callHref + '">' + PK_ICONS.phone + '<span data-i18n="call"></span></a>' +
      '<a href="' + pkHomeAnchor('packages') + '">' + PK_ICONS.box + '<span data-i18n="nav_packages"></span></a>' +
    '</nav>';
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  document.body.classList.add('has-mobile-bar');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
}

function pkToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 2600);
}

/* Catalogue data, fetched once per page that needs it. */
window.PK_DATA = window.PK_DATA || {};
async function pkLoadData() {
  if (window.PK_DATA.services && window.PK_DATA.packages) return window.PK_DATA;
  const [s, p] = await Promise.all([fetch('data/services.json').then(function (r) { return r.json(); }), fetch('data/packages.json').then(function (r) { return r.json(); })]);
  window.PK_DATA.services = s;
  window.PK_DATA.packages = p;
  window.PK_DATA.lines = PkCatalogCore.indexLines(s.services);
  return window.PK_DATA;
}

document.addEventListener('click', function (e) {
  const a = e.target && e.target.closest && e.target.closest('[data-pk-social],[data-pk-email]');
  if (a) pkTrack(a.hasAttribute('data-pk-social') ? 'social_click' : 'email_click', a.getAttribute('data-pk-social') || 'footer');
});

document.addEventListener('DOMContentLoaded', async function () {
  await pkRenderHeader();
  pkRenderFooter();
  pkRenderFloating();
  pkWireWhatsAppLinks();
  pkInitLanguage();
  pkOnLanguageChange(function () {
    // footer group names are data-driven; re-render them in the new language
    const ul = document.getElementById('pkFooterServices');
    if (ul && window.PK_DATA.services) ul.innerHTML = window.PK_DATA.services.groups.map(function (g) { return '<li><a href="services.html#' + g.slug + '">' + escapeHtml(pkPick(g, 'type')) + '</a></li>'; }).join('');
  });
});
