/* Six cities: launch announcement + city/area helpers for AgenticCore Pakistan.
   The *_live texts replace their keys automatically from 00:00 PKT on
   6 October 2026 (acApplyLaunchCopy in ac-cities.js). */
Object.assign(PK_I18N.en, {
  nc_badge: 'New cities · Tuesday 6 October 2026',
  nc_badge_live: 'New cities · now live',
  nc_title: 'Coming to Lahore, Karachi, Sialkot and Faisalabad on Tuesday 6 October 2026.',
  nc_title_live: 'Now in Lahore, Karachi, Sialkot and Faisalabad.',
  nc_sub: 'From 6 October you can list your property free and use our marketing services in these cities.',
  nc_sub_live: 'List your property free and use our marketing services in all six cities: Islamabad, Rawalpindi, Lahore, Karachi, Sialkot & Faisalabad.',
  nc_ro: '6 October 2026 se Lahore, Karachi, Sialkot aur Faisalabad mein: apni property free list karein aur hamari marketing services use karein.',
  nc_ro_live: 'Ab Lahore, Karachi, Sialkot aur Faisalabad mein bhi: apni property free list karein aur hamari marketing services use karein.',
  nc_now: 'You can create your account today — orders for these cities are delivered from launch day.',
  nc_cta_services: 'See marketing services', nc_cta_list: 'List free on AgenticCore Estate', nc_cta_tg: 'Order in Telegram',
  nc_serving: 'Serving 6 cities across Pakistan',
  city_launch_order: 'We launch in {city} on 6 October. You can place the order now; work for {city} starts from launch day.',
  city_other_hint: 'Pick a city or type your own'
});
Object.assign(PK_I18N.ur, {
  nc_badge: 'نئے شہر · منگل 6 اکتوبر 2026',
  nc_badge_live: 'نئے شہر · اب دستیاب',
  nc_title: 'منگل 6 اکتوبر 2026 کو لاہور، کراچی، سیالکوٹ اور فیصل آباد میں آ رہے ہیں۔',
  nc_title_live: 'اب لاہور، کراچی، سیالکوٹ اور فیصل آباد میں بھی۔',
  nc_sub: '6 اکتوبر سے آپ ان شہروں میں اپنی پراپرٹی مفت لسٹ کر سکیں گے اور ہماری مارکیٹنگ سروسز استعمال کر سکیں گے۔',
  nc_sub_live: 'تمام 6 شہروں — اسلام آباد، راولپنڈی، لاہور، کراچی، سیالکوٹ اور فیصل آباد — میں اپنی پراپرٹی مفت لسٹ کریں اور ہماری مارکیٹنگ سروسز استعمال کریں۔',
  nc_ro: '6 October 2026 se Lahore, Karachi, Sialkot aur Faisalabad mein: apni property free list karein aur hamari marketing services use karein.',
  nc_ro_live: 'Ab Lahore, Karachi, Sialkot aur Faisalabad mein bhi: apni property free list karein aur hamari marketing services use karein.',
  nc_now: 'آپ آج ہی اکاؤنٹ بنا سکتے ہیں — ان شہروں کے آرڈر لانچ کے دن سے ڈیلیور ہوں گے۔',
  nc_cta_services: 'مارکیٹنگ سروسز دیکھیں', nc_cta_list: 'AgenticCore Estate پر مفت لسٹ کریں', nc_cta_tg: 'ٹیلی گرام میں آرڈر کریں',
  nc_serving: 'پاکستان کے 6 شہروں میں خدمات',
  city_launch_order: 'ہم 6 اکتوبر کو {city} میں لانچ کر رہے ہیں۔ آپ ابھی آرڈر دے سکتے ہیں؛ {city} کا کام لانچ کے دن سے شروع ہوگا۔',
  city_other_hint: 'شہر منتخب کریں یا خود لکھیں'
});
if (typeof acApplyLaunchCopy === 'function') { acApplyLaunchCopy(PK_I18N.en); acApplyLaunchCopy(PK_I18N.ur); }

// City inputs: suggestions for the six cities (with the launch label) and the
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
