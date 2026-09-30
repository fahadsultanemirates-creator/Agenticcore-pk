/* ============================================
   AgenticCore Pakistan — dashboard workspace (Product 2.0)
   Adds, without replacing the existing dashboard:
     #pack                      Property Marketing Pack builder
     #pack/lines/<id,id>        …with outputs preselected (from the homepage)
     #pack/estate/<uuid>        …prefilled from the user's OWN Estate listing
     #listings                  richer Estate listing cards (Promote / Create content)
   and workspace tiles on Home. Orders still go through PkDB.placeOrder
   → pk_place_order, which prices every line server-side.
   ============================================ */

const PK_MAX_PHOTOS = 10;
const PK_MAX_PHOTO_MB = 10;

// Deliverable label by the service that produced it (for the Deliveries cards).
const PK_DELIV_KIND = [
  ['flyer', [9, 10, 11, 12]], ['social', [30, 31, 32, 33, 35]], ['brochure', [6, 7, 13]],
  ['video', [21, 22, 23, 24, 26, 27, 29]], ['caption', [34, 37, 55]], ['plan', [4, 5, 25]], ['web', [14, 15, 16, 17, 18, 19, 20]]
];
function pkDelivKind(serviceNo) {
  const hit = PK_DELIV_KIND.find(function (k) { return k[1].indexOf(serviceNo) >= 0; });
  return hit ? hit[0] : 'other';
}

function pkBrandKitStatus(kit, settings, user) {
  const c = (kit && kit.contact) || {};
  const logo = Boolean(kit && (kit.files || []).some(function (f) { return f.kind === 'logo_light' || f.kind === 'logo_dark'; }));
  const items = [
    ['logo', logo],
    ['name', Boolean((settings && settings.business_name) || user.agency_name || user.builder_company_name)],
    ['phone', Boolean(c.phone)],
    ['whatsapp', Boolean(c.whatsapp || (settings && settings.whatsapp))],
    ['website', Boolean(c.website)],
    ['notes', Boolean(kit && ((kit.taglines || {}).en || (kit.taglines || {}).ur || kit.fonts))]
  ];
  return { items: items, done: items.filter(function (i) { return i[1]; }).length, total: items.length };
}

function pkBrandKitSummaryHtml(st) {
  return '<div class="kit-sum">' + st.items.map(function (i) {
    return '<span class="kit-item ' + (i[1] ? 'on' : 'off') + '">' + (i[1] ? '✓ ' : '○ ') + escapeHtml(pkT('bk_' + i[0])) + '</span>';
  }).join('') + '</div>';
}

/* ---------------- Home: workspace tiles ---------------- */
async function pkWorkspaceHtml() {
  const [kit, listings] = await Promise.all([
    PkDB.getBrandKit(Dash.user.id).catch(function () { return null; }),
    PkDB.getMyEstateListingsFull(Dash.user.id).catch(function () { return []; })
  ]);
  const st = pkBrandKitStatus(kit, Dash.settings, Dash.user);
  const tiles = [
    ['#pack', 'ws_market', '▤', pkT('ws_market_sub')],
    ['#order', 'd_order', '＋', pkT('ws_order_sub')],
    ['#listings', 'ws_listings', '⌂', listings.length + ' ' + pkT('ws_on_estate')],
    ['#profile', 'ws_brandkit', '◆', st.done + '/' + st.total + ' ' + pkT('ws_kit_done')],
    ['#deliveries', 'd_deliveries', '⬇', pkT('ws_deliv_sub')],
    ['#order/packages', 'nav_packages', '▦', pkT('ws_pkg_sub')],
    ['#points', 'd_points', '★', (Dash.user.points || 0).toLocaleString('en-PK') + ' ' + pkT('ws_points')],
    ['#support', 'd_support', '✆', pkT('ws_support_sub')]
  ];
  const fromEstate = listings.slice(0, 3).map(pkListingCardHtml).join('');
  return '<h2>' + escapeHtml(pkT('ws_title')) + '</h2>' +
    '<div class="ws-tiles">' + tiles.map(function (t) {
      return '<a class="ws-tile" href="' + t[0] + '"><span class="ws-ic" aria-hidden="true">' + t[2] + '</span><span class="ws-name">' + escapeHtml(pkT(t[1])) + '</span><span class="ws-sub">' + escapeHtml(t[3]) + '</span></a>';
    }).join('') + '</div>' +
    (fromEstate ? '<h2>' + escapeHtml(pkT('ws_from_estate')) + '</h2><div class="lst-cards">' + fromEstate + '</div>' : '');
}

