// Google Analytics 4 — visitor counts, top pages, where visitors come from.
// Approved by the owner (G-R2RVY98BBB, agenticcorepk.com only). Not loaded on
// local test servers. IP addresses are anonymised. Clicks come from pkTrack()
// and data-track links: event names and short section labels only, never
// personal data.
(function () {
  var ID = 'G-R2RVY98BBB';
  if (!/(^|\.)agenticcorepk\.com$/.test(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID, { anonymize_ip: true });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('[data-track]');
    if (!a) return;
    var p = { page: location.pathname.split('/').pop() || 'index.html' };
    var ch = a.getAttribute('data-channel');
    if (ch && /^[a-z0-9_:-]{1,40}$/i.test(ch)) p.channel = ch;
    window.gtag('event', a.getAttribute('data-track'), p);
  });
})();
// Short, non-personal labels only (no ids, numbers or free text).
function pkGaEvent(event, section) {
  if (typeof window.gtag !== 'function' || !/^[a-z0-9_]{1,40}$/i.test(String(event))) return;
  if (event === 'page_view') return;              // GA already counts page views (no double counting)
  var p = { page: location.pathname.split('/').pop() || 'index.html' };
  if (section && /^[a-z0-9_:-]{1,40}$/i.test(String(section)) && !/[0-9]{6,}/.test(String(section))) p.section = String(section);
  window.gtag('event', event, p);
}
