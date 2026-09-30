/* ============================================
   AgenticCore Pakistan — Quick Property Content tool (create.html)
   Status: AUTOMATED TOOL, deterministic. Runs entirely in the browser:
   no AI, nothing is sent or stored. Every sentence is a fixed template
   filled ONLY with what the user typed (or their own Estate listing),
   so it cannot invent facts. An AI-assisted version is planned
   (docs/INTEGRATION_CONTRACT.md).
   ============================================ */

const PK_CT_TYPES = { house: 'House', flat: 'Flat', plot: 'Plot', upper_portion: 'Upper portion', lower_portion: 'Lower portion', shop: 'Shop', office: 'Office', farm_house: 'Farm house', other: 'Property' };
const PK_CT_TYPES_RU = { house: 'Ghar', flat: 'Flat', plot: 'Plot', upper_portion: 'Upper portion', lower_portion: 'Lower portion', shop: 'Dukaan', office: 'Office', farm_house: 'Farm house', other: 'Property' };

// "52000000" → "Rs 5.2 crore"; lakh below a crore. Only formats what was typed.
function pkCtPrice(raw) {
  const n = Number(String(raw || '').replace(/[^0-9]/g, ''));
  if (!n) return '';
  const trim = function (x) { return String(Number(x.toFixed(2))); };
  if (n >= 1e7) return 'Rs ' + trim(n / 1e7) + ' crore';
  if (n >= 1e5) return 'Rs ' + trim(n / 1e5) + ' lakh';
  return 'Rs ' + n.toLocaleString('en-PK');
}

function pkCtFacts(f) {
  const out = [];
  if (f.size) out.push(f.size);
  if (f.beds) out.push(f.beds + ' Bed');
  if (f.baths) out.push(f.baths + ' Bath');
  return out;
}

function pkCtOutputs(f) {
  const type = PK_CT_TYPES[f.type] || 'Property';
  const title = [f.size, type].filter(Boolean).join(' ') + (f.purpose === 'rent' ? ' for Rent' : ' for Sale');
  const place = [f.area, f.city].filter(Boolean).join(', ');
  const price = pkCtPrice(f.price);
  const facts = pkCtFacts(f);
  const contact = [f.name, f.phone].filter(Boolean).join(' · ');
  const tag = function (s) { return s ? '#' + String(s).replace(/[^A-Za-z0-9]/g, '') : ''; };

  const sheet = [
    (f.purpose === 'rent' ? 'FOR RENT' : 'FOR SALE') + ' — ' + title,
    place ? 'Location: ' + place : '',
    price ? (f.purpose === 'rent' ? 'Rent: ' : 'Demand: ') + price + (f.purpose === 'rent' ? ' per month' : '') : '',
    facts.length ? 'Details: ' + facts.join(' · ') : '',
    f.notes ? 'Notes: ' + f.notes : '',
    f.listingUrl ? 'Photos & details: ' + f.listingUrl : '',
    contact ? 'Contact: ' + contact : ''
  ].filter(Boolean).join('\n');

  const wa = [
    '🏠 *' + title + '*',
    place ? '📍 ' + place : '',
    price ? '💰 ' + (f.purpose === 'rent' ? 'Rent: ' : 'Demand: ') + price : '',
    facts.length ? '📐 ' + facts.join(' | ') : '',
    f.notes ? '✅ ' + f.notes : '',
    f.listingUrl ? '🔗 ' + f.listingUrl : '',
    contact ? '📞 ' + contact : ''
  ].filter(Boolean).join('\n');

  const en = [
    title + (place ? ' in ' + place : '') + '.',
    [price ? (f.purpose === 'rent' ? 'Rent ' : 'Demand ') + price : '', facts.join(', ')].filter(Boolean).join(' · '),
    f.notes || '',
    f.listingUrl ? 'Details: ' + f.listingUrl : (contact ? 'Call or WhatsApp: ' + contact : ''),
    [tag(f.city), tag(f.area), f.purpose === 'rent' ? '#ForRent' : '#PropertyForSale', '#RealEstatePakistan'].filter(Boolean).join(' ')
  ].filter(Boolean).join('\n');

  const ruType = PK_CT_TYPES_RU[f.type] || 'Property';
  const ru = [
    (f.purpose === 'rent' ? 'Kiraye ke liye: ' : 'Baraye farokht: ') + [f.size, ruType].filter(Boolean).join(' ') + (place ? ', ' + place : ''),
    price ? (f.purpose === 'rent' ? 'Kiraya: ' : 'Demand: ') + price : '',
    facts.length ? facts.join(', ') : '',
    f.notes || '',
    f.listingUrl ? 'Tafseelat aur tasaveer: ' + f.listingUrl : '',
    contact ? 'Rabta karein: ' + contact : ''
  ].filter(Boolean).join('\n');

  return { title: title, place: place, price: price, facts: facts, sheet: sheet, wa: wa, en: en, ru: ru };
}