/* ---------------- Estate listing cards ---------------- */
function pkListingFacts(l) {
  const f = [];
  if (Number(l.size_marla) > 0) f.push(l.size_marla + ' ' + (l.size_unit || 'marla'));
  if (Number(l.beds) > 0) f.push(l.beds + ' bed');
  if (Number(l.baths) > 0) f.push(l.baths + ' bath');
  return f.join(' · ');
}
function pkSafePhoto(url) {
  return /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(String(url || '')) ? url : '';
}
function pkListingCardHtml(l) {
  const photo = pkSafePhoto((l.photos || [])[0]);
  const estate = PK_CONFIG.estateUrl;
  return '<article class="lst-card">' +
    '<div class="lst-thumb">' + (photo ? '<img src="' + escapeHtml(photo) + '" alt="" loading="lazy" width="320" height="200">' : '<span aria-hidden="true">⌂</span>') + '</div>' +
    '<div class="lst-body"><div class="lst-price">' + money(l.price) + (l.type === 'rent' ? ' / mo' : '') + '</div>' +
      '<div class="lst-title">' + escapeHtml(l.title) + '</div>' +
      '<div class="tiny">' + escapeHtml(l.area + ', ' + l.city) + (pkListingFacts(l) ? ' · ' + escapeHtml(pkListingFacts(l)) : '') + '</div>' +
      '<div class="tiny">' + (l.photos || []).length + ' ' + escapeHtml(pkT('ls_photos')) + (l.verified ? ' · ✓ ' + escapeHtml(pkT('ls_checked')) : '') + '</div>' +
      '<div class="btn-row lst-actions"><a class="btn btn-primary btn-sm" href="#pack/estate/' + encodeURIComponent(l.id) + '">' + escapeHtml(pkT('ls_promote')) + '</a>' +
      '<a class="btn btn-secondary btn-sm" href="create.html?listing=' + encodeURIComponent(l.id) + '">' + escapeHtml(pkT('ls_content')) + '</a>' +
      '<a class="btn btn-secondary btn-sm" href="' + estate + '/listing.html?id=' + encodeURIComponent(l.id) + '" target="_blank" rel="noopener">' + escapeHtml(pkT('ls_view')) + ' ↗</a>' +
      '<a class="btn btn-secondary btn-sm" href="' + estate + '/toolkit.html?id=' + encodeURIComponent(l.id) + '" target="_blank" rel="noopener">' + escapeHtml(pkT('ls_toolkit')) + ' ↗</a></div>' +
    '</div></article>';
}

async function viewListingsP2() {
  const u = Dash.user;
  const list = await PkDB.getMyEstateListingsFull(u.id);
  const org = u.role === 'agency' && u.agency_name ? '<p class="muted">' + escapeHtml(u.agency_name) + ' · ' + escapeHtml(pkT('ls_agency_profile')) + '</p>' : '';
  setView('<h1 data-i18n="d_listings">Estate listings</h1>' +
    '<p class="page-sub">' + escapeHtml(pkT('ls_sub')) + '</p>' + org +
    (list.length ? '<div class="lst-cards">' + list.map(pkListingCardHtml).join('') + '</div>'
      : '<div class="card section-card"><p>' + escapeHtml(pkT('ls_none')) + '</p></div>') +
    '<div class="btn-row" style="margin-top:var(--space-md)"><a class="btn btn-primary" href="' + PK_CONFIG.estateUrl + '/sell.html" target="_blank" rel="noopener">' + escapeHtml(pkT('ls_add')) + ' ↗</a>' +
    '<a class="btn btn-secondary" href="' + PK_CONFIG.estateUrl + '/dashboard.html" target="_blank" rel="noopener">' + escapeHtml(pkT('ls_manage')) + ' ↗</a></div>' +
    '<p class="tiny" style="margin-top:0.6rem">' + escapeHtml(pkT('ls_login_note')) + '</p>');
}

