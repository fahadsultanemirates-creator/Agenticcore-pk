/* AgenticCore Pakistan — landing page behaviour */

const PK_FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function pkRenderLandingData() {
  const D = window.PK_DATA;
  if (!D.services) return;

  document.getElementById('svcGroups').innerHTML = D.services.groups.map(pkGroupCardHtml).join('');
  document.getElementById('pkgList').innerHTML = D.packages.packages.map(function (p) { return pkPackageCardHtml(p); }).join('');
  document.getElementById('pkgIncludes').textContent = pkPick(D.packages.meta, 'monthly_includes');
  const chart = D.lines['4-dfy'];
  if (chart) document.getElementById('freeChartPrice').textContent = Rs(chart.line.price);

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

document.addEventListener('DOMContentLoaded', async function () {
  pkInitTabs();
  pkInitForms();
  try {
    await pkLoadData();
    pkRenderLandingData();
    pkInjectSchema();
    pkOnLanguageChange(pkRenderLandingData);
    pkTrack('page_view', 'home');
  } catch (e) {
    console.error('Could not load catalogue data', e);
  }
  const user = await PkDB.currentUser().catch(function () { return null; });
  if (user) document.getElementById('estateMyListings').classList.remove('hidden');

  // Count package views once the section scrolls into sight.
  const pk = document.getElementById('packages');
  if ('IntersectionObserver' in window && pk) {
    const io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { pkTrack('package_view', 'packages'); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(pk);
  }
});
