/* Across Pakistan: wording + city/area helpers for AgenticCore Pakistan (no launch dates).
   No city has a launch date now, so the *_live texts always apply
   (acApplyLaunchCopy in ac-cities.js). */
Object.assign(PK_I18N.en, {
  nc_badge: 'Across Pakistan',
  nc_badge_live: 'Across Pakistan',
  nc_title: 'Now across Pakistan.',
  nc_title_live: 'Now across Pakistan.',
  nc_sub: 'List your property free and use our marketing services anywhere in Pakistan.',
  nc_sub_live: 'List your property free and use our marketing services anywhere in Pakistan.',
  nc_ro: 'Poore Pakistan mein: apni property free list karein aur hamari marketing services use karein.',
  nc_ro_live: 'Poore Pakistan mein: apni property free list karein aur hamari marketing services use karein.',
  nc_now: 'Sign-ups and orders are open across Pakistan.',
  nc_cta_services: 'See marketing services', nc_cta_list: 'List free on AgenticCore Estate', nc_cta_tg: 'Order on WhatsApp',
  nc_serving: 'Serving all of Pakistan',
  city_launch_order: 'You can place the order for {city} now.',
  city_other_hint: 'Pick a city or type your own'
});
Object.assign(PK_I18N.ur, {
  nc_badge: 'پورے پاکستان میں',
  nc_badge_live: 'پورے پاکستان میں',
  nc_title: 'اب پورے پاکستان میں۔',
  nc_title_live: 'اب پورے پاکستان میں۔',
  nc_sub: 'پاکستان میں کہیں بھی اپنی پراپرٹی مفت لسٹ کریں اور ہماری مارکیٹنگ سروسز استعمال کریں۔',
  nc_sub_live: 'پاکستان میں کہیں بھی اپنی پراپرٹی مفت لسٹ کریں اور ہماری مارکیٹنگ سروسز استعمال کریں۔',
  nc_ro: 'Poore Pakistan mein: apni property free list karein aur hamari marketing services use karein.',
  nc_ro_live: 'Poore Pakistan mein: apni property free list karein aur hamari marketing services use karein.',
  nc_now: 'پورے پاکستان میں سائن اپ اور آرڈر کھلے ہیں۔',
  nc_cta_services: 'مارکیٹنگ سروسز دیکھیں', nc_cta_list: 'AgenticCore Estate پر مفت لسٹ کریں', nc_cta_tg: 'واٹس ایپ پر آرڈر کریں',
  nc_serving: 'پورے پاکستان میں خدمات',
  city_launch_order: 'آپ ابھی {city} کے لیے آرڈر دے سکتے ہیں۔',
  city_other_hint: 'شہر منتخب کریں یا خود لکھیں'
});
if (typeof acApplyLaunchCopy === 'function') { acApplyLaunchCopy(PK_I18N.en); acApplyLaunchCopy(PK_I18N.ur); }

// City inputs: suggestions for the cities we know and the
// areas of the chosen city; free text still allowed. Mark inputs with
// data-city-input, and the area input with data-area-for="<city input id>".
function pkEnhanceCityInputs(root) {
  if (typeof AC_CITIES === 'undefined') return;
  (root || document).querySelectorAll('input[data-city-input]').forEach(function (inp) {
    if (inp.dataset.cityReady) return;
    inp.dataset.cityReady = '1';
    const list = document.createElement('datalist');
    list.id = (inp.id || 'city') + 'List';
    list.innerHTML = AC_CITIES.cities.map(function (c) { return '<option value="' + c.name + '" label="' + acCityLabel(c.name, acUiLang()).replace(/"/g, '') + '"></option>'; }).join('');
    inp.setAttribute('list', list.id);
    inp.insertAdjacentElement('afterend', list);
    const note = document.createElement('p');
    note.className = 'tiny ac-city-note'; note.hidden = true; note.setAttribute('role', 'status');
    list.insertAdjacentElement('afterend', note);
    const area = (root || document).querySelector('input[data-area-for="' + inp.id + '"]');
    let areaList = null;
    if (area) { areaList = document.createElement('datalist'); areaList.id = (area.id || 'area') + 'List'; area.setAttribute('list', areaList.id); area.insertAdjacentElement('afterend', areaList); }
    const sync = function () {
      const match = AC_CITIES.cities.find(function (c) { return c.name.toLowerCase() === inp.value.trim().toLowerCase(); });
      const on = match && acCityLaunching(match.name);
      note.hidden = !on;
      if (on) note.textContent = pkT('city_launch_order').replace(/\{city\}/g, match.name);
      if (areaList) areaList.innerHTML = match ? acCityAreas(match.name).concat(typeof acCityMoreAreas === 'function' ? acCityMoreAreas(match.name) : []).map(function (a) { return '<option value="' + a.replace(/"/g, '&quot;') + '"></option>'; }).join('') : '';
    };
    inp.addEventListener('input', sync); inp.addEventListener('change', sync);
    sync();
  });
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
  pkEnhanceCityInputs(document);
  // forms built later (order dialog, proposal, profile) get the same help
  if (typeof MutationObserver === 'function') new MutationObserver(function () {
    if (document.querySelector('input[data-city-input]:not([data-city-ready])')) pkEnhanceCityInputs(document);
  }).observe(document.body, { childList: true, subtree: true });
});
if (typeof pkOnLanguageChange === 'function' && typeof acRefreshLaunchLabels === 'function') pkOnLanguageChange(acRefreshLaunchLabels);