/* ---------------- Property Marketing Pack ---------------- */
async function viewPack(sub) {
  sub = sub || [];
  await pkLoadP2Data();
  const [kit, owned] = await Promise.all([
    PkDB.getBrandKit(Dash.user.id).catch(function () { return null; }),
    PkDB.getMyEstateListingsFull(Dash.user.id).catch(function () { return []; })
  ]);
  const st = pkBrandKitStatus(kit, Dash.settings, Dash.user);
  let preLines = null, listing = null, notice = '';
  if (sub[0] === 'lines' && sub[1]) {
    preLines = decodeURIComponent(sub[1]).split(',').filter(function (id) { return window.PK_DATA.lines[id]; });
  }
  if (sub[0] === 'estate') {
    if (!PkDB.isUuid(sub[1])) notice = pkT('pk_bad_link');
    else {
      listing = await PkDB.getOwnedEstateListing(sub[1], Dash.user.id);
      if (!listing) notice = pkT('pk_not_yours');
    }
  }

  const types = [['house', 'House'], ['flat', 'Flat / apartment'], ['plot', 'Plot'], ['upper_portion', 'Upper portion'], ['lower_portion', 'Lower portion'], ['shop', 'Shop'], ['office', 'Office'], ['farm_house', 'Farm house'], ['other', 'Other']];
  setView('<h1>' + escapeHtml(pkT('pk_title')) + '</h1>' +
    '<p class="page-sub">' + escapeHtml(pkT('pk_sub')) + '</p>' +
    (notice ? '<p class="notice" role="alert" style="margin-bottom:var(--space-md)">' + escapeHtml(notice) + '</p>' : '') +
    '<form id="packForm" novalidate>' +
      '<div class="card section-card"><h2 style="margin-top:0">1. ' + escapeHtml(pkT('pk_step_property')) + '</h2>' +
        (owned.length ? '<div class="field"><label for="pkListing">' + escapeHtml(pkT('pk_use_listing')) + '</label><select id="pkListing"><option value="">' + escapeHtml(pkT('pk_manual')) + '</option>' +
          owned.map(function (l) { return '<option value="' + escapeHtml(l.id) + '"' + (listing && listing.id === l.id ? ' selected' : '') + '>' + escapeHtml(l.title) + ' · ' + escapeHtml(l.area) + '</option>'; }).join('') + '</select>' +
          '<span class="hint">' + escapeHtml(pkT('pk_listing_hint')) + '</span></div>' : '<p class="tiny">' + escapeHtml(pkT('pk_no_listings')) + ' <a class="link" href="' + PK_CONFIG.estateUrl + '/sell.html" target="_blank" rel="noopener">' + escapeHtml(pkT('ls_add')) + '</a></p>') +
        '<div class="grid grid-2">' +
          '<div class="field"><label for="pkPurpose">' + escapeHtml(pkT('pk_purpose')) + '</label><select id="pkPurpose"><option value="sale">' + escapeHtml(pkT('pk_sale')) + '</option><option value="rent">' + escapeHtml(pkT('pk_rent')) + '</option></select></div>' +
          '<div class="field"><label for="pkType">' + escapeHtml(pkT('pk_type')) + '</label><select id="pkType">' + types.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="pkCity">' + escapeHtml(pkT('pk_city')) + '</label><input id="pkCity" autocomplete="address-level2" maxlength="60"></div>' +
          '<div class="field"><label for="pkArea">' + escapeHtml(pkT('pk_area')) + ' *</label><input id="pkArea" required maxlength="120" placeholder="e.g. DHA Phase 2, Sector E"></div>' +
          '<div class="field"><label for="pkPrice">' + escapeHtml(pkT('pk_price')) + '</label><input id="pkPrice" inputmode="numeric" maxlength="16" placeholder="e.g. 52000000"></div>' +
          '<div class="field"><label for="pkSize">' + escapeHtml(pkT('pk_size')) + '</label><input id="pkSize" maxlength="30" placeholder="e.g. 10 marla"></div>' +
          '<div class="field"><label for="pkBeds">' + escapeHtml(pkT('pk_beds')) + '</label><input id="pkBeds" inputmode="numeric" maxlength="3"></div>' +
          '<div class="field"><label for="pkBaths">' + escapeHtml(pkT('pk_baths')) + '</label><input id="pkBaths" inputmode="numeric" maxlength="3"></div>' +
        '</div>' +
        '<div class="field"><label for="pkNotes">' + escapeHtml(pkT('pk_notes')) + '</label><textarea id="pkNotes" maxlength="1500" placeholder="' + escapeHtml(pkT('pk_notes_ph')) + '"></textarea></div>' +
        '<div class="field"><label for="pkPhotos">' + escapeHtml(pkT('pk_photos')) + '</label><input id="pkPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple>' +
          '<span class="hint" id="pkPhotoHint">' + escapeHtml(pkT('pk_photos_hint')) + '</span></div>' +
        '<p class="tiny" id="pkEstateNote" hidden></p>' +
      '</div>' +

      '<div class="card section-card"><h2 style="margin-top:0">2. ' + escapeHtml(pkT('pk_step_outputs')) + '</h2>' +
        '<div class="pack-opts" id="pkOpts">' + pkPackChecklistHtml(preLines) + '</div>' +
        '<p class="tiny" style="margin-top:0.6rem">' + escapeHtml(pkT('pack_free')) + '</p>' +
      '</div>' +

      '<div class="card section-card"><h2 style="margin-top:0">3. ' + escapeHtml(pkT('pk_step_brand')) + '</h2>' +
        '<label class="check"><input type="checkbox" id="pkBrand" checked> ' + escapeHtml(pkT('pk_use_kit')) + '</label>' +
        pkBrandKitSummaryHtml(st) +
        '<p class="tiny">' + escapeHtml(pkT('bk_private')) + ' <a class="link" href="#profile">' + escapeHtml(pkT('bk_edit')) + '</a></p>' +
      '</div>' +

      '<div class="review-box"><div class="total"><span>' + escapeHtml(pkT('pack_total')) + '</span> <b id="pkTotal"></b></div>' +
        '<div class="tiny">' + escapeHtml(pkT('pack_total_note')) + '</div></div>' +
      '<div class="form-msg" id="pkMsg" role="alert"></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit" id="pkSubmit">' + escapeHtml(pkT('pk_review')) + '</button><a class="btn btn-secondary" href="#home">' + escapeHtml(pkT('pk_cancel')) + '</a></div>' +
    '</form>');

  const f = document.getElementById('packForm');
  const v = function (id) { return document.getElementById(id); };
  let chosen = listing;

  function fill(l) {
    chosen = l;
    v('pkPurpose').value = l && l.type === 'rent' ? 'rent' : 'sale';
    if (l && v('pkType').querySelector('option[value="' + l.property_type + '"]')) v('pkType').value = l.property_type;
    v('pkCity').value = l ? l.city || '' : '';
    v('pkArea').value = l ? l.area || '' : '';
    v('pkPrice').value = l && l.price ? String(l.price) : '';
    v('pkSize').value = l && Number(l.size_marla) > 0 ? l.size_marla + ' ' + (l.size_unit || 'marla') : '';
    v('pkBeds').value = l && l.beds ? l.beds : '';
    v('pkBaths').value = l && l.baths ? l.baths : '';
    v('pkNotes').value = l ? (l.title + (l.description ? '\n' + l.description : '')).slice(0, 1500) : '';
    const note = v('pkEstateNote');
    note.hidden = !l;
    if (l) note.textContent = pkT('pk_prefilled').replace('{n}', (l.photos || []).length);
  }
  if (listing) fill(listing);
  const sel = v('pkListing');
  if (sel) sel.addEventListener('change', function () {
    fill(owned.find(function (l) { return l.id === sel.value; }) || null);
  });

  function total() {
    const t = pkPackTotal(v('pkOpts'));
    v('pkTotal').textContent = Rs(t.total);
    return t;
  }
  total();
  v('pkOpts').addEventListener('change', total);

  function photosOk() {
    const files = Array.prototype.slice.call(v('pkPhotos').files || []);
    if (files.length > PK_MAX_PHOTOS) return pkT('pk_too_many').replace('{n}', PK_MAX_PHOTOS);
    const bad = files.find(function (x) { return !/^image\/(jpeg|png|webp)$/.test(x.type) || x.size > PK_MAX_PHOTO_MB * 1048576; });
    return bad ? pkT('pk_bad_file').replace('{name}', bad.name).replace('{mb}', PK_MAX_PHOTO_MB) : '';
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    const msg = v('pkMsg');
    msg.className = 'form-msg'; msg.textContent = '';
    const t = total();
    const area = v('pkArea').value.trim();
    const err = !t.lines.length ? pkT('pk_pick_one') : !area ? pkT('pk_need_area') : photosOk();
    if (err) { msg.textContent = err; msg.className = 'form-msg error'; return; }

    const details = {
      pack: 'property-marketing-pack',
      purpose: v('pkPurpose').value, property_type: v('pkType').value,
      city: v('pkCity').value.trim(), area: area,
      price: v('pkPrice').value.replace(/[^0-9]/g, ''), size: v('pkSize').value.trim(),
      beds: v('pkBeds').value.replace(/[^0-9]/g, ''), baths: v('pkBaths').value.replace(/[^0-9]/g, ''),
      notes: v('pkNotes').value.trim()
    };
    if (chosen) {
      details.estate_listing_id = chosen.id;
      details.estate_listing_url = PK_CONFIG.estateUrl + '/listing.html?id=' + chosen.id;
      details.estate_photos = (chosen.photos || []).map(pkSafePhoto).filter(Boolean).slice(0, 8);
    }
    Object.keys(details).forEach(function (k) { if (details[k] === '' || (Array.isArray(details[k]) && !details[k].length)) delete details[k]; });
    const useKit = v('pkBrand').checked;
    const items = t.lines.map(function (id) { return { line_id: id, quantity: 1, details: details, use_brand_kit: useKit }; });

    // Review before anything is created.
    const rows = t.lines.map(function (id) { const h = window.PK_DATA.lines[id]; return '<li>' + escapeHtml(pkPick(h.service, 'name')) + ' — ' + Rs(h.line.price) + '</li>'; }).join('');
    const dlg = pkDialog('<h3>' + escapeHtml(pkT('pk_confirm_title')) + '</h3>' +
      '<p class="tiny">' + escapeHtml([details.area, details.city].filter(Boolean).join(', ')) + (chosen ? ' · ' + escapeHtml(pkT('pk_from_estate')) : '') + '</p>' +
      '<ul class="sd-list" style="margin:0.6rem 0">' + rows + '</ul>' +
      '<div class="review-box"><div class="total">' + Rs(t.total) + '</div><div class="tiny">' + escapeHtml(pkT('pk_confirm_note')) + '</div></div>' +
      '<div class="form-msg" id="pkcMsg"></div>' +
      '<div class="btn-row"><button class="btn btn-primary" id="pkcGo" type="button">' + escapeHtml(pkT('pk_place')) + '</button><button class="btn btn-secondary" type="button" data-close>' + escapeHtml(pkT('pk_back')) + '</button></div>');
    dlg.querySelector('#pkcGo').addEventListener('click', async function () {
      const go = this; go.disabled = true; go.textContent = pkT('auth_wait');
      const res = await PkDB.placeOrder(items);
      if (res.error) { go.disabled = false; go.textContent = pkT('pk_place'); const m = dlg.querySelector('#pkcMsg'); m.textContent = res.error; m.className = 'form-msg error'; return; }
      const first = res.rows[0];
      const files = Array.prototype.slice.call(v('pkPhotos').files || []);
      for (let i = 0; i < files.length; i++) await PkDB.uploadAttachment(Dash.user.id, { id: first.task_id, public_id: first.public_id }, files[i]);
      pkTrack('pack_order', 'dashboard', { lines: t.lines.length, estate: Boolean(chosen) });
      dlg.close();
      pkDialog('<h3>' + escapeHtml(pkT('pk_done_title')) + '</h3><p>' + escapeHtml(pkT('pk_done_ids')) + ' <strong class="mono gold">' + res.rows.map(function (r) { return escapeHtml(r.public_id); }).join(', ') + '</strong></p>' +
        '<p class="muted" style="margin:0.6rem 0">' + escapeHtml(pkT('pk_done_invoice').replace('{inv}', first.invoice_number)) + '</p>' +
        '<div class="btn-row"><a class="btn btn-primary" href="#task/' + escapeHtml(first.public_id) + '" data-close>' + escapeHtml(pkT('pk_open_task')) + '</a><a class="btn btn-secondary" href="#tasks" data-close>' + escapeHtml(pkT('d_tasks')) + '</a></div>');
    });
  });
}

/* ---------------- register ---------------- */
ROUTES.pack = viewPack;
ROUTES.listings = viewListingsP2;