if (typeof document !== 'undefined') (function () {
  const $ = function (id) { return document.getElementById(id); };
  const state = { user: null, listings: [], listing: null, logoUrl: null, photoFile: null };

  function read() {
    return {
      purpose: $('ctPurpose').value, type: $('ctType').value, city: $('ctCity').value.trim(), area: $('ctArea').value.trim(),
      price: $('ctPrice').value.trim(), size: $('ctSize').value.trim(), beds: $('ctBeds').value.replace(/[^0-9]/g, ''), baths: $('ctBaths').value.replace(/[^0-9]/g, ''),
      notes: $('ctNotes').value.trim().replace(/\s+/g, ' '), name: $('ctName').value.trim(), phone: $('ctPhone').value.trim(),
      listingUrl: state.listing ? PK_CONFIG.estateUrl + '/listing.html?id=' + state.listing.id : ''
    };
  }

  let timer = null;
  function render() {
    clearTimeout(timer);
    timer = setTimeout(async function () {
      const f = read();
      const o = pkCtOutputs(f);
      $('outSheet').value = o.sheet; $('outWa').value = o.wa; $('outEn').value = o.en; $('outRu').value = o.ru;
      $('ctWaLink').href = 'https://wa.me/?text=' + encodeURIComponent(o.wa);
      await PkShareCard.draw($('ctCanvas'), {
        purpose: f.purpose, title: o.title, place: o.place, priceText: o.price, facts: o.facts, name: f.name, phone: f.phone,
        photo: state.photoFile || (state.listing && (state.listing.photos || [])[0]) || null,
        logo: $('ctUseKit') && $('ctUseKit').checked ? state.logoUrl : null, listingUrl: f.listingUrl
      });
      const packHref = 'dashboard.html#pack' + (state.listing ? '/estate/' + state.listing.id : '');
      $('ctPack').href = packHref;
    }, 200);
  }

  function fillFromListing(l) {
    state.listing = l;
    $('ctPurpose').value = l && l.type === 'rent' ? 'rent' : 'sale';
    if (l && $('ctType').querySelector('option[value="' + l.property_type + '"]')) $('ctType').value = l.property_type;
    $('ctCity').value = l ? l.city || '' : '';
    $('ctArea').value = l ? l.area || '' : '';
    $('ctPrice').value = l && l.price ? String(l.price) : '';
    $('ctSize').value = l && Number(l.size_marla) > 0 ? l.size_marla + ' ' + (l.size_unit === 'marla' || !l.size_unit ? 'Marla' : l.size_unit) : '';
    $('ctBeds').value = l && l.beds ? l.beds : '';
    $('ctBaths').value = l && l.baths ? l.baths : '';
    $('ctListingNote').hidden = !l;
    render();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const form = $('ctForm');
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    $('ctPhoto').addEventListener('change', function () {
      const file = this.files && this.files[0];
      const bad = file && (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 15 * 1048576);
      $('ctPhotoMsg').textContent = bad ? pkT('ct_bad_photo') : '';
      state.photoFile = bad ? null : file || null;
      render();
    });
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const el = $(b.getAttribute('data-copy'));
        try { await navigator.clipboard.writeText(el.value); } catch (e) { el.select(); document.execCommand('copy'); }
        pkToast(pkT('ct_copied'));
        pkTrack('content_copy', b.getAttribute('data-copy'));
      });
    });
    $('ctDownload').addEventListener('click', function () {
      try {
        $('ctCanvas').toBlob(function (blob) {
          if (!blob) { pkToast(pkT('ct_dl_fail')); return; }
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = 'property-card-' + (read().area || 'agenticcore').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.png';
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          pkTrack('content_card', 'download');
        }, 'image/png');
      } catch (e) { pkToast(pkT('ct_dl_fail')); }
    });

    render();

    // Signed in: offer own Estate listings and the private Brand Kit (logo + contact).
    const user = await PkDB.currentUser().catch(function () { return null; });
    if (!user) { $('ctSignedOut').hidden = false; return; }
    state.user = user;
    const [listings, kit, settings] = await Promise.all([
      PkDB.getMyEstateListingsFull(user.id).catch(function () { return []; }),
      PkDB.getBrandKit(user.id).catch(function () { return null; }),
      PkDB.getSettings(user.id).catch(function () { return null; })
    ]);
    state.listings = listings;
    const c = (kit && kit.contact) || {};
    if (!$('ctName').value) $('ctName').value = (settings && settings.business_name) || user.agency_name || user.full_name || '';
    if (!$('ctPhone').value) $('ctPhone').value = c.whatsapp || c.phone || (settings && settings.whatsapp) || user.phone || '';
    const logo = kit && (kit.files || []).find(function (x) { return x.kind === 'logo_light' || x.kind === 'logo_dark'; });
    if (logo) { state.logoUrl = await PkDB.signedUrl('pk-brand-kits', logo.path); $('ctKitRow').hidden = false; }
    if (listings.length) {
      $('ctListingRow').hidden = false;
      $('ctListing').innerHTML = '<option value="">' + escapeHtml(pkT('pk_manual')) + '</option>' + listings.map(function (l) { return '<option value="' + escapeHtml(l.id) + '">' + escapeHtml(l.title) + ' · ' + escapeHtml(l.area) + '</option>'; }).join('');
      $('ctListing').addEventListener('change', function () { fillFromListing(listings.find(function (l) { return l.id === $('ctListing').value; }) || null); });
      const want = new URLSearchParams(location.search).get('listing');
      const own = want && listings.find(function (l) { return l.id === want; });
      if (own) { $('ctListing').value = own.id; fillFromListing(own); }
      else if (want) $('ctListingMsg').textContent = pkT('pk_not_yours');
    }
    render();
  });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { pkCtOutputs: pkCtOutputs, pkCtPrice: pkCtPrice };
